// app/edit-profile.tsx
import {
    View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
    Image, ActivityIndicator, Alert, KeyboardAvoidingView, Platform
  } from 'react-native';
  import { useState, useEffect } from 'react';
  import { useLocalSearchParams, useRouter } from 'expo-router';
  import * as ImagePicker from 'expo-image-picker';
  import { Camera, Save, X, Film, Book, Tv, Plus } from 'lucide-react-native';
  import { getLocalProfiles, saveOrUpdateProfile, LocalProfile } from '@/services/localProfileService';
  import { addFavoriteFilmHelper, addFavoriteBookHelper, addFavoriteTvShowHelper } from '@/services/favoriteHelpers';
  import { tmdbService, MovieMetadata, TvShowMetadata } from '@/services/tmdbService';
  import { bookService, BookMetadata } from '@/services/bookService';
  import { theme } from '@/constants/Theme';
  import BackgroundWrapper from '@/components/BackgroundWrapper';
  import CozyButton from '@/components/CozyButton';
  import CozyCard from '@/components/CozyCard';
  import FilmSearchModal from '@/components/FilmSearchModal';
  import BookSearchModal from '@/components/BookSearchModal';
  import TvShowSearchModal from '@/components/TvShowSearchModal';
  import { useSafeAreaInsets } from 'react-native-safe-area-context';
  import Animated, { FadeInUp } from 'react-native-reanimated';
  
  export default function EditProfileScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{ profileId?: string }>();
    const insets = useSafeAreaInsets();
  
    const [profile, setProfile] = useState<Partial<LocalProfile> | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchModalType, setSearchModalType] = useState<'film' | 'book' | 'tvShow' | null>(null);
  
    useEffect(() => {
      const loadProfile = async () => {
        if (params.profileId) {
          const profiles = await getLocalProfiles();
          const existingProfile = profiles.find(p => p.id === params.profileId);
          setProfile(existingProfile || null);
        } else {
          setProfile({ name: '', avatarUri: null, films: [], books: [], tvShows: [] });
        }
        setIsLoading(false);
      };
      loadProfile();
    }, [params.profileId]);
  
    const handleSave = async () => {
      if (profile && profile.name && profile.name.trim()) {
        await saveOrUpdateProfile(profile);
        router.back();
      } else {
        Alert.alert('Oups !', 'Le nom du profil est obligatoire.');
      }
    };
  
    const handlePickImage = async () => {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.5,
      });
      if (!result.canceled) {
        setProfile(p => p ? { ...p, avatarUri: result.assets[0].uri } : null);
      }
    };
    
    const handleAddFilm = async (film: MovieMetadata) => {
      if (!profile) return;
      const currentFilms = profile.films || [];
      if (currentFilms.find(f => f.id === film.id)) { setSearchModalType(null); return; }
      const newFavorite = await addFavoriteFilmHelper(film);
      setProfile(p => p ? { ...p, films: [...(p.films || []), newFavorite] } : null);
      setSearchModalType(null);
    };
    
    const handleAddBook = async (book: BookMetadata) => {
        if (!profile) return;
        const currentBooks = profile.books || [];
        if (currentBooks.find(b => b.id === book.id)) { setSearchModalType(null); return; }
        const newFavorite = await addFavoriteBookHelper(book);
        setProfile(p => p ? { ...p, books: [...(p.books || []), newFavorite] } : null);
        setSearchModalType(null);
    };
      
    const handleAddTvShow = async (tvShow: TvShowMetadata) => {
        if (!profile) return;
        const currentTvShows = profile.tvShows || [];
        if (currentTvShows.find(t => t.id === tvShow.id)) { setSearchModalType(null); return; }
        const newFavorite = await addFavoriteTvShowHelper(tvShow);
        setProfile(p => p ? { ...p, tvShows: [...(p.tvShows || []), newFavorite] } : null);
        setSearchModalType(null);
    };
  
    const handleRemoveItem = (type: 'film' | 'book' | 'tvShow', idToRemove: number | string) => {
      setProfile(p => {
        if (!p) return p;
        const currentItems = p[type === 'film' ? 'films' : (type === 'book' ? 'books' : 'tvShows')] || [];
        const updatedItems = currentItems.filter(item => item.id !== idToRemove);
        return { ...p, [type === 'film' ? 'films' : (type === 'book' ? 'books' : 'tvShows')]: updatedItems };
      });
    };
  
    if (isLoading || !profile) {
      return (
        <BackgroundWrapper>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        </BackgroundWrapper>
      );
    }
  
    return (
      <BackgroundWrapper>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={[styles.header, { paddingTop: insets.top }]}>
            <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
              <X size={28} color={theme.colors.textDark} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{params.profileId ? 'Modifier le profil' : 'Nouveau profil'}</Text>
            <CozyButton size="small" onPress={handleSave} icon={<Save size={16} color={theme.colors.textOnPrimary_alt} />} />
          </View>
          
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <Animated.View 
              entering={FadeInUp.delay(200).duration(400)}
              style={styles.avatarContainer}
            >
              <Animated.View sharedTransitionTag={params.profileId ? `profile-${params.profileId}-avatar` : undefined}>
                  <TouchableOpacity style={styles.avatarPicker} onPress={handlePickImage}>
                  {profile.avatarUri ? (
                      <Animated.Image source={{ uri: profile.avatarUri }} style={styles.avatarImage} />
                  ) : (
                      <View style={styles.avatarPlaceholder}>
                        <Camera size={40} color={theme.colors.textLight} />
                        <Text style={styles.avatarPlaceholderText}>Choisir une photo</Text>
                      </View>
                  )}
                  </TouchableOpacity>
              </Animated.View>
            </Animated.View>
  
            <Animated.View 
              entering={FadeInUp.delay(300).duration(500)}
              sharedTransitionTag={params.profileId ? `profile-${params.profileId}-name` : undefined}
            >
              <TextInput
                style={styles.input}
                placeholder="Nom du profil"
                placeholderTextColor={theme.colors.textLight}
                value={profile.name || ''}
                onChangeText={text => setProfile(p => p ? { ...p, name: text } : null)}
              />
            </Animated.View>
  
            <Animated.View 
              style={styles.section}
              entering={FadeInUp.delay(400).duration(500).springify().damping(12)}
            >
              <Text style={styles.sectionTitle}>Films Préférés</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.itemsGrid}>
                {(profile.films || []).map(film => (
                  <View key={`film-${film.id}`} style={styles.itemContainer}>
                    <Image source={{ uri: tmdbService.getImageUrl(film.posterPath) }} style={styles.itemImage} />
                    <TouchableOpacity style={styles.removeButton} onPress={() => handleRemoveItem('film', film.id)}>
                      <X size={12} color="white" />
                    </TouchableOpacity>
                  </View>
                ))}
                <TouchableOpacity style={styles.addButtonCircle} onPress={() => setSearchModalType('film')}>
                  <Plus size={32} color={theme.colors.primary} />
                </TouchableOpacity>
              </ScrollView>
            </Animated.View>
            
            <Animated.View 
              style={styles.section}
              entering={FadeInUp.delay(500).duration(500).springify().damping(12)}
            >
              <Text style={styles.sectionTitle}>Livres Préférés</Text>
               <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.itemsGrid}>
                {(profile.books || []).map(book => (
                  <View key={`book-${book.id}`} style={styles.itemContainer}>
                    <Image source={{ uri: book.coverImageUrl || undefined }} style={styles.itemImage} />
                    <TouchableOpacity style={styles.removeButton} onPress={() => handleRemoveItem('book', book.id)}>
                      <X size={12} color="white" />
                    </TouchableOpacity>
                  </View>
                ))}
                <TouchableOpacity style={styles.addButtonCircle} onPress={() => setSearchModalType('book')}>
                  <Book size={32} color={theme.colors.primary} />
                </TouchableOpacity>
              </ScrollView>
            </Animated.View>
  
            <Animated.View 
              style={styles.section}
              entering={FadeInUp.delay(600).duration(500).springify().damping(12)}
            >
              <Text style={styles.sectionTitle}>Séries Préférées</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.itemsGrid}>
                  {(profile.tvShows || []).map(tvShow => (
                      <View key={`tv-${tvShow.id}`} style={styles.itemContainer}>
                      <Image source={{ uri: tmdbService.getImageUrl(tvShow.posterPath) }} style={styles.itemImage} />
                      <TouchableOpacity style={styles.removeButton} onPress={() => handleRemoveItem('tvShow', tvShow.id)}>
                          <X size={12} color="white" />
                      </TouchableOpacity>
                      </View>
                  ))}
                  <TouchableOpacity style={styles.addButtonCircle} onPress={() => setSearchModalType('tvShow')}>
                      <Tv size={32} color={theme.colors.primary} />
                  </TouchableOpacity>
              </ScrollView>
            </Animated.View>
  
          </ScrollView>
        </KeyboardAvoidingView>
  
        <FilmSearchModal visible={searchModalType === 'film'} onClose={() => setSearchModalType(null)} onFilmSelect={handleAddFilm} />
        <BookSearchModal visible={searchModalType === 'book'} onClose={() => setSearchModalType(null)} onBookSelect={handleAddBook} />
        <TvShowSearchModal visible={searchModalType === 'tvShow'} onClose={() => setSearchModalType(null)} onTvShowSelect={handleAddTvShow} />
      </BackgroundWrapper>
    );
  }
  
  
  const styles = StyleSheet.create({
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(0,0,0,0.05)',
      backgroundColor: theme.colors.background,
    },
    closeButton: {
      padding: 8,
    },
    headerTitle: {
      ...theme.fonts.subtitle,
      fontSize: 18,
    },
    scrollContent: {
      padding: 20,
      paddingBottom: 100,
    },
    avatarContainer: {
      alignItems: 'center',
      marginBottom: 24,
    },
    avatarPicker: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: 'rgba(0,0,0,0.05)',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: theme.colors.primary,
      borderStyle: 'dashed',
      overflow: 'hidden'
    },
    avatarImage: {
      width: '100%',
      height: '100%',
    },
    avatarPlaceholder: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarPlaceholderText: {
      ...theme.fonts.caption,
      marginTop: 8,
    },
    input: {
      backgroundColor: theme.colors.white,
      borderRadius: theme.sizing.borderRadiusInput,
      padding: 16,
      fontSize: 18,
      fontFamily: 'Nunito-SemiBold',
      color: theme.colors.textDark,
      borderWidth: 1,
      borderColor: theme.colors.borderColor,
      textAlign: 'center',
      marginBottom: 32,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      ...theme.fonts.subtitle,
      fontSize: 20,
      marginBottom: 12,
      paddingHorizontal: 4,
    },
    itemsGrid: {
      flexDirection: 'row',
      gap: 12,
      paddingVertical: 4,
    },
    itemContainer: {
      position: 'relative',
    },
    itemImage: {
      width: 100,
      height: 150,
      borderRadius: 12,
      backgroundColor: theme.colors.disabledBackground,
    },
    removeButton: {
      position: 'absolute',
      top: -8,
      right: -8,
      backgroundColor: theme.colors.error,
      borderRadius: 15,
      width: 30,
      height: 30,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: theme.colors.background,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 5,
    },
    addButtonCircle: {
      width: 100,
      height: 150,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: theme.colors.primary,
      borderStyle: 'dashed',
      backgroundColor: 'rgba(212, 165, 116, 0.05)',
    },
  });