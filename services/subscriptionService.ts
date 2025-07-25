// services/subscriptionService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const PREMIUM_STATUS_KEY = 'KURIUS_PREMIUM_STATUS';

export const getPremiumStatus = async (): Promise<boolean> => {
  try {
    const status = await AsyncStorage.getItem(PREMIUM_STATUS_KEY);
    // Par défaut, un nouvel utilisateur n'est pas premium.
    return status === 'true';
  } catch (e) {
    console.error('Failed to fetch premium status', e);
    return false;
  }
};

export const setPremiumStatus = async (isActive: boolean): Promise<void> => {
  try {
    await AsyncStorage.setItem(PREMIUM_STATUS_KEY, JSON.stringify(isActive));
  } catch (e) {
    console.error('Failed to save premium status', e);
  }
};