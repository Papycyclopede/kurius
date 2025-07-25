// utils/favoriteHelpers.ts

import { FavoriteFilm, FavoriteBook, FavoriteTvShow, QlooMetadata } from '@/types';
import { tmdbService, MovieMetadata, TvShowMetadata } from '@/services/tmdbService';
import { bookService, BookMetadata } from '@/services/bookService';
import { qlooService, QLOO_ENTITY_TYPES } from '@/services/qlooService';

/**
 * Ajoute un film aux favoris avec les métadonnées Qloo.
 * Stocke l'ID Qloo brut (UUID) sans préfixe URN.
 * @param film Les métadonnées du film de TMDb.
 * @returns L'objet FavoriteFilm enrichi.
 */
export async function addFavoriteFilmHelper(film: MovieMetadata): Promise<FavoriteFilm> {
  const year = film.release_date ? film.release_date.split('-')[0] : undefined;
  // Note: searchContent retourne déjà l'entity_id sans le préfixe URN.
  const qlooResults = await qlooService.searchContent({ title: film.title, year }, 'film', 2); 
  
  let newFavorite: FavoriteFilm;

  if (qlooResults.length > 0) {
    const qlooEntity = qlooResults[0];
    const entityId = qlooEntity.entity_id;
    
    // S'assurer que l'ID stocké est l'UUID brut, sans préfixe URN.
    if (typeof entityId === 'string' && entityId.length > 0) {
      const qlooRawId = entityId; // C'est déjà l'UUID brut de searchContent

      const metadata: QlooMetadata = {
        imageUrl: qlooEntity.properties?.image_url || null,
        genres: qlooEntity.properties?.genres?.map((g: any) => g.name) || [],
        keywords: qlooEntity.properties?.keywords?.map((k: any) => k.name) || [],
      };
      // Stocker l'UUID brut directement
      newFavorite = { id: film.id, title: film.title, posterPath: film.poster_path, qlooId: qlooRawId, metadata };
    } else {
      console.warn(`[FavoriteHelper] Qloo a retourné un ID non valide pour le film "${film.title}" (${entityId}). Qloo ID non stocké.`);
      newFavorite = { id: film.id, title: film.title, posterPath: film.poster_path, qlooId: null };
    }
  } else {
    console.warn(`[FavoriteHelper] Aucun ID Qloo trouvé pour le film "${film.title}"`);
    newFavorite = { id: film.id, title: film.title, posterPath: film.poster_path, qlooId: null };
  }
  return newFavorite;
}

/**
 * Ajoute un livre aux favoris avec les métadonnées Qloo.
 * Stocke l'ID Qloo brut (UUID) sans préfixe URN.
 * @param book Les métadonnées du livre de Google Books.
 * @returns L'objet FavoriteBook enrichi.
 */
export async function addFavoriteBookHelper(book: BookMetadata): Promise<FavoriteBook> {
  const qlooResults = await qlooService.searchContent({ title: book.title }, 'book', 2); 
  
  let newFavorite: FavoriteBook;

  if (qlooResults.length > 0) {
      const qlooEntity = qlooResults[0];
      const entityId = qlooEntity.entity_id; 

      if (typeof entityId === 'string' && entityId.length > 0) {
        const qlooRawId = entityId;
        const metadata: QlooMetadata = {
            imageUrl: qlooEntity.properties?.image_url || null,
            genres: qlooEntity.properties?.genres?.map((g: any) => g.name) || [],
            keywords: qlooEntity.properties?.keywords?.map((k: any) => k.name) || [],
        };
        newFavorite = { id: book.id, title: book.title, authors: book.authors, coverImageUrl: book.coverImageUrl, qlooId: qlooRawId, metadata };
      } else {
        console.warn(`[FavoriteHelper] Qloo a retourné un ID non valide pour le livre "${book.title}" (${entityId}). Qloo ID non stocké.`);
        newFavorite = { id: book.id, title: book.title, authors: book.authors, coverImageUrl: book.coverImageUrl, qlooId: null };
      }
  } else {
      console.warn(`[FavoriteHelper] Aucun ID Qloo trouvé pour le livre "${book.title}"`);
      newFavorite = { id: book.id, title: book.title, authors: book.authors, coverImageUrl: book.coverImageUrl, qlooId: null };
  }
  return newFavorite;
}

/**
 * Ajoute une série TV aux favoris avec les métadonnées Qloo.
 * Stocke l'ID Qloo brut (UUID) sans préfixe URN.
 * @param tvShow Les métadonnées de la série TV de TMDb.
 * @returns L'objet FavoriteTvShow enrichi.
 */
export async function addFavoriteTvShowHelper(tvShow: TvShowMetadata): Promise<FavoriteTvShow> {
  const year = tvShow.first_air_date?.split('-')[0];
  const qlooResults = await qlooService.searchContent({ title: tvShow.name, year }, 'tvShow', 2); 
  
  let newFavorite: FavoriteTvShow;

  if (qlooResults.length > 0) {
      const qlooEntity = qlooResults[0];
      const entityId = qlooEntity.entity_id; 

      if (typeof entityId === 'string' && entityId.length > 0) {
        const qlooRawId = entityId;
        const metadata: QlooMetadata = {
            imageUrl: qlooEntity.properties?.image_url || null,
            genres: qlooEntity.properties?.genres?.map((g: any) => g.name) || [],
            keywords: qlooEntity.properties?.keywords?.map((k: any) => k.name) || [],
        };
        newFavorite = { id: tvShow.id, title: tvShow.name, posterPath: tvShow.poster_path, qlooId: qlooRawId, metadata };
      } else {
        console.warn(`[FavoriteHelper] Qloo a retourné un ID non valide pour la série "${tvShow.name}" (${entityId}). Qloo ID non stocké.`);
        newFavorite = { id: tvShow.id, title: tvShow.name, posterPath: tvShow.poster_path, qlooId: null };
      }
  } else {
      console.warn(`[FavoriteHelper] Aucun ID Qloo trouvé pour la série "${tvShow.name}"`);
      newFavorite = { id: tvShow.id, title: tvShow.name, posterPath: tvShow.poster_path, qlooId: null };
  }
  return newFavorite;
}