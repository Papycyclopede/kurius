// services/recipeService.ts
import axios from 'axios';

const API_KEY = process.env.EXPO_PUBLIC_SPOONACULAR_API_KEY;
const BASE_URL = 'https://api.spoonacular.com';

export interface RecipeMetadata {
  id: number;
  title: string;
  imageUrl: string | null;
}

// NOUVELLE INTERFACE pour la fiche recette complète
export interface RecipeDetails extends RecipeMetadata {
  readyInMinutes: number;
  servings: number;
  ingredients: { name: string; original: string }[];
  instructions: { step: string; }[];
}

export class RecipeService {
  private apiKey = API_KEY;

  async searchRecipe(query: string, limit: number = 10): Promise<RecipeMetadata[]> {
    if (!this.apiKey) {
      console.error("Clé API Spoonacular manquante.");
      return [];
    }
    try {
      const response = await axios.get(`${BASE_URL}/recipes/complexSearch`, {
        params: { query, number: limit, apiKey: this.apiKey }
      });
      return this.formatSearchResults(response.data.results);
    } catch (error) {
      console.error('Erreur recherche Spoonacular:', error);
      return [];
    }
  }

  // NOUVELLE FONCTION pour récupérer les détails d'une recette
  async getRecipeDetails(id: number): Promise<RecipeDetails | null> {
    if (!this.apiKey) {
      console.error("Clé API Spoonacular manquante.");
      return null;
    }
    try {
      const response = await axios.get(`${BASE_URL}/recipes/${id}/information`, {
        params: { apiKey: this.apiKey, includeNutrition: false }
      });
      const data = response.data;
      return {
        id: data.id,
        title: data.title,
        imageUrl: data.image,
        readyInMinutes: data.readyInMinutes,
        servings: data.servings,
        ingredients: data.extendedIngredients.map((ing: any) => ({ name: ing.name, original: ing.original })),
        // Les instructions sont parfois groupées, on les aplatit en une seule liste
        instructions: data.analyzedInstructions?.[0]?.steps.map((s: any) => ({ step: s.step })) || [],
      };
    } catch (error) {
      console.error(`Erreur détails recette Spoonacular pour l'ID ${id}:`, error);
      return null;
    }
  }

  private formatSearchResults(results: any[]): RecipeMetadata[] {
    return results.map(recipe => ({
      id: recipe.id,
      title: recipe.title || 'Titre inconnu',
      imageUrl: recipe.image || null
    }));
  }
}

export const recipeService = new RecipeService();