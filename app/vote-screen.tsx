// app/vote-screen.tsx
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { EnrichedRecommendation } from '@/services/recommendationService';
import { addHistoryEvent } from '@/services/historyService';
import BackgroundWrapper from '@/components/BackgroundWrapper';
import CozyCard from '@/components/CozyCard';
import CozyButton from '@/components/CozyButton';
import { useTranslation } from 'react-i18next';
import React from 'react';
import { Volume2, RefreshCw, Star as StarIcon } from 'lucide-react-native';
import { voiceService } from '@/services/voiceService';
import { theme } from '@/constants/Theme';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAuth } from '@/contexts/AuthContext';

export default function ChoiceScreen() {
  const router = useRouter();
  const { recommendations: rawRecommendations, participants: rawParticipants, category: rawCategory } = useLocalSearchParams();
  const { t } = useTranslation();
  const { isPremium } = useAuth();
  
  const [recommendations, setRecommendations] = useState<EnrichedRecommendation[]>([]);
  const [participants, setParticipants] = useState<string[]>([]);
  const [category, setCategory] = useState<string | null>(null);

  useEffect(() => {
    if (rawRecommendations && typeof rawRecommendations === 'string') setRecommendations(JSON.parse(rawRecommendations));
    if (rawParticipants && typeof rawParticipants === 'string') setParticipants(JSON.parse(rawParticipants));
    if (rawCategory && typeof rawCategory === 'string') setCategory(rawCategory);
  }, [rawRecommendations, rawParticipants, rawCategory]);

  // ### MODIFICATION : Ajout de ce bloc pour arrêter le son ###
  // Ce code s'exécute quand on quitte l'écran.
  useFocusEffect(
    useCallback(() => {
      // La fonction de retour est la fonction de "nettoyage"
      return () => {
        voiceService.stop();
      };
    }, [])
  );

  const handleChoose = async (choice: EnrichedRecommendation, index: number) => {
    await voiceService.stop();
    await addHistoryEvent({
      category: choice.type,
      chosenItem: choice,
      participants: participants,
    });

    const wasExplanationVisible = isPremium || index === 0;

    router.replace({ 
      pathname: '/result-screen', 
      params: { 
        winner: JSON.stringify(choice),
        wasExplanationVisible: String(wasExplanationVisible)
      } 
    });
  };

  const handleRefreshRecommendations = async () => {
    await voiceService.stop();
    // Votre logique de rafraîchissement
  };

  return (
    <BackgroundWrapper>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('vote.title')}</Text>
          <Text style={styles.subtitle}>{t('vote.subtitle')}</Text>
        </View>
        
        {recommendations.map((rec, index) => (
          <Animated.View 
            key={rec.id}
            entering={FadeInDown.delay(index * 150).duration(500).springify().damping(12)}
          >
            <CozyCard style={styles.card}>
              <View style={styles.cardHeader}>
                {rec.posterUrl && <Image source={{ uri: rec.posterUrl }} style={styles.posterImage} />}
                <View style={styles.cardInfo}>
                  <Text style={styles.cardTitle}>{rec.title}</Text>
                  <Text style={styles.cardDescription} numberOfLines={3}>{rec.description}</Text>
                </View>
              </View>

              {(isPremium || index === 0) ? (
                <CozyCard transparent style={styles.geminiCard}>
                  <View style={styles.geminiHeader}>
                    <Text style={styles.geminiTitle}>{t('vote.whyChoice')}</Text>
                    <TouchableOpacity onPress={() => voiceService.playText(rec.geminiExplanation)}>
                      <Volume2 size={20} color={theme.colors.textLight} />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.geminiText}>{rec.geminiExplanation}</Text>
                </CozyCard>
              ) : (
                <TouchableOpacity onPress={() => router.push('/(tabs)/plus')}>
                  <CozyCard style={styles.upsellCard}>
                      <StarIcon size={16} color="#B28A00" />
                      <Text style={styles.upsellText}>
                          Débloquez l'avis de Kurius avec Premium
                      </Text>
                  </CozyCard>
                </TouchableOpacity>
              )}

              <CozyButton onPress={() => handleChoose(rec, index)} style={{marginTop: 16}}>
                {t('vote.chooseButton')}
              </CozyButton>
            </CozyCard>
          </Animated.View>
        ))}

        <Animated.View 
          style={styles.refreshButtonContainer}
          entering={FadeInDown.delay(recommendations.length * 150 + 100).duration(500)}
        >
          <CozyButton 
            onPress={handleRefreshRecommendations} 
            variant="secondary" 
            icon={<RefreshCw size={16} color={theme.colors.textLight} />}
          >
            {t('common.refresh')}
          </CozyButton>
        </Animated.View>

      </ScrollView>
    </BackgroundWrapper>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: 120, }, // Espacement pour la barre d'onglets
  header: { padding: 20, paddingTop: 60, alignItems: 'center' },
  title: { ...theme.fonts.title, fontSize: 28, textAlign: 'center' },
  subtitle: { ...theme.fonts.body, fontSize: 16, color: theme.colors.textLight, marginTop: 8 },
  card: { marginHorizontal: 20, backgroundColor: theme.colors.cardDefault, marginBottom: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  posterImage: { width: 80, height: 120, borderRadius: 8, backgroundColor: theme.colors.disabledBackground },
  cardInfo: { flex: 1 },
  cardTitle: { ...theme.fonts.subtitle, fontSize: 18, marginBottom: 4 },
  cardDescription: { ...theme.fonts.body, fontSize: 14, lineHeight: 20 },
  geminiCard: { backgroundColor: 'rgba(255, 248, 231, 0.9)', padding: 12, marginTop: 12 },
  geminiHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, },
  geminiTitle: { ...theme.fonts.button, fontSize: 14, color: theme.colors.textDark },
  geminiText: { ...theme.fonts.body, fontSize: 14, lineHeight: 20 },
  refreshButtonContainer: { paddingHorizontal: 20, marginTop: 10, alignItems: 'center', },
  upsellCard: {
    backgroundColor: 'rgba(255, 249, 219, 0.95)',
    borderColor: '#FFD700',
    marginTop: 12,
    padding: 12,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  upsellText: {
    ...theme.fonts.body,
    color: theme.colors.textDark,
    fontSize: 13,
    flex: 1,
    fontWeight: '600'
  },
});