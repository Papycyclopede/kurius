// components/KuriusAvatar.tsx
import { StyleSheet, Image, TouchableOpacity } from 'react-native';
import React, { useEffect } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { voiceService } from '@/services/voiceService';

interface KuriusAvatarProps {
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  animated?: boolean;
  speechText?: string; // Nouvelle propriété pour le texte à dire
}

export default function KuriusAvatar({ size = 'medium', animated = false, speechText }: KuriusAvatarProps) {
  const yOffset = useSharedValue(0);

  useEffect(() => {
    if (animated) {
      yOffset.value = withRepeat(
        withTiming(15, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    } else {
      yOffset.value = 0;
    }
  }, [animated, yOffset]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: yOffset.value }],
    };
  });
  
  const handlePress = () => {
    if (speechText) {
      voiceService.playText(speechText);
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small': return { width: 48, height: 48 };
      case 'large': return { width: 96, height: 96 };
      case 'xlarge': return { width: 240, height: 500 };
      default: return { width: 64, height: 64 };
    }
  };

  const sizeStyles = getSizeStyles();

  return (
    <TouchableOpacity onPress={handlePress} disabled={!speechText} activeOpacity={0.8}>
      <Animated.View style={[styles.container, animatedStyle]}>
        <Image
          source={require('@/assets/images/kurius-avatar.png')}
          style={[styles.image, sizeStyles]}
        />
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    shadowColor: '#5D4E37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  image: {
    resizeMode: 'contain',
  },
});