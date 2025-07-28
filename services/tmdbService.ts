// services/tmdbService.ts
import axios from 'axios';

const API_KEY = process.env.EXPO_PUBLIC_TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

export interface MovieMetadata {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  release_date: string;
}

export interface TvShowMetadata {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  first_air_date: string;
}

export interface WatchProvider {
  provider_id: number;
  provider_name: string;
  logo_path: string;
}

export interface WatchProvidersResponse {
  link: string;
  flatrate?: WatchProvider[];
  rent?: WatchProvider[];
  buy?: WatchProvider[];
}

export class TMDbService {
  private apiKey = API_KEY;

  private checkApiKey(): boolean {
    if (!this.apiKey) {
      console.error("Erreur critique : La clé API de TMDb (EXPO_PUBLIC_TMDB_API_KEY) n'est pas configurée dans votre fichier .env.");
      return false;
    }
    return true;
  }

  async getWatchProviders(id: number, type: 'movie' | 'tv', region: string | undefined | null): Promise<WatchProvidersResponse | null> {
    if (!this.checkApiKey()) return null;
    
    const effectiveRegion = region || 'US';

    try {
      const response = await axios.get(`${BASE_URL}/${type}/${id}/watch/providers`, {
        params: { api_key: this.apiKey }
      });
      return response.data.results?.[effectiveRegion.toUpperCase()] || null;
    } catch (error) {
      console.error(`Erreur TMDb (getWatchProviders) pour l'ID ${id} et la région ${effectiveRegion}:`, error);
      return null;
    }
  }

  async searchMovie(title: string, language: string = 'en-US'): Promise<MovieMetadata[]> {
    if (!this.checkApiKey()) return [];
    try {
      const response = await axios.get(`${BASE_URL}/search/movie`, {
        params: { api_key: this.apiKey, query: title, language: language }
      });
      return response.data.results || [];
    } catch (error) {
      console.error('Erreur TMDb (searchMovie):', error);
      return [];
    }
  }

  async searchTvShow(query: string, language: string = 'en-US'): Promise<TvShowMetadata[]> {
    if (!this.checkApiKey()) return [];
    try {
      const response = await axios.get(`${BASE_URL}/search/tv`, {
        params: { api_key: this.apiKey, query: query, language: language }
      });
      return response.data.results || [];
    } catch (error) {
      console.error('Erreur TMDb (searchTvShow):', error);
      return [];
    }
  }

  async getFilmDetails(id: number, language: string = 'en-US'): Promise<MovieMetadata | null> {
    if (!this.checkApiKey()) return null;
    try {
      const response = await axios.get(`${BASE_URL}/movie/${id}`, {
        params: { api_key: this.apiKey, language: language }
      });
      return response.data as MovieMetadata;
    } catch (error) {
      console.error(`Erreur TMDb (getFilmDetails) pour l'ID ${id}:`, error);
      return null;
    }
  }

  async getTvShowDetails(id: number, language: string = 'en-US'): Promise<TvShowMetadata | null> {
    if (!this.checkApiKey()) return null;
    try {
      const response = await axios.get(`${BASE_URL}/tv/${id}`, {
        params: { api_key: this.apiKey, language: language }
      });
      return response.data as TvShowMetadata;
    } catch (error) {
      console.error(`Erreur TMDb (getTvShowDetails) pour l'ID ${id}:`, error);
      return null;
    }
  }
  
  // --- NOUVELLE FONCTION CORRIGEANT L'ERREUR ---
  async getMovieRecommendations(movieId: number, limit: number = 10): Promise<MovieMetadata[]> {
    if (!this.checkApiKey()) return [];
    try {
      const response = await axios.get(`${BASE_URL}/movie/${movieId}/recommendations`, {
        params: { api_key: this.apiKey }
      });
      return (response.data.results || []).slice(0, limit);
    } catch (error) {
      console.error(`Erreur TMDb (getMovieRecommendations) pour l'ID ${movieId}:`, error);
      return [];
    }
  }

  // --- NOUVELLE FONCTION CORRIGEANT L'ERREUR ---
  async getTvShowRecommendations(tvId: number, limit: number = 10): Promise<TvShowMetadata[]> {
    if (!this.checkApiKey()) return [];
    try {
      const response = await axios.get(`${BASE_URL}/tv/${tvId}/recommendations`, {
        params: { api_key: this.apiKey }
      });
      return (response.data.results || []).slice(0, limit);
    } catch (error) {
      console.error(`Erreur TMDb (getTvShowRecommendations) pour l'ID ${tvId}:`, error);
      return [];
    }
  }
  
  async getClassicOrHighlyRatedMovies(language: string, ageRange: 'child' | 'teen' | 'adult'): Promise<MovieMetadata[]> {
    if (!this.checkApiKey()) return [];
    const params: any = {
      api_key: this.apiKey,
      language: language,
      sort_by: 'popularity.desc',
      'vote_count.gte': 1000,
      page: 1
    };

    switch (ageRange) {
      case 'child':
        params.with_genres = '16|10751';
        break;
      case 'teen':
        params.with_genres = '12|14|878';
        params['vote_average.gte'] = 7;
        break;
      case 'adult':
        params['vote_average.gte'] = 8;
        params['vote_count.gte'] = 5000;
        break;
    }

    try {
      const response = await axios.get(`${BASE_URL}/discover/movie`, { params });
      return response.data.results || [];
    } catch (error) {
      console.error(`Erreur TMDb (getClassicOrHighlyRatedMovies) pour ageRange ${ageRange}:`, error);
      return [];
    }
  }

  async getClassicOrHighlyRatedTvShows(language: string, ageRange: 'child' | 'teen' | 'adult'): Promise<TvShowMetadata[]> {
    if (!this.checkApiKey()) return [];
    const params: any = {
      api_key: this.apiKey,
      language: language,
      sort_by: 'popularity.desc',
      'vote_count.gte': 500,
      page: 1
    };

    switch (ageRange) {
      case 'child':
        params.with_genres = '16|10762';
        break;
      case 'teen':
        params.with_genres = '10759|10765';
        params['vote_average.gte'] = 7;
        break;
      case 'adult':
        params.with_genres = '18|80|99';
        params['vote_average.gte'] = 7.5;
        break;
    }

    try {
      const response = await axios.get(`${BASE_URL}/discover/tv`, { params });
      return response.data.results || [];
    } catch (error) {
      console.error(`Erreur TMDb (getClassicOrHighlyRatedTvShows) pour ageRange ${ageRange}:`, error);
      return [];
    }
  }

  async getTrailerKey(id: number, type: 'movie' | 'tv'): Promise<string | null> {
    if (!this.checkApiKey()) return null;
    try {
        const response = await axios.get(`${BASE_URL}/${type}/${id}/videos`, {
            params: { api_key: this.apiKey, language: 'en-US' }
        });
        const videos = response.data.results;
        const trailer = videos.find((video: any) => video.site === 'YouTube' && video.type === 'Trailer');
        return trailer ? trailer.key : null;
    } catch (error) {
        console.error(`Erreur TMDb (getTrailerKey) pour l'ID ${id}:`, error);
        return null;
    }
  }

  getImageUrl(posterPath: string | null | undefined): string {
    return posterPath ? `${IMAGE_BASE_URL}${posterPath}` : '';
  }
}

export const tmdbService = new TMDbService();