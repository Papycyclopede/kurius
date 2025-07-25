// types/index.ts

// Nous devons importer EnrichedRecommendation car il est utilisé dans HistoryEvent
// L'importation utilise maintenant l'alias de chemin '@/services/recommendationService'
import { EnrichedRecommendation } from '@/services/recommendationService';

// Métadonnées enrichies de Qloo
export interface QlooMetadata {
  imageUrl?: string | null;
  genres?: string[];
  keywords?: string[];
  themes?: string[];
  external?: { tmdb?: { id: number }[]; google_books?: { id: string }[]; };
}

// Types pour les favoris
export interface FavoriteFilm {
  id: number;
  title: string;
  posterPath: string | null;
  qlooId: string | null; // L'UUID brut de Qloo
  metadata?: QlooMetadata;
}

export interface FavoriteBook {
  id: string;
  title: string;
  authors: string[];
  coverImageUrl: string | null;
  qlooId: string | null; // L'UUID brut de Qloo
  metadata?: QlooMetadata;
  categories?: string[];
}

export interface FavoriteTvShow {
  id: number;
  title: string;
  posterPath: string | null;
  qlooId: string | null; // L'UUID brut de Qloo
  metadata?: QlooMetadata;
}

// Le type HistoryEvent, utilisant EnrichedRecommendation
export interface HistoryEvent {
  id: string;
  date: string;
  category: 'film' | 'book' | 'tvShow';
  participants: string[];
  chosenItem: EnrichedRecommendation; // Utilisation de l'interface EnrichedRecommendation
}

// Le type WeightedEntity
export interface WeightedEntity {
  entity: string;
  weight: number;
}