// app/result-screen.tsx
import { View, Text, StyleSheet, Image, ScrollView, ActivityIndicator, TouchableOpacity, Linking, Alert } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { Trophy, Sparkles, ShoppingCart, Clapperboard, Volume2, Star as StarIcon, PlayCircle } from 'lucide-react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { EnrichedRecommendation } from '@/services/recommendationService';
import { tmdbService, WatchProvidersResponse } from '@/services/tmdbService';
import { bookService } from '@/services/bookService';
import BackgroundWrapper from '@/components/BackgroundWrapper';
import CozyCard from '@/components/CozyCard';
import CozyButton from '@/components/CozyButton';
import { useTranslation } from 'react-i18next';
import React from 'react';
import * as Localization from 'expo-localization';
import { voiceService } from '@/services/voiceService';
import { theme } from '@/constants/Theme';
import { useAuth } from '@/contexts/AuthContext';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '@/lib/supabase';
import { getLocalProfiles, LocalProfile } from '@/services/localProfileService';

interface ScreenState {
  isLoading: boolean;
  winner: EnrichedRecommendation | null;
  watchProviders: WatchProvidersResponse | null;
  buyLink: string | null;
  trailerKey: string | null;
  userRegion: string;
}

export default function ResultScreen() {
  const router = useRouter();
  const {
    winner: rawWinner,
    participants: rawParticipants,
    wasExplanationVisible: rawWasExplanationVisible
  } = useLocalSearchParams();

  const { t, i18n } = useTranslation();
  const { isPremium } = useAuth();

  const [state, setState] = useState<ScreenState>({
    isLoading: true,
    winner: null,
    watchProviders: null,
    buyLink: null,
    trailerKey: null,
    userRegion: 'US',
  });

  const wasExplanationVisible = rawWasExplanationVisible === 'true';

  const logSessionToSupabase = async (
    winner: EnrichedRecommendation,
    participants: string[],
    region: string
  ) => {
    try {
      const allLocalProfiles = await getLocalProfiles();
      const participantProfiles = allLocalProfiles.filter((p: LocalProfile) => participants.includes(p.name));
      
      const participants_snapshot = participantProfiles.map((p: LocalProfile) => ({
        age_range: p.ageRange || 'unknown',
        favorite_count: {
          films: p.films?.length || 0,
          books: p.books?.length || 0,
          tvShows: p.tvShows?.length || 0,
        }
      }));

      const { error } = await supabase.rpc('log_recommendation_session', {
        p_session_type: 'local',
        p_circle_id: null,
        p_participants_snapshot: participants_snapshot,
        p_category: winner.type,
        p_winner_title: winner.title,
        p_winner_id: winner.id,
        p_reco_count: 3,
        p_region: region
      });

      if (error) {
        console.error("Erreur lors de la journalisation de la session:", error);
      }
    } catch (logError) {
      console.error("Erreur de préparation pour la journalisation:", logError);
    }
  };

  useEffect(() => {
    const fetchAndLogData = async () => {
      if (!rawWinner || typeof rawWinner !== 'string' || !rawParticipants || typeof rawParticipants !== 'string') {
        router.replace('/');
        return;
      }

      let parsedWinner: EnrichedRecommendation;
      let parsedParticipants: string[];
      try {
        parsedWinner = JSON.parse(rawWinner);
        parsedParticipants = JSON.parse(rawParticipants);
      } catch (e) {
        router.back();
        return;
      }
      
      const locales = await Localization.getLocales();
      const region = locales[0]?.regionCode || 'US';

      logSessionToSupabase(parsedWinner, parsedParticipants, region);

      let newWatchProviders: WatchProvidersResponse | null = null;
      let newBuyLink: string | null = null;
      let newTrailerKey: string | null = null;

      try {
        if (parsedWinner.type === 'film' || parsedWinner.type === 'tvShow') {
          const type = parsedWinner.type === 'film' ? 'movie' : 'tv';
          const id = parseInt(parsedWinner.id, 10);
          [newWatchProviders, newTrailerKey] = await Promise.all([
            tmdbService.getWatchProviders(id, type, region),
            tmdbService.getTrailerKey(id, type)
          ]);
        } else if (parsedWinner.type === 'book') {
          const bookResults = await bookService.searchBook(`intitle:"${parsedWinner.title}"`, 1, region, locales[0]?.languageCode || 'en');
          if (bookResults.length > 0 && bookResults[0].buyLink) {
            newBuyLink = bookResults[0].buyLink;
          }
        }
      } catch (e) {
        console.error("Erreur de récupération des fournisseurs/liens :", e);
      }

      setState({
        isLoading: false,
        winner: parsedWinner,
        watchProviders: newWatchProviders,
        buyLink: newBuyLink,
        trailerKey: newTrailerKey,
        userRegion: region,
      });
    };
    
    fetchAndLogData();
  }, [rawWinner, rawParticipants]);

  useFocusEffect(
    useCallback(() => {
      return () => {
        voiceService.stop();
      };
    }, [])
  );

  const handleOpenLink = (url: string | undefined | null) => {
    if (url) {
      Linking.openURL(url).catch(err => Alert.alert("Erreur", "Impossible d'ouvrir ce lien."));
    } else {
      Alert.alert(t('common.oops'), t('result.noLinkAvailable'));
    }
  };
  
  const handlePlayTrailer = () => {
    if (state.trailerKey) {
        WebBrowser.openBrowserAsync(`https://www.youtube.com/watch?v=${state.trailerKey}`);
    }
  };

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  const renderProviderSection = () => {
    if (state.winner?.type === 'film' || state.winner?.type === 'tvShow') {
      // --- DÉBUT DE LA CORRECTION DÉFINITIVE ---
      // On assigne state.watchProviders à une constante locale après la vérification.
      // Cela garantit à TypeScript que `providers` n'est pas null dans ce bloc.
      const providers = state.watchProviders;
      if (providers) {
        return (
          <View style={styles.actionSection}>
            {providers.flatrate && providers.flatrate.length > 0 && (
              <View style={styles.providerRow}>
                <Clapperboard size={20} color={theme.colors.primary} />
                <Text style={styles.providerLabel}>{t('result.streamOn')}:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {providers.flatrate.map(provider => (
                    <TouchableOpacity key={provider.provider_id} onPress={() => handleOpenLink(providers.link)}>
                      <Image source={{ uri: `https://image.tmdb.org/t/p/original${provider.logo_path}` }} style={styles.providerLogo} />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
            {providers.link && (
              <CozyButton 
                onPress={() => handleOpenLink(providers.link)} 
                variant="secondary" 
                size="small" 
                style={styles.tmdbLinkButton}>
                {t('result.moreProviders')} ({state.userRegion.toUpperCase()})
              </CozyButton>
            )}
          </View>
        );
      } else {
        return (
          <View style={styles.actionSection}>
            <Text style={styles.noProvidersText}>{t('result.noStreamLinkAvailable', { region: state.userRegion.toUpperCase() })}</Text>
          </View>
        );
      }
      // --- FIN DE LA CORRECTION ---
    } else if (state.winner?.type === 'book') {
      return (
        <View style={styles.actionSection}>
          {state.buyLink ? (
            <CozyButton onPress={() => handleOpenLink(state.buyLink)} icon={<ShoppingCart size={16} color={theme.colors.textOnPrimary_alt} />}>
              {t('result.buyBook')}
            </CozyButton>
          ) : (
            <Text style={styles.noProvidersText}>{t('result.noBuyLinkAvailable')}</Text>
          )}
        </View>
      );
    }
    return null;
  };

  if (state.isLoading || !state.winner) {
    return (
      <BackgroundWrapper>
        <View style={styles.loadingContainer}><ActivityIndicator size="large" color={theme.colors.primary} /></View>
      </BackgroundWrapper>
    );
  }

  const { winner } = state;

  return (
    <BackgroundWrapper>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Trophy size={48} color="#FFD700" />
          <Text style={styles.title}>{t('result.title')}</Text>
          <Text style={styles.subtitle}>{t('result.subtitle')}</Text>
        </View>
        
        <CozyCard style={styles.winnerCard}>
          <Image source={{ uri: winner.posterUrl || undefined }} style={styles.posterImage} />
          <Text style={styles.winnerTitle}>{winner.title}</Text>
          {winner.releaseYear && <Text style={styles.winnerYear}>{winner.releaseYear}</Text>}
          <Text style={styles.winnerDescription}>{winner.description}</Text>
          
          {state.trailerKey && (
            <CozyButton 
                onPress={handlePlayTrailer}
                variant="secondary" 
                icon={<PlayCircle size={16} color={theme.colors.textDark} />}
                style={{marginTop: 20, marginBottom: 10}}
            >
                Voir la bande-annonce
            </CozyButton>
          )}

          {renderProviderSection()}
          
          {wasExplanationVisible ? (
            <CozyCard transparent style={styles.geminiCard}>
              <View style={styles.geminiHeader}>
                <Sparkles size={16} color={theme.colors.textDark} />
                <Text style={styles.geminiTitle}>{t('result.geminiTitle')}</Text>
                <TouchableOpacity onPress={() => voiceService.playText(winner.geminiExplanation, isPremium)}>
                  <Volume2 size={20} color={theme.colors.textLight} />
                </TouchableOpacity>
              </View>
              <Text style={styles.geminiText}>{winner.geminiExplanation}</Text>
            </CozyCard>
          ) : (
            <TouchableOpacity onPress={() => router.push('/(tabs)/plus')}>
              <CozyCard style={styles.upsellCard}>
                  <StarIcon size={20} color="#B28A00" />
                  <Text style={styles.upsellText}>
                      {t('result.unlockOpinion')}
                  </Text>
              </CozyCard>
            </TouchableOpacity>
          )}
        </CozyCard>

        <View style={styles.footer}>
          <CozyButton onPress={handleGoBack} size="large" variant="secondary">
            {t('result.backButton')}
          </CozyButton>
        </View>
      </ScrollView>
    </BackgroundWrapper>
  );
}

const styles = StyleSheet.create({
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scrollContent: { paddingTop: 60, paddingBottom: 120 },
    header: { paddingHorizontal: 20, alignItems: 'center' },
    title: { ...theme.fonts.title, fontSize: 28, textAlign: 'center', marginTop: 12 },
    subtitle: { ...theme.fonts.body, fontSize: 16, color: theme.colors.textLight, marginTop: 8, textAlign: 'center' },
    winnerCard: { margin: 20, alignItems: 'center', padding: 20 },
    posterImage: { width: 150, height: 225, borderRadius: 12, backgroundColor: '#E2E8F0', marginBottom: 16 },
    winnerTitle: { ...theme.fonts.subtitle, fontSize: 22, textAlign: 'center' },
    winnerYear: { ...theme.fonts.caption, fontSize: 14, marginBottom: 16 },
    winnerDescription: { ...theme.fonts.body, fontSize: 15, textAlign: 'center', lineHeight: 22 },
    geminiCard: { backgroundColor: 'rgba(255, 248, 231, 0.9)', padding: 16, marginTop: 20, width: '100%' },
    geminiHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8, justifyContent: 'space-between' },
    geminiTitle: { ...theme.fonts.button, fontSize: 16, color: theme.colors.textDark, flex: 1 },
    geminiText: { ...theme.fonts.body, fontSize: 14, color: theme.colors.textMedium, lineHeight: 21 },
    footer: { paddingHorizontal: 20, marginTop: 10 },
    actionSection: { width: '100%', alignItems: 'center', marginVertical: 16, paddingVertical: 16, borderTopWidth: 1, borderBottomWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
    providerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, width: '100%', paddingHorizontal: 10 },
    providerLabel: { ...theme.fonts.subtitle, fontSize: 14, color: theme.colors.textDark, marginLeft: 8, marginRight: 10 },
    providerLogo: { width: 40, height: 40, borderRadius: 8, marginRight: 8, backgroundColor: theme.colors.disabledBackground, borderWidth: 1, borderColor: theme.colors.borderColor },
    noProvidersText: { ...theme.fonts.body, color: theme.colors.textLight, fontStyle: 'italic', textAlign: 'center', paddingVertical: 10 },
    tmdbLinkButton: { marginTop: 15, width: '80%' },
    upsellCard: {
        backgroundColor: 'rgba(255, 249, 219, 0.95)',
        borderColor: '#FFD700',
        marginTop: 20,
        padding: 16,
        alignItems: 'center',
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    upsellText: {
        ...theme.fonts.body,
        color: theme.colors.textDark,
        fontSize: 14,
        flex: 1,
        fontWeight: '600'
    },
});