// services/recommendationService.ts
import { qlooService, QlooRecommendation } from './qlooService';
import { geminiService } from './geminiService';
import { tmdbService, MovieMetadata, TvShowMetadata } from './tmdbService';
import { bookService, BookMetadata } from './bookService';
import { FavoriteFilm, FavoriteBook, FavoriteTvShow } from '@/types';
import { supabase } from '@/lib/supabase';

export interface EnrichedRecommendation {
  id: string; // Cet ID sera celui de TMDb ou Google Books
  title: string;
  type: 'film' | 'book' | 'tvShow';
  description: string;
  posterUrl: string | null;
  geminiExplanation: string;
  releaseYear?: string;
}

export interface ParticipantPreferences {
  name: string;
  films: FavoriteFilm[];
  books: FavoriteBook[];
  tvShows: FavoriteTvShow[];
}

export type EventCategory = 'film' | 'book' | 'tvShow';

export class RecommendationService {

  async generateAndStoreRecommendations(eventId: string, participants: ParticipantPreferences[], category: EventCategory, userLanguage: string): Promise<void> {
    const recommendations = await this.generateRecommendations(participants, category, userLanguage);
    const recommendationsToStore = recommendations.map(rec => ({
      title: rec.title,
      description: rec.description,
      poster_url: rec.posterUrl,
      gemini_explanation: rec.geminiExplanation,
      release_year: rec.releaseYear,
      external_id: rec.id
    }));
    const { error } = await supabase.rpc('store_recommendations_for_event', { p_event_id: eventId, p_recommendations: recommendationsToStore });
    if (error) {
      console.error("Failed to store recommendations:", error);
      throw error;
    }
  }

  async generateRecommendations(participants: ParticipantPreferences[], category: EventCategory, userLanguage: string): Promise<EnrichedRecommendation[]> {
    const participantNames = participants.map(p => p.name);
    const preferencesMap = participants.reduce((acc, p) => {
        acc[p.name] = { films: p.films.map(f => f.title), books: p.books.map(b => b.title), tvShows: p.tvShows.map(t => t.title) };
        return acc;
    }, {} as Record<string, any>);

    let recommendations: { id: string; title: string; qlooOriginalEntity?: any }[] = [];
    const recommendationCount = 3;

    const allCollectedRawIds = participants.flatMap(p => [
        ...(p.films || []).map((f: FavoriteFilm) => f.qlooId?.replace(/^urn:entity:movie:/, '')), 
        ...(p.books || []).map((b: FavoriteBook) => b.qlooId?.replace(/^urn:entity:book:/, '')),   
        ...(p.tvShows || []).map((t: FavoriteTvShow) => t.qlooId?.replace(/^urn:entity:tv_show:/, '')) 
      ]).filter((id): id is string => !!id && id.trim() !== '');

    const cleanedAndUniqueIds = [...new Set(allCollectedRawIds)];
    
    // CORRECTION DÉFINITIVE : On ne fait l'appel à Qloo que si on a au moins un ID.
    if (cleanedAndUniqueIds.length > 0) {
      const idsStringForQloo = cleanedAndUniqueIds.join(',');
      console.log(`[RecommendationService] Calling Qloo with IDs: ${idsStringForQloo}`);
      const qlooRecos = await qlooService.getRecommendations(idsStringForQloo, category, 10);
      if (qlooRecos && qlooRecos.length > 0) {
        recommendations = this.shuffleAndTake(qlooRecos.map(r => ({ id: r.id.toString(), title: r.title, qlooOriginalEntity: r.metadata })), recommendationCount);
      }
    } else {
      console.log("[RecommendationService] No Qloo IDs found, skipping Qloo API call and proceeding to fallback.");
    }
    
    if (recommendations.length < recommendationCount) {
      let fallbackRecos: { id: string; title: string }[] = [];
      const allParticipantKeywords = this.extractAllKeywordsAndGenres(participants, category);

      if (category === 'film') fallbackRecos = await this.getTMDbMovieFallback(participants, allParticipantKeywords);
      else if (category === 'tvShow') fallbackRecos = await this.getTMDbTvShowFallback(participants, allParticipantKeywords);
      else if (category === 'book') fallbackRecos = await this.getBookRecommendationsFallback(participants, allParticipantKeywords);
      
      const existingTitles = new Set(recommendations.map(r => r.title));
      const additionalRecos = fallbackRecos.filter(fr => !existingTitles.has(fr.title));
      recommendations.push(...this.shuffleAndTake(additionalRecos, recommendationCount - recommendations.length));

      if (recommendations.length === 0) {
        recommendations = qlooService.getFallbackRecommendations(category, recommendationCount);
      }
    }

    const enrichmentPromises = recommendations.map(async (rec) => {
      let description = `Une excellente suggestion pour le groupe.`;
      let posterUrl: string | null = null;
      let releaseYear: string | undefined = undefined;
      let finalId: string = rec.id;
      
      try {
        if (category === 'film') {
          const tmdbIdFromQloo = rec.qlooOriginalEntity?.external?.tmdb?.[0]?.id;
          let details: MovieMetadata | null = null;
          if (tmdbIdFromQloo) {
            details = await tmdbService.getFilmDetails(parseInt(tmdbIdFromQloo, 10));
          } else {
            const searchResults = await tmdbService.searchMovie(rec.title);
            details = searchResults.length > 0 ? searchResults[0] : null;
          }
          
          if (details) {
            finalId = details.id.toString();
            description = details.overview || description;
            posterUrl = tmdbService.getImageUrl(details.poster_path);
            releaseYear = details.release_date?.split('-')[0];
          }
        } else if (category === 'book') {
          const bookResults = await bookService.searchBook(`intitle:"${rec.title}"`, 1);
          if (bookResults.length > 0) {
            finalId = bookResults[0].id;
            posterUrl = bookResults[0].coverImageUrl;
            description = bookResults[0].description || description;
          }
        } else if (category === 'tvShow') {
          const tmdbIdFromQloo = rec.qlooOriginalEntity?.external?.tmdb?.[0]?.id;
          let details: TvShowMetadata | null = null;
          if (tmdbIdFromQloo) {
            details = await tmdbService.getTvShowDetails(parseInt(tmdbIdFromQloo, 10));
          } else {
            const searchResults = await tmdbService.searchTvShow(rec.title);
            details = searchResults.length > 0 ? searchResults[0] : null;
          }

          if (details) {
            finalId = details.id.toString();
            description = details.overview || description;
            posterUrl = tmdbService.getImageUrl(details.poster_path);
            releaseYear = details.first_air_date?.split('-')[0];
          }
        }
      } catch (e) {
        console.error(`Erreur lors de l'enrichissement pour "${rec.title}"`, e);
      }
      
      const geminiExplanation = await geminiService.generateExplanation(rec.title, category, participantNames, preferencesMap, userLanguage);

      return {
        id: finalId,
        title: rec.title, 
        type: category, 
        description, 
        posterUrl,
        geminiExplanation, 
        releaseYear
      };
    });
    
    const enriched = await Promise.all(enrichmentPromises);
    return enriched.filter(rec => !rec.id.startsWith('qloo_') && !rec.id.startsWith('fallback_'));
  }
  
  private shuffleAndTake<T>(array: T[], count: number): T[] {
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  private extractAllKeywordsAndGenres(participants: ParticipantPreferences[], category: EventCategory): string[] {
    let keywords: string[] = [];
    participants.forEach(p => {
      if (category === 'film') {
        p.films.forEach(f => {
          if (f.metadata?.genres) keywords = keywords.concat(f.metadata.genres);
          if (f.metadata?.keywords) keywords = keywords.concat(f.metadata.keywords);
        });
      } else if (category === 'book') {
        p.books.forEach(b => {
          if (b.metadata?.genres) keywords = keywords.concat(b.metadata.genres);
          if (b.metadata?.keywords) keywords = keywords.concat(b.metadata.keywords);
          if (b.categories) keywords = keywords.concat(b.categories);
        });
      } else if (category === 'tvShow') {
        p.tvShows.forEach(t => {
          if (t.metadata?.genres) keywords = keywords.concat(t.metadata.genres);
          if (t.metadata?.keywords) keywords = keywords.concat(t.metadata.keywords);
        });
      }
    });
    return [...new Set(keywords.filter(k => k && k.trim() !== ''))];
  }

  private async getTMDbMovieFallback(participants: ParticipantPreferences[], additionalKeywords: string[]): Promise<{ id: string; title: string }[]> {
    const allFavorites = participants.flatMap(p => p.films);
    const favoriteIds = new Set(allFavorites.map(f => f.id));
    const allKeywords = this.extractAllKeywordsAndGenres(participants, 'film').concat(additionalKeywords);
    let searchPromises: Promise<MovieMetadata[]>[] = [];
    if (allKeywords.length > 0) {
      const uniqueKeywords = [...new Set(allKeywords)].slice(0, 3);
      searchPromises = uniqueKeywords.map(keyword => tmdbService.searchMovie(keyword));
    } else if (allFavorites.length > 0) {
      const randomFavorite = allFavorites[Math.floor(Math.random() * allFavorites.length)];
      searchPromises.push(tmdbService.getMovieRecommendations(randomFavorite.id, 10));
    } else {
      searchPromises.push(tmdbService.searchMovie('popular'));
    }
    const resultsArrays = await Promise.all(searchPromises);
    const combinedResults = resultsArrays.flat();
    const newMovies = combinedResults.filter(movie => !favoriteIds.has(movie.id));
    return this.shuffleAndTake(newMovies, 3).map(movie => ({ id: movie.id.toString(), title: movie.title }));
  }

  private async getTMDbTvShowFallback(participants: ParticipantPreferences[], additionalKeywords: string[]): Promise<{ id: string; title: string }[]> {
    const allFavorites = participants.flatMap(p => p.tvShows);
    const favoriteIds = new Set(allFavorites.map(s => s.id));
    const allKeywords = this.extractAllKeywordsAndGenres(participants, 'tvShow').concat(additionalKeywords);
    let searchPromises: Promise<TvShowMetadata[]>[] = [];
    if (allKeywords.length > 0) {
      const uniqueKeywords = [...new Set(allKeywords)].slice(0, 3);
      searchPromises = uniqueKeywords.map(keyword => tmdbService.searchTvShow(keyword));
    } else if (allFavorites.length > 0) {
      const randomFavorite = allFavorites[Math.floor(Math.random() * allFavorites.length)];
      searchPromises.push(tmdbService.getTvShowRecommendations(randomFavorite.id, 10));
    } else {
      searchPromises.push(tmdbService.searchTvShow('popular'));
    }
    const resultsArrays = await Promise.all(searchPromises);
    const combinedResults = resultsArrays.flat();
    const newShows = combinedResults.filter(show => !favoriteIds.has(show.id));
    return this.shuffleAndTake(newShows, 3).map(show => ({ id: show.id.toString(), title: show.name }));
  }

  private async getBookRecommendationsFallback(participants: ParticipantPreferences[], additionalKeywords: string[]): Promise<{ id: string; title: string }[]> {
    const allFavorites = participants.flatMap(p => p.books);
    const favoriteIds = new Set(allFavorites.map(b => b.id));
    const allKeywords = this.extractAllKeywordsAndGenres(participants, 'book').concat(additionalKeywords);
    let searchPromises: Promise<BookMetadata[]>[] = [];
    if (allKeywords.length > 0) {
      const uniqueKeywords = [...new Set(allKeywords)].slice(0, 3);
      searchPromises = uniqueKeywords.map(keyword => bookService.searchBook(keyword, 10));
    } else if (allFavorites.length > 0) {
      const allAuthors = allFavorites.flatMap(book => book?.authors || []).filter(author => author && author !== 'Auteur inconnu');
      if (allAuthors.length > 0) {
        const randomAuthor = allAuthors[Math.floor(Math.random() * allAuthors.length)];
        searchPromises.push(bookService.searchBook(`inauthor:"${randomAuthor}"`, 10));
      }
    }
    if (searchPromises.length === 0) {
        searchPromises.push(bookService.searchBook('popular', 10));
    }
    const resultsArrays = await Promise.all(searchPromises);
    const combinedResults = resultsArrays.flat();
    const newBooks = combinedResults.filter(book => !favoriteIds.has(book.id));
    return this.shuffleAndTake(newBooks, 3).map(book => ({ id: book.id, title: book.title }));
  }
}

export const recommendationService = new RecommendationService();