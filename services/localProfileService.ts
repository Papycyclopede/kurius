// services/localProfileService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { FavoriteFilm, FavoriteBook, FavoriteTvShow } from '@/types';

const STORAGE_KEY = 'KURIUS_LOCAL_PROFILES';

export interface LocalProfile {
  id: string;
  name: string;
  avatarUri: string | null;
  films: FavoriteFilm[];
  books: FavoriteBook[];
  tvShows: FavoriteTvShow[];
  ageRange?: 'child' | 'teen' | 'adult';
  dislikedQlooIds?: string[]; // --- NOUVEAU : Ajout du champ pour les exclusions
}

export const getLocalProfiles = async (): Promise<LocalProfile[]> => {
  try {
    const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (e) {
    console.error("Erreur lecture profils locaux", e);
    return [];
  }
};

export const saveLocalProfiles = async (profiles: LocalProfile[]): Promise<void> => {
  try {
    const jsonValue = JSON.stringify(profiles);
    await AsyncStorage.setItem(STORAGE_KEY, jsonValue);
  } catch (e) {
    console.error("Erreur sauvegarde profils locaux", e);
  }
};

export const saveOrUpdateProfile = async (profile: Partial<LocalProfile>): Promise<LocalProfile[]> => {
    const profiles = await getLocalProfiles();
    const existingIndex = profile.id ? profiles.findIndex(p => p.id === profile.id) : -1;

    if (existingIndex > -1) {
        profiles[existingIndex] = { ...profiles[existingIndex], ...profile } as LocalProfile;
    } else {
        const newProfile: LocalProfile = {
            id: profile.id || uuidv4(),
            name: 'Nouveau Membre',
            avatarUri: null,
            films: [],
            books: [],
            tvShows: [],
            ...profile
        };
        profiles.push(newProfile);
    }

    await saveLocalProfiles(profiles);
    return profiles;
}