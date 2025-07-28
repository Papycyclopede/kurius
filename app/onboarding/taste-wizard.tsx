// app/onboarding/taste-wizard.tsx
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator, Image,
  TouchableOpacity, Dimensions, Alert
} from 'react-native';
import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, Baby, School, User } from 'lucide-react-native';

import { theme } from '@/constants/Theme';
import { tmdbService, MovieMetadata, TvShowMetadata } from '@/services/tmdbService';
import { bookService, BookMetadata } from '@/services/bookService';
import { qlooService, QlooRecommendation } from '@/services/qlooService';
import { saveOrUpdateProfile, LocalProfile, getLocalProfiles } from '@/services/localProfileService';
import { addFavoriteFilmHelper, addFavoriteBookHelper, addFavoriteTvShowHelper } from '@/utils/favoriteHelpers';
import { curatedContentService } from '@/services/curatedContentService';

import BackgroundWrapper from '@/components/BackgroundWrapper';
import CozyButton from '@/components/CozyButton';
import LoadingSpinner from '@/components/LoadingSpinner';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

type AgeRange = 'child' | 'teen' | 'adult';
type WizardStep = 'age' | 'genres' | 'movies' | 'tvshows' | 'books' | 'saving';
type ItemType = MovieMetadata | TvShowMetadata | BookMetadata;

const MIN_SELECTIONS = 3;
const { width } = Dimensions.get('window');
const NUM_COLUMNS = 3;
const ITEM_MARGIN = 8;
const ITEM_WIDTH = (width - theme.sizing.paddingScreen * 2 - ITEM_MARGIN * (NUM_COLUMNS - 1)) / NUM_COLUMNS;
const ITEM_HEIGHT = ITEM_WIDTH * 1.5;

const enrichQlooRecos = async (recos: QlooRecommendation[], type: 'movies' | 'tvshows' | 'books', lang: 'fr' | 'en'): Promise<ItemType[]> => {
  const promises = recos.map(async (rec) => {
    try {
      if (type === 'movies') {
        const results = await tmdbService.searchMovie(rec.title, lang === 'fr' ? 'fr-FR' : 'en-US');
        if (results[0]) return results[0];
      }
      if (type === 'tvshows') {
        const results = await tmdbService.searchTvShow(rec.title, lang === 'fr' ? 'fr-FR' : 'en-US');
        if (results[0]) return results[0];
      }
      if (type === 'books') {
        const results = await bookService.searchBook(`intitle:"${rec.title}"`, 1, lang);
        if (results[0]) return results[0];
      }
    } catch (e) { console.error(`Failed to enrich "${rec.title}"`, e); return null; }
    return null;
  });

  const results = await Promise.all(promises);
  const uniqueResults = Array.from(new Map(results.filter(Boolean).map(item => [item!.id, item])).values());
  return uniqueResults as ItemType[];
};


export default function TasteWizardScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const { profileId } = useLocalSearchParams<{ profileId?: string }>();

  const [step, setStep] = useState<WizardStep>('age');
  const [profile, setProfile] = useState<LocalProfile | null>(null);
  const [isFetchingItems, setIsFetchingItems] = useState(false);
  const [items, setItems] = useState<ItemType[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());
  const [ageRange, setAgeRange] = useState<AgeRange | null>(null);
  const [selectedGenres, setSelectedGenres] = useState<Set<string>>(new Set());

  const [finalSelections, setFinalSelections] = useState<{
    movies: MovieMetadata[],
    tvShows: TvShowMetadata[],
    books: BookMetadata[]
  }>({ movies: [], tvShows: [], books: [] });

  useEffect(() => {
    const initializeProfile = async () => {
      if (profileId) {
        const profiles = await getLocalProfiles();
        const currentProfile = profiles.find((p: LocalProfile) => p.id === profileId);
        setProfile(currentProfile || null);
      } else {
        const newShellProfile: LocalProfile = {
            id: uuidv4(),
            name: t('manageProfiles.form.newProfileDefaultName'),
            avatarUri: null,
            films: [],
            books: [],
            tvShows: [],
        };
        setProfile(newShellProfile);
      }
    };
    initializeProfile();
  }, [profileId, t]);

  useEffect(() => {
    if (step === 'age' || step === 'genres' || step === 'saving' || !profile || !ageRange) return;

    const fetchItems = async () => {
      setIsFetchingItems(true);
      setItems([]);
      setSelectedIds(new Set());
      
      const genresArray = Array.from(selectedGenres);
      const currentLang = i18n.language as 'fr' | 'en';
      const category = step === 'movies' ? 'film' : step === 'tvshows' ? 'tvShow' : 'book';

      try {
        const exampleTitles = genresArray.flatMap(genreKey => (curatedContentService.genresWithExamples[ageRange][category] as any)[genreKey] || []);
        if (exampleTitles.length === 0) {
            setIsFetchingItems(false);
            return;
        }

        const qlooIdPromises = exampleTitles.map(title => qlooService.searchContent({ title }, category, 2));
        const qlooIdResults = await Promise.all(qlooIdPromises);
        const qlooIds = qlooIdResults.flat().map(result => result.entity_id).filter(Boolean);

        if (qlooIds.length === 0) {
          console.warn("Could not find Qloo IDs for example titles. Using fallback.");
          setIsFetchingItems(false);
          return;
        }

        const qlooRecos = await qlooService.getRecommendations(qlooIds.join(','), category);
        const enrichedItems = await enrichQlooRecos(qlooRecos, step, currentLang);
        setItems(enrichedItems.sort(() => 0.5 - Math.random()).slice(0, 15));
        
      } catch (error) {
        console.error(`Failed to fetch items for step ${step}:`, error);
      } finally {
        setIsFetchingItems(false);
      }
    };
    fetchItems();
  }, [step, profile, i18n.language, t, ageRange, selectedGenres]);

  const handleSelect = (item: ItemType) => {
    const newSelectedIds = new Set(selectedIds);
    if (newSelectedIds.has(item.id)) {
      newSelectedIds.delete(item.id);
    } else {
      newSelectedIds.add(item.id);
    }
    setSelectedIds(newSelectedIds);
  };

  const handleNextStep = () => {
    if (step === 'age') {
        if (ageRange && profile) {
            const updatedProfile = { ...profile, ageRange };
            setProfile(updatedProfile);
            setStep('genres');
        }
        return;
    }
    
    if (step === 'genres') {
      if (selectedGenres.size < 1) {
        Alert.alert("Un instant !", "Veuillez sélectionner au moins un genre pour continuer.");
        return;
      }
      setStep('movies');
      return;
    }

    const currentSelectedItems = items.filter(item => selectedIds.has(item.id));
    
    if (step === 'movies') {
      setFinalSelections(prev => ({ ...prev, movies: currentSelectedItems as MovieMetadata[] }));
      setStep('tvshows');
    } else if (step === 'tvshows') {
      setFinalSelections(prev => ({ ...prev, tvShows: currentSelectedItems as TvShowMetadata[] }));
      setStep('books');
    } else if (step === 'books') {
      setFinalSelections(prev => ({ ...prev, books: currentSelectedItems as BookMetadata[] }));
      setStep('saving');
      handleFinish(currentSelectedItems as BookMetadata[]);
    }
  };
  
  const handleFinish = async (finalBooks: BookMetadata[]) => {
    if (!profile) return;
  
    const selectionsToSave = {
      ...finalSelections,
      books: finalBooks
    };
    
    try {
      const filmPromises = selectionsToSave.movies.map(m => addFavoriteFilmHelper(m));
      const tvShowPromises = selectionsToSave.tvShows.map(t => addFavoriteTvShowHelper(t));
      const bookPromises = selectionsToSave.books.map(b => addFavoriteBookHelper(b));

      const [favoriteFilms, favoriteTvShows, favoriteBooks] = await Promise.all([
        Promise.all(filmPromises),
        Promise.all(tvShowPromises),
        Promise.all(bookPromises)
      ]);
      
      const finalProfile: LocalProfile = {
        ...profile,
        films: [...(profile.films || []), ...favoriteFilms],
        tvShows: [...(profile.tvShows || []), ...favoriteTvShows],
        books: [...(profile.books || []), ...favoriteBooks],
      };

      await saveOrUpdateProfile(finalProfile);
      
      router.back();
    } catch (error) {
      console.error("Failed to save profile selections:", error);
      setStep('books');
    }
  };

  const renderItem = ({ item }: { item: ItemType }) => {
    const isSelected = selectedIds.has(item.id);
    let imageUrl: string | null = null;
    if ('poster_path' in item) imageUrl = tmdbService.getImageUrl(item.poster_path);
    if ('coverImageUrl' in item) imageUrl = item.coverImageUrl;

    return (
      <TouchableOpacity
        style={styles.itemContainer}
        onPress={() => handleSelect(item)}
        activeOpacity={0.7}
      >
        <Image source={{ uri: imageUrl || undefined }} style={styles.itemImage} />
        {isSelected && (
          <View style={styles.overlay}>
            <CheckCircle2 size={32} color={theme.colors.white} strokeWidth={2.5} />
          </View>
        )}
      </TouchableOpacity>
    );
  };
  
  const stepConfig = useMemo(() => ({
    age: { title: t('onboarding.age.title'), subtitle: t('onboarding.age.subtitle') },
    genres: { title: t('onboarding.genres.title'), subtitle: t('onboarding.genres.subtitle') },
    movies: { title: t('onboarding.movies.title'), subtitle: t('onboarding.movies.subtitle', { count: MIN_SELECTIONS }) },
    tvshows: { title: t('onboarding.tvshows.title'), subtitle: t('onboarding.tvshows.subtitle') },
    books: { title: t('onboarding.books.title'), subtitle: t('onboarding.books.subtitle') },
    saving: { title: t('onboarding.saving.title'), subtitle: t('onboarding.saving.subtitle', { name: profile?.name || '' }) }
  }), [profile?.name, t]);

  if (!profile) {
    return <LoadingSpinner message="Préparation de l'assistant..." />;
  }
  if (step === 'saving') {
    return <LoadingSpinner message={stepConfig.saving.subtitle} />;
  }
  
  const currentConfig = stepConfig[step];
  
  return (
    <BackgroundWrapper backgroundImage={require('@/assets/images/bureau.png')}>
      <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
        <View style={styles.header}>
          <Text style={styles.title}>{currentConfig.title}</Text>
          <Text style={styles.subtitle}>{currentConfig.subtitle}</Text>
        </View>

        {step === 'age' ? (
          <View style={styles.ageSelectionContainer}>
            <TouchableOpacity 
              style={[styles.ageButton, { backgroundColor: theme.colors.cardPastels[0] }, ageRange === 'child' && styles.ageButtonSelected]} 
              onPress={() => setAgeRange('child')}
            >
              <Baby size={48} color={ageRange === 'child' ? theme.colors.primary : theme.colors.textMedium} />
              <Text style={styles.ageButtonTitle}>{t('onboarding.age.child')}</Text>
              <Text style={styles.ageButtonRange}>{t('onboarding.age.child_range')}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.ageButton, { backgroundColor: theme.colors.cardPastels[1] }, ageRange === 'teen' && styles.ageButtonSelected]} 
              onPress={() => setAgeRange('teen')}
            >
              <School size={48} color={ageRange === 'teen' ? theme.colors.primary : theme.colors.textMedium} />
              <Text style={styles.ageButtonTitle}>{t('onboarding.age.teen')}</Text>
              <Text style={styles.ageButtonRange}>{t('onboarding.age.teen_range')}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.ageButton, { backgroundColor: theme.colors.cardPastels[2] }, ageRange === 'adult' && styles.ageButtonSelected]} 
              onPress={() => setAgeRange('adult')}
            >
              <User size={48} color={ageRange === 'adult' ? theme.colors.primary : theme.colors.textMedium} />
              <Text style={styles.ageButtonTitle}>{t('onboarding.age.adult')}</Text>
              <Text style={styles.ageButtonRange}>{t('onboarding.age.adult_range')}</Text>
            </TouchableOpacity>
          </View>
        ) : step === 'genres' ? (
            <View style={styles.genreContainer}>
              <FlatList
                data={curatedContentService.getGenreNamesForCategory('film', ageRange!)}
                numColumns={3}
                contentContainerStyle={styles.genreList}
                keyExtractor={(item) => item}
                renderItem={({ item }) => {
                  const isSelected = selectedGenres.has(item);
                  return (
                    <TouchableOpacity
                      style={[styles.genreButton, isSelected && styles.genreButtonSelected]}
                      onPress={() => {
                        const newSelectedGenres = new Set(selectedGenres);
                        if (isSelected) {
                          newSelectedGenres.delete(item);
                        } else {
                          newSelectedGenres.add(item);
                        }
                        setSelectedGenres(newSelectedGenres);
                      }}
                    >
                      {/* CORRECTION : Utilisation de la fonction de traduction 't' */}
                      <Text style={[styles.genreText, isSelected && styles.genreTextSelected]}>{t(`genres.${item}`)}</Text>
                    </TouchableOpacity>
                  );
                }}
              />
            </View>
        ) : (
          isFetchingItems ? (
            <ActivityIndicator size="large" color={theme.colors.primary} style={styles.loader} />
          ) : (
            <FlatList
              data={items}
              renderItem={renderItem}
              keyExtractor={(item) => item.id.toString()}
              numColumns={NUM_COLUMNS}
              contentContainerStyle={styles.listContent}
              columnWrapperStyle={{ gap: ITEM_MARGIN }}
              ListEmptyComponent={<Text style={styles.subtitle}>Aucune suggestion trouvée pour ces genres. Essayez-en d'autres !</Text>}
            />
          )
        )}

        <View style={[styles.footer, { paddingBottom: insets.bottom || 20 }]}>
          <CozyButton
            onPress={handleNextStep}
            disabled={(step === 'age' && !ageRange) || (step === 'genres' && selectedGenres.size < 1) || (step !== 'age' && step !== 'genres' && step !== 'books' && selectedIds.size < MIN_SELECTIONS)}
            size="large"
          >
            {step === 'books' ? t('onboarding.finishButton') : t('onboarding.nextButton')}
          </CozyButton>
          {step !== 'age' && (
            <CozyButton onPress={() => router.back()} variant="ghost" style={{ marginTop: 12 }}>
              {step === 'movies' ? t('onboarding.skipButtonInitial') : t('onboarding.skipButtonLater')}
            </CozyButton>
          )}
        </View>
      </View>
    </BackgroundWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: theme.sizing.paddingScreen },
  header: { alignItems: 'center', marginVertical: 20 },
  title: { ...theme.fonts.title, fontSize: 24, textAlign: 'center', color: theme.colors.textDark },
  subtitle: { ...theme.fonts.body, fontSize: 16, textAlign: 'center', marginTop: 8, color: theme.colors.textMedium },
  loader: { flex: 1, justifyContent: 'center' },
  ageSelectionContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
    marginTop: 40,
  },
  ageButton: {
    borderRadius: theme.sizing.borderRadiusCard,
    padding: 20,
    alignItems: 'center',
    width: '80%',
    borderWidth: 2,
    borderColor: theme.colors.borderColor,
  },
  ageButtonSelected: {
    borderColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  ageButtonTitle: {
    ...theme.fonts.subtitle,
    fontSize: 18,
    marginTop: 8,
  },
  ageButtonRange: {
    ...theme.fonts.caption,
    fontSize: 14,
  },
  listContent: { paddingBottom: 200 },
  itemContainer: { width: ITEM_WIDTH, height: ITEM_HEIGHT, marginBottom: ITEM_MARGIN },
  itemImage: { width: '100%', height: '100%', borderRadius: 12, backgroundColor: theme.colors.disabledBackground },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(212, 165, 116, 0.6)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: theme.colors.primary
  },
  footer: { 
    position: 'absolute', 
    bottom: 0, 
    left: 0, 
    right: 0, 
    paddingHorizontal: theme.sizing.paddingScreen, 
    backgroundColor: theme.colors.background,
    paddingTop: 20, 
    borderTopWidth: 1, 
    borderTopColor: 'rgba(0,0,0,0.05)' 
  },
  genreContainer: {
    flex: 1,
    marginTop: 20,
  },
  genreList: {
    alignItems: 'center',
    paddingBottom: 200,
  },
  genreButton: {
    backgroundColor: theme.colors.cardDefault,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.borderColor,
    margin: 6,
  },
  genreButtonSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  genreText: {
    ...theme.fonts.button,
    color: theme.colors.textDark,
  },
  genreTextSelected: {
    color: theme.colors.textOnPrimary_alt,
  },
});