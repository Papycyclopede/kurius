// app/vote-screen.tsx
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { EnrichedRecommendation, EventCategory } from '@/services/recommendationService';
import { addHistoryEvent } from '@/services/historyService';
import BackgroundWrapper from '@/components/BackgroundWrapper';
import CozyCard from '@/components/CozyCard';
import CozyButton from '@/components/CozyButton';
import { useTranslation } from 'react-i18next';
import React from 'react';
import { Volume2, RefreshCw, Star as StarIcon, ThumbsDown } from 'lucide-react-native';
import { voiceService } from '@/services/voiceService';
import { theme } from '@/constants/Theme';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAuth } from '@/contexts/AuthContext';
import { notificationService } from '@/services/notificationService';
import { qlooService } from '@/services/qlooService';
import { getLocalProfiles, saveLocalProfiles, LocalProfile } from '@/services/localProfileService';

export default function ChoiceScreen() {
  const router = useRouter();
  const { recommendations: rawRecommendations, participants: rawParticipants, category: rawCategory } = useLocalSearchParams();
  const { t } = useTranslation();
  const { isPremium } = useAuth();
  
  const [recommendations, setRecommendations] = useState<EnrichedRecommendation[]>([]);
  const [participants, setParticipants] = useState<string[]>([]);
  const [category, setCategory] = useState<EventCategory | null>(null);

  useEffect(() => {
    if (rawRecommendations && typeof rawRecommendations === 'string') setRecommendations(JSON.parse(rawRecommendations));
    if (rawParticipants && typeof rawParticipants === 'string') setParticipants(JSON.parse(rawParticipants));
    if (rawCategory && typeof rawCategory === 'string') setCategory(rawCategory as EventCategory);
  }, [rawRecommendations, rawParticipants, rawCategory]);

  useFocusEffect(
    React.useCallback(() => {
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

    // --- CORRECTION : On passe maintenant les participants à l'écran de résultat ---
    router.replace({ 
      pathname: '/result-screen', 
      params: { 
        winner: JSON.stringify(choice),
        participants: JSON.stringify(participants),
        wasExplanationVisible: String(wasExplanationVisible)
      } 
    });
  };

  const handleDislike = async (dislikedReco: EnrichedRecommendation) => {
    await voiceService.stop();

    const qlooResults = await qlooService.searchContent({ title: dislikedReco.title }, dislikedReco.type, 2);
    const qlooIdToDislike = qlooResults[0]?.entity_id;

    if (!qlooIdToDislike) {
      notificationService.showError("Oups !", "Impossible de marquer cette recommandation.");
      return;
    }

    const currentProfiles = await getLocalProfiles();
    const updatedProfiles = currentProfiles.map((profile: LocalProfile) => {
      if (participants.includes(profile.name)) {
        const dislikedIds = new Set(profile.dislikedQlooIds || []);
        dislikedIds.add(qlooIdToDislike);
        return { ...profile, dislikedQlooIds: Array.from(dislikedIds) };
      }
      return profile;
    });

    await saveLocalProfiles(updatedProfiles);

    setRecommendations(prevRecos => prevRecos.filter(rec => rec.id !== dislikedReco.id));
    notificationService.showInfo("Noté !", "Nous ne vous recommanderons plus cette œuvre.");
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
                    <TouchableOpacity onPress={() => voiceService.playText(rec.geminiExplanation, isPremium)}>
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
                          {t('vote.unlockWithPremium')}
                      </Text>
                  </CozyCard>
                </TouchableOpacity>
              )}

              <View style={styles.actionButtonsContainer}>
                  <CozyButton 
                    onPress={() => handleDislike(rec)} 
                    variant="ghost" 
                    style={styles.dislikeButton}
                  >
                      <ThumbsDown size={20} color={theme.colors.textLight} />
                  </CozyButton>
                  <CozyButton onPress={() => handleChoose(rec, index)} style={{flex: 1}}>
                    {t('vote.chooseButton')}
                  </CozyButton>
              </View>

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
  container: { paddingBottom: 120, },
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
  actionButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
  },
  dislikeButton: {
    paddingHorizontal: 16,
    borderColor: theme.colors.borderColor,
  },
});