// services/qlooService.ts
import axios from 'axios';
import { WeightedEntity } from '@/types';

export interface SearchData {
  title: string;
  year?: string;
}

const API_KEY = process.env.EXPO_PUBLIC_QLOO_API_KEY;
const API_BASE_URL = 'https://hackathon.api.qloo.com'; 

export const QLOO_ENTITY_TYPES: Record<'film' | 'book' | 'music' | 'tvShow', string> = {
  'film': 'urn:entity:movie',
  'book': 'urn:entity:book',
  'music': 'urn:entity:artist',
  'tvShow': 'urn:entity:tv_show',
};

export interface QlooRecommendation {
  id: string;
  title: string;
  type: 'film' | 'book' | 'music' | 'tvShow';
  score: number;
  metadata?: any;
}

export class QlooService {
  private apiKey = API_KEY;

  async getRecommendations(
    entityUrns: string, // MODIFICATION ICI : Accepte maintenant une chaîne de caractères
    type: 'film' | 'book' | 'music' | 'tvShow',
    count: number = 10
  ): Promise<QlooRecommendation[]> {
    if (!this.apiKey) throw new Error("Clé API Qloo manquante.");
    if (!entityUrns || entityUrns.length === 0) return []; // Vérifie si la chaîne est vide

    try {
      // On utilise une requête GET
      const response = await axios.get(`${API_BASE_URL}/v2/insights`, {
        params: {
          'signal.interests.entities': entityUrns, // Pas de join ici, car déjà une chaîne
          'filter.type': QLOO_ENTITY_TYPES[type],
          'take': count,
        },
        headers: { 
          'X-Api-Key': this.apiKey, 
          'Accept': 'application/json'
        }
      });
      return this.formatRecommendations(response.data?.results?.entities, type);
    } catch (error) {
      if (axios.isAxiosError(error)) { 
        console.error('Erreur API Qloo (getRecommendations GET):', error.response?.data || error.message); 
      } else { 
        console.error('Erreur inconnue (getRecommendations GET):', error); 
      }
      return [];
    }
  }

  async searchContent(searchData: SearchData, type: 'film' | 'book' | 'music' | 'tvShow', limit: number = 5): Promise<any[]> {
    if (!this.apiKey) return [];
    try {
      const query = `${searchData.title} ${searchData.year || ''}`.trim();
      const response = await axios.get(`${API_BASE_URL}/search`, {
        params: { query, types: QLOO_ENTITY_TYPES[type], take: limit },
        headers: { 'X-Api-Key': this.apiKey, 'Accept': 'application/json' }
      });
      return response.data?.results || []; 
    } catch (error) {
      if (axios.isAxiosError(error)) { console.error(`Erreur recherche Qloo (Axios) pour "${searchData.title}":`, error.response?.data || error.message); }
      else { console.error('Erreur inconnue (searchContent):', error); }
      return [];
    }
  }

  private formatRecommendations(recommendations: any[] | undefined, type: 'film' | 'book' | 'music' | 'tvShow'): QlooRecommendation[] {
    if (!recommendations || recommendations.length === 0) return [];
    return recommendations.map((rec, index) => ({
      id: rec.entity_id || `qloo_${type}_${index}`,
      title: rec.name || 'Titre inconnu',
      type: type,
      score: rec.popularity || (1 - index / recommendations.length),
      metadata: rec.properties || {}
    }));
  }

  getFallbackRecommendations(type: 'film' | 'book' | 'tvShow', count: number): QlooRecommendation[] {
    const fallbacks = {
      film: [{ title: 'Le Voyage de Chihiro', score: 95 }, { title: 'The Grand Budapest Hotel', score: 92 }, { title: 'Parasite', score: 91 }],
      book: [{ title: 'Le Petit Prince', score: 94 }, { title: '1984', score: 91 }, { title: 'Dune', score: 90 }],
      tvShow: [{ title: 'Fleabag', score: 93 }, { title: 'Arcane', score: 92 }, { title: 'Chernobyl', score: 90 }],
      music: []
    };
    return fallbacks[type].slice(0, count).map((item, index) => ({ id: `fallback_${type}_${index}`, title: item.title, type: type, score: item.score, metadata: {} }));
  }
}

export const qlooService = new QlooService();