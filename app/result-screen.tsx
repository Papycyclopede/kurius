// app/result-screen.tsx
import { View, Text, StyleSheet, Image, ScrollView, ActivityIndicator, TouchableOpacity, Linking, Alert } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { Trophy, Sparkles, ShoppingCart, Clapperboard, Volume2, Star as StarIcon } from 'lucide-react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { EnrichedRecommendation } from '@/services/recommendationService';
import { tmdbService, WatchProvidersResponse } from '@/services/tmdbService';
import { bookService, BookMetadata } from '@/services/bookService';
import BackgroundWrapper from '@/components/BackgroundWrapper';
import CozyCard from '@/components/CozyCard';
import CozyButton from '@/components/CozyButton';
import { useTranslation } from 'react-i18next';
import React from 'react';
import * as Localization from 'expo-localization';
import { voiceService } from '@/services/voiceService';
import { theme } from '@/constants/Theme';
import { useAuth } from '@/contexts/AuthContext';

export default function ResultScreen() {
  const router = useRouter();
  const { winner: rawWinner, wasExplanationVisible: rawWasExplanationVisible } = useLocalSearchParams();
  const { t, i18n } = useTranslation();
  const { isPremium } = useAuth();
  
  const [winner, setWinner] = useState<EnrichedRecommendation | null>(null);
  const [watchProviders, setWatchProviders] = useState<WatchProvidersResponse | null>(null);
  const [buyLink, setBuyLink] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingProviders, setIsLoadingProviders] = useState(true);
  const [userRegion, setUserRegion] = useState<string>('US');
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  const wasExplanationVisible = rawWasExplanationVisible === 'true';

  useEffect(() => {
    const initializeWinner = async () => {
      if (rawWinner && typeof rawWinner === 'string') {
        let parsedWinner: EnrichedRecommendation = JSON.parse(rawWinner);
        setWinner(parsedWinner);
        
        setIsLoadingDetails(true);
        const currentLanguageCode = i18n.language;

        try {
          if (parsedWinner.type === 'film') {
            const freshDetails = await tmdbService.getFilmDetails(parseInt(parsedWinner.id, 10), currentLanguageCode === 'fr' ? 'fr-FR' : 'en-US');
            if (freshDetails) {
              parsedWinner.title = freshDetails.title;
              parsedWinner.description = freshDetails.overview;
            }
          } else if (parsedWinner.type === 'tvShow') {
            const freshDetails = await tmdbService.getTvShowDetails(parseInt(parsedWinner.id, 10), currentLanguageCode === 'fr' ? 'fr-FR' : 'en-US');
            if (freshDetails) {
              parsedWinner.title = freshDetails.name;
              parsedWinner.description = freshDetails.overview;
            }
          }
        } catch (error) {
          console.error("Erreur lors du rafraîchissement des détails du souvenir :", error);
        } finally {
          setWinner({ ...parsedWinner });
          setIsLoadingDetails(false);
        }

        const locales = await Localization.getLocales();
        const region = locales[0]?.regionCode || 'US';
        setUserRegion(region);

        if (isPremium && wasExplanationVisible && parsedWinner.geminiExplanation) {
          setTimeout(() => {
            voiceService.playText(parsedWinner.geminiExplanation);
          }, 500);
        }

        try {
          if (parsedWinner.type === 'film' || parsedWinner.type === 'tvShow') {
            const type = parsedWinner.type === 'film' ? 'movie' : 'tv';
            const providers = await tmdbService.getWatchProviders(parseInt(parsedWinner.id, 10), type, region);
            setWatchProviders(providers);
          } else if (parsedWinner.type === 'book') {
            const bookResults = await bookService.searchBook(`intitle:"${parsedWinner.title}"`, 1, region, locales[0]?.languageCode || 'en');
            if (bookResults.length > 0 && bookResults[0].buyLink) {
              setBuyLink(bookResults[0].buyLink);
            }
          }
        } catch (e) {
          console.error("[ResultScreen] Erreur lors de la récupération des fournisseurs/liens :", e);
        } finally {
          setIsLoadingProviders(false);
        }
        setIsLoading(false);
      } else {
        router.replace('/');
      }
    };
    
    initializeWinner();
  }, [rawWinner, isPremium, i18n.language]);

  useFocusEffect(
    React.useCallback(() => {
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
  
  const renderProviderSection = () => {
    if (isLoadingProviders) {
      return (
        <View style={styles.actionSection}>
          <ActivityIndicator size="small" color={theme.colors.textLight} />
          <Text style={styles.loadingProvidersText}>Chargement des liens...</Text>
        </View>
      );
    }

    if (winner?.type === 'film' || winner?.type === 'tvShow') {
      const hasProviders = watchProviders && 
                           (watchProviders.flatrate?.length || watchProviders.rent?.length || watchProviders.buy?.length);
      
      return (
        <View style={styles.actionSection}>
          {hasProviders ? (
            <>
              {watchProviders.flatrate && watchProviders.flatrate.length > 0 && (
                <View style={styles.providerRow}>
                  <Clapperboard size={20} color={theme.colors.primary} />
                  <Text style={styles.providerLabel}>{t('result.streamOn')}:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {watchProviders.flatrate.map(provider => (
                      <TouchableOpacity key={provider.provider_id} onPress={() => handleOpenLink(watchProviders?.link)}>
                        <Image source={{ uri: `https://image.tmdb.org/t/p/original${provider.logo_path}` }} style={styles.providerLogo} />
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
              {watchProviders.rent && watchProviders.rent.length > 0 && (
                <View style={styles.providerRow}>
                  <ShoppingCart size={20} color={theme.colors.primary} />
                  <Text style={styles.providerLabel}>{t('result.rentFrom')}:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {watchProviders.rent.map(provider => (
                      <TouchableOpacity key={provider.provider_id} onPress={() => handleOpenLink(watchProviders?.link)}>
                        <Image source={{ uri: `https://image.tmdb.org/t/p/original${provider.logo_path}` }} style={styles.providerLogo} />
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
              {watchProviders.buy && watchProviders.buy.length > 0 && (
                <View style={styles.providerRow}>
                  <ShoppingCart size={20} color={theme.colors.primary} />
                  <Text style={styles.providerLabel}>{t('result.buyFrom')}:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {watchProviders.buy.map(provider => (
                      <TouchableOpacity key={provider.provider_id} onPress={() => handleOpenLink(watchProviders?.link)}>
                        <Image source={{ uri: `https://image.tmdb.org/t/p/original${provider.logo_path}` }} style={styles.providerLogo} />
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
               {watchProviders.link && (
                <CozyButton 
                  onPress={() => handleOpenLink(watchProviders.link)} 
                  variant="secondary" 
                  size="small" 
                  style={styles.tmdbLinkButton}>
                  {t('result.moreProviders')} ({userRegion.toUpperCase()})
                </CozyButton>
              )}
            </>
          ) : (
            <Text style={styles.noProvidersText}>{t('result.noStreamLinkAvailable', { region: userRegion.toUpperCase() })}</Text>
          )}
        </View>
      );
    } else if (winner?.type === 'book') {
      return (
        <View style={styles.actionSection}>
          {buyLink ? (
            <CozyButton onPress={() => handleOpenLink(buyLink)} icon={<ShoppingCart size={16} color={theme.colors.textOnPrimary_alt} />}>
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

  if (isLoading || !winner) {
    return (
      <BackgroundWrapper>
        <View style={styles.loadingContainer}><ActivityIndicator size="large" color={theme.colors.primary} /></View>
      </BackgroundWrapper>
    );
  }

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

          {isLoadingDetails ? (
            <ActivityIndicator style={{ marginVertical: 20 }} />
          ) : (
            <>
              <Text style={styles.winnerTitle}>{winner.title}</Text>
              {winner.releaseYear && <Text style={styles.winnerYear}>{winner.releaseYear}</Text>}
              <Text style={styles.winnerDescription}>{winner.description}</Text>
            </>
          )}

          {renderProviderSection()}
          
          {wasExplanationVisible ? (
            <CozyCard transparent style={styles.geminiCard}>
              <View style={styles.geminiHeader}>
                <Sparkles size={16} color={theme.colors.textDark} />
                <Text style={styles.geminiTitle}>{t('result.geminiTitle')}</Text>
                <TouchableOpacity onPress={() => voiceService.playText(winner.geminiExplanation)}>
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
          <CozyButton onPress={() => router.replace('/')} size="large" variant="secondary">
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
    loadingProvidersText: { ...theme.fonts.caption, color: theme.colors.textLight, marginTop: 8 },
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
    }
});