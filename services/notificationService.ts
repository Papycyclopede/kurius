// services/notificationService.ts
import Toast from 'react-native-toast-message';

// Affiche un message de succès
export const showSuccess = (title: string, message?: string) => {
  Toast.show({
    type: 'success',
    text1: title,
    text2: message,
    position: 'top',
    visibilityTime: 3000,
  });
};

// Affiche un message d'erreur
export const showError = (title: string, message?: string) => {
  Toast.show({
    type: 'error',
    text1: title,
    text2: message,
    position: 'top',
    visibilityTime: 4000,
  });
};

// Affiche un message d'information
export const showInfo = (title: string, message?: string) => {
  Toast.show({
    type: 'info',
    text1: title,
    text2: message,
    position: 'top',
    visibilityTime: 3000,
  });
};

// Pour l'utiliser plus facilement
export const notificationService = {
  showSuccess,
  showError,
  showInfo,
};