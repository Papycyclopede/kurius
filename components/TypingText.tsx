// components/TypingText.tsx
import React, { useState, useEffect } from 'react';
import { Text, TextStyle } from 'react-native';

interface TypingTextProps {
  text: string;
  style?: TextStyle;
  speed?: number; // Vitesse en millisecondes entre chaque lettre
  onComplete?: () => void; // Fonction à appeler quand l'animation est finie
}

const TypingText: React.FC<TypingTextProps> = ({ text, style, speed = 40, onComplete }) => {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    // Réinitialise l'animation si le texte change
    setDisplayedText('');

    if (text) {
      let index = 0;
      const intervalId = setInterval(() => {
        // Ajoute une lettre à chaque intervalle
        setDisplayedText(text.substring(0, index + 1));
        index++;

        // Arrête l'intervalle quand tout le texte est affiché
        if (index >= text.length) {
          clearInterval(intervalId);
          if (onComplete) {
            onComplete();
          }
        }
      }, speed);

      // Fonction de nettoyage pour arrêter l'intervalle si le composant est démonté
      return () => clearInterval(intervalId);
    }
  }, [text, speed, onComplete]); // Cet effet se relance si le texte ou la vitesse change

  return <Text style={style}>{displayedText}</Text>;
};

export default TypingText;