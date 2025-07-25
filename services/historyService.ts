// services/historyService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { HistoryEvent } from '@/types';

const HISTORY_STORAGE_KEY = 'KURIUS_HISTORY';

export const getHistory = async (): Promise<HistoryEvent[]> => {
  try {
    const jsonValue = await AsyncStorage.getItem(HISTORY_STORAGE_KEY);
    return jsonValue != null ? JSON.parse(jsonValue).sort((a: HistoryEvent, b: HistoryEvent) => new Date(b.date).getTime() - new Date(a.date).getTime()) : [];
  } catch (e) {
    console.error("Erreur lecture de l'historique", e);
    return [];
  }
};

// Cette fonction attend maintenant un `chosenItem` de type `EnrichedRecommendation` grâce au type `HistoryEvent` corrigé
export const addHistoryEvent = async (event: Omit<HistoryEvent, 'id' | 'date'>): Promise<void> => {
  try {
    const jsonValue = await AsyncStorage.getItem(HISTORY_STORAGE_KEY);
    const history: HistoryEvent[] = jsonValue != null ? JSON.parse(jsonValue) : [];
    
    const newEvent: HistoryEvent = {
      ...event,
      id: uuidv4(),
      date: new Date().toISOString(),
    };
    history.unshift(newEvent);
    const newJsonValue = JSON.stringify(history);
    await AsyncStorage.setItem(HISTORY_STORAGE_KEY, newJsonValue);
  } catch (e) {
    console.error("Erreur sauvegarde de l'événement dans l'historique", e);
  }
};

export const clearHistory = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(HISTORY_STORAGE_KEY);
    console.log("Historique des souvenirs réinitialisé.");
  } catch (e) {
    console.error("Erreur lors de la réinitialisation de l'historique", e);
  }
};