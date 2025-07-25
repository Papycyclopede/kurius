// src/utils/favoriteHelpers.ts

import { FavoriteFilm, FavoriteBook, FavoriteTvShow, QlooMetadata } from '@/types';
import { tmdbService, MovieMetadata, TvShowMetadata } from '@/services/tmdbService';
import { bookService, BookMetadata } from '@/services/bookService';
import { qlooService, QLOO_ENTITY_TYPES } from '@/services/qlooService';

/**
 * Ajoute un film aux favoris avec les métadonnées Qloo.
 * @param film Les métadonnées du film de TMDb.
 * @returns L'objet FavoriteFilm enrichi.
 */
export async function addFavoriteFilmHelper(film: MovieMetadata): Promise<FavoriteFilm> {
  const year = film.release_date ? film.release_date.split('-')[0] : undefined;
  const searchPayload = { title: film.title, year };
  
  // --- LOGS DE DÉBOGAGE ---
  console.log('[DEBUG Qloo Film] Recherche pour :', JSON.stringify(searchPayload));
  const qlooResults = await qlooService.searchContent(searchPayload, 'film', 2);
  console.log('[DEBUG Qloo Film] Résultats bruts de Qloo :', JSON.stringify(qlooResults, null, 2));
  // --- FIN DES LOGS ---

  let newFavorite: FavoriteFilm;

  if (qlooResults.length > 0) {
    const qlooEntity = qlooResults[0];
    const qlooId = `${QLOO_ENTITY_TYPES['film']}:${qlooEntity.entity_id}`;

    const metadata: QlooMetadata = {
      imageUrl: qlooEntity.properties?.image_url || null,
      genres: qlooEntity.properties?.genres?.map((g: any) => g.name) || [],
      keywords: qlooEntity.properties?.keywords?.map((k: any) => k.name) || [],
    };
    newFavorite = { id: film.id, title: film.title, posterPath: film.poster_path, qlooId: qlooId, metadata };
  } else {
    console.warn(`[FavoriteHelper] Aucun ID Qloo trouvé pour le film "${film.title}"`);
    newFavorite = { id: film.id, title: film.title, posterPath: film.poster_path, qlooId: null };
  }
  return newFavorite;
}

/**
 * Ajoute un livre aux favoris avec les métadonnées Qloo.
 * @param book Les métadonnées du livre de Google Books.
 * @returns L'objet FavoriteBook enrichi.
 */
export async function addFavoriteBookHelper(book: BookMetadata): Promise<FavoriteBook> {
  const searchPayload = { title: book.title };

  // --- LOGS DE DÉBOGAGE ---
  console.log('[DEBUG Qloo Book] Recherche pour :', JSON.stringify(searchPayload));
  const qlooResults = await qlooService.searchContent(searchPayload, 'book', 2);
  console.log('[DEBUG Qloo Book] Résultats bruts de Qloo :', JSON.stringify(qlooResults, null, 2));
  // --- FIN DES LOGS ---
  
  let newFavorite: FavoriteBook;

  if (qlooResults.length > 0) {
      const qlooEntity = qlooResults[0];
      const qlooId = `${QLOO_ENTITY_TYPES['book']}:${qlooEntity.entity_id}`;
      const metadata: QlooMetadata = {
          imageUrl: qlooEntity.properties?.image_url || null,
          genres: qlooEntity.properties?.genres?.map((g: any) => g.name) || [],
          keywords: qlooEntity.properties?.keywords?.map((k: any) => k.name) || [],
      };
      newFavorite = { id: book.id, title: book.title, authors: book.authors, coverImageUrl: book.coverImageUrl, qlooId: qlooId, metadata };
  } else {
      console.warn(`[FavoriteHelper] Aucun ID Qloo trouvé pour le livre "${book.title}"`);
      newFavorite = { id: book.id, title: book.title, authors: book.authors, coverImageUrl: book.coverImageUrl, qlooId: null };
  }
  return newFavorite;
}

/**
 * Ajoute une série TV aux favoris avec les métadonnées Qloo.
 * @param tvShow Les métadonnées de la série TV de TMDb.
 * @returns L'objet FavoriteTvShow enrichi.
 */
export async function addFavoriteTvShowHelper(tvShow: TvShowMetadata): Promise<FavoriteTvShow> {
  const year = tvShow.first_air_date?.split('-')[0];
  const searchPayload = { title: tvShow.name, year };

  // --- LOGS DE DÉBOGAGE ---
  console.log('[DEBUG Qloo TV Show] Recherche pour :', JSON.stringify(searchPayload));
  const qlooResults = await qlooService.searchContent(searchPayload, 'tvShow', 2);
  console.log('[DEBUG Qloo TV Show] Résultats bruts de Qloo :', JSON.stringify(qlooResults, null, 2));
  // --- FIN DES LOGS ---
  
  let newFavorite: FavoriteTvShow;

  if (qlooResults.length > 0) {
      const qlooEntity = qlooResults[0];
      const qlooId = `${QLOO_ENTITY_TYPES['tvShow']}:${qlooEntity.entity_id}`;
      const metadata: QlooMetadata = {
          imageUrl: qlooEntity.properties?.image_url || null,
          genres: qlooEntity.properties?.genres?.map((g: any) => g.name) || [],
          keywords: qlooEntity.properties?.keywords?.map((k: any) => k.name) || [],
      };
      newFavorite = { id: tvShow.id, title: tvShow.name, posterPath: tvShow.poster_path, qlooId: qlooId, metadata };
  } else {
      console.warn(`[FavoriteHelper] Aucun ID Qloo trouvé pour la série "${tvShow.name}"`);
      newFavorite = { id: tvShow.id, title: tvShow.name, posterPath: tvShow.poster_path, qlooId: null };
  }
  return newFavorite;
}