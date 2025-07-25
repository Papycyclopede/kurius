// services/bookService.ts
import axios from 'axios';

const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_BOOKS_API_KEY;
const BASE_URL = 'https://www.googleapis.com/books/v1/volumes';

export interface BookMetadata {
  id: string;
  title: string;
  authors: string[];
  description: string;
  coverImageUrl: string | null;
  categories: string[];
  buyLink?: string | null; // MODIFICATION: Ajout du lien d'achat
}

export class BookService {
  private apiKey = API_KEY;

  // MODIFICATION : Ajout d'un paramètre language pour le searchBook pour que Qloo/Gemini le transmettent
  async searchBook(query: string, limit: number = 10, region: string = 'US', language: string = 'en'): Promise<BookMetadata[]> { // Défaut à 'en'
    if (!this.apiKey) {
      console.error("Clé API Google Books manquante. Veuillez l'ajouter à votre fichier .env");
      return [];
    }
    
    try {
      const response = await axios.get(BASE_URL, {
        params: {
          q: query,
          maxResults: limit,
          country: region, // Google Books utilise 'country' pour la pertinence géographique et la langue des résultats
          langRestrict: language, // Ajout de langRestrict pour spécifier la langue des résultats
          key: this.apiKey
        }
      });

      if (response.data.items) {
        return this.formatResults(response.data.items);
      }
      return [];

    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(`Erreur recherche Google Books (Axios) pour "${query}":`, error.response?.data || error.message);
      } else {
        console.error('Erreur inconnue (Google Books):', error);
      }
      return [];
    }
  }

  private formatResults(items: any[]): BookMetadata[] {
    return items.map(item => {
      const volumeInfo = item.volumeInfo;
      let coverUrl = volumeInfo.imageLinks?.thumbnail || null;

      if (coverUrl) {
        coverUrl = coverUrl.replace(/^http:\/\//i, 'https://');
      }

      return {
        id: item.id,
        title: volumeInfo.title || 'Titre inconnu',
        authors: volumeInfo.authors || ['Auteur inconnu'],
        description: volumeInfo.description || 'Pas de description disponible.',
        coverImageUrl: coverUrl,
        categories: volumeInfo.categories || [],
        buyLink: item.saleInfo?.buyLink || null // MODIFICATION: On récupère le lien d'achat
      };
    });
  }
}

export const bookService = new BookService();