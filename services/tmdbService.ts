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

  // CORRECTION : La fonction accepte maintenant une région potentiellement nulle/undefined et la sécurise
  async getWatchProviders(id: number, type: 'movie' | 'tv', region: string | undefined | null): Promise<WatchProvidersResponse | null> {
    if (!this.checkApiKey()) return null;
    
    // On s'assure d'avoir une région valide, avec 'US' par défaut pour éviter l'erreur
    const effectiveRegion = region || 'US';

    try {
      const response = await axios.get(`${BASE_URL}/${type}/${id}/watch/providers`, {
        params: { api_key: this.apiKey }
      });
      // On utilise le code de région sécurisé pour récupérer les bons fournisseurs
      return response.data.results?.[effectiveRegion.toUpperCase()] || null;
    } catch (error) {
      console.error(`Erreur TMDb (getWatchProviders) pour l'ID ${id} et la région ${effectiveRegion}:`, error);
      return null;
    }
  }

  // MODIFICATION : Ajout du paramètre language
  async searchMovie(title: string, language: string = 'en-US'): Promise<MovieMetadata[]> {
    if (!this.checkApiKey()) return [];
    try {
      const response = await axios.get(`${BASE_URL}/search/movie`, {
        params: { api_key: this.apiKey, query: title, language: language } // Utilisation de language
      });
      return response.data.results || [];
    } catch (error) {
      console.error('Erreur TMDb (searchMovie):', error);
      return [];
    }
  }

  // MODIFICATION : Ajout du paramètre language
  async searchTvShow(query: string, language: string = 'en-US'): Promise<TvShowMetadata[]> {
    if (!this.checkApiKey()) return [];
    try {
      const response = await axios.get(`${BASE_URL}/search/tv`, {
        params: { api_key: this.apiKey, query: query, language: language } // Utilisation de language
      });
      return response.data.results || [];
    } catch (error) {
      console.error('Erreur TMDb (searchTvShow):', error);
      return [];
    }
  }

  // MODIFICATION : Ajout du paramètre language
  async getFilmDetails(id: number, language: string = 'en-US'): Promise<MovieMetadata | null> {
    if (!this.checkApiKey()) return null;
    try {
      const response = await axios.get(`${BASE_URL}/movie/${id}`, {
        params: { api_key: this.apiKey, language: language } // Utilisation de language
      });
      return response.data as MovieMetadata;
    } catch (error) {
      console.error(`Erreur TMDb (getFilmDetails) pour l'ID ${id}:`, error);
      return null;
    }
  }

  // MODIFICATION : Ajout du paramètre language
  async getTvShowDetails(id: number, language: string = 'en-US'): Promise<TvShowMetadata | null> {
    if (!this.checkApiKey()) return null;
    try {
      const response = await axios.get(`${BASE_URL}/tv/${id}`, {
        params: { api_key: this.apiKey, language: language } // Utilisation de language
      });
      return response.data as TvShowMetadata;
    } catch (error) {
      console.error(`Erreur TMDb (getTvShowDetails) pour l'ID ${id}:`, error);
      return null;
    }
  }

  // MODIFICATION : Ajout du paramètre language
  async getMovieRecommendations(movieId: number, limit: number = 10, language: string = 'en-US'): Promise<MovieMetadata[]> {
    if (!this.checkApiKey()) return [];
    try {
      const response = await axios.get(`${BASE_URL}/movie/${movieId}/recommendations`, {
        params: { api_key: this.apiKey, language: language, page: 1 } // Utilisation de language
      });
      return (response.data.results || []).slice(0, limit);
    } catch (error) {
      console.error(`Erreur TMDb (getMovieRecommendations) pour l'ID ${movieId}:`, error);
      return [];
    }
  }

  // MODIFICATION : Ajout du paramètre language
  async getTvShowRecommendations(tvShowId: number, limit: number = 10, language: string = 'en-US'): Promise<TvShowMetadata[]> {
    if (!this.checkApiKey()) return [];
    try {
      const response = await axios.get(`${BASE_URL}/tv/${tvShowId}/recommendations`, {
        params: { api_key: this.apiKey, language: language, page: 1 } // Utilisation de language
      });
      return (response.data.results || []).slice(0, limit);
    } catch (error) {
      console.error(`Erreur TMDb (getTvShowRecommendations) pour l'ID ${tvShowId}:`, error);
      return [];
    }
  }

  getImageUrl(posterPath: string | null | undefined): string {
    return posterPath ? `${IMAGE_BASE_URL}${posterPath}` : '';
  }
}

export const tmdbService = new TMDbService();