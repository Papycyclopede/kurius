import { 
  View, 
  Text, 
  Modal, 
  TextInput, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  Image, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import React, { useState, useEffect } from 'react';
import { tmdbService, MovieMetadata } from '@/services/tmdbService';
import { X } from 'lucide-react-native';
import CozyCard from './CozyCard';
import { useTranslation } from 'react-i18next'; // Importez useTranslation

interface FilmSearchModalProps {
  visible: boolean;
  onClose: () => void;
  onFilmSelect: (film: MovieMetadata) => void;
  userLanguage: 'fr' | 'en'; // NOUVEAU : Ajoutez cette prop
}

function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

export default function FilmSearchModal({ visible, onClose, onFilmSelect, userLanguage }: FilmSearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MovieMetadata[]>([]);
  const [loading, setLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 500);
  const { t } = useTranslation(); // Utilisez useTranslation ici

  useEffect(() => {
    const searchFilms = async () => {
      if (debouncedQuery.length < 3) {
        setResults([]);
        return;
      }
      setLoading(true);
      // Passez userLanguage à tmdbService.searchMovie
      const searchResults = await tmdbService.searchMovie(debouncedQuery, userLanguage === 'fr' ? 'fr-FR' : 'en-US');
      setResults(searchResults || []);
      setLoading(false);
    };

    if (debouncedQuery) {
        searchFilms();
    } else {
        setResults([]);
    }
  }, [debouncedQuery, userLanguage]); // Ajoutez userLanguage aux dépendances

  const handleSelect = (film: MovieMetadata) => {
    onFilmSelect(film);
    setQuery('');
    setResults([]);
    onClose();
  };

  const renderResult = ({ item }: { item: MovieMetadata }) => (
    <TouchableOpacity style={styles.resultItem} onPress={() => handleSelect(item)}>
      <Image 
        source={{ uri: tmdbService.getImageUrl(item.poster_path) }} 
        style={styles.poster} 
      />
      <View style={styles.resultInfo}>
        <Text style={styles.resultTitle}>{item.title}</Text>
        <Text style={styles.resultYear}>{item.release_date?.split('-')[0] || t('searchModals.unknownDate')}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        style={styles.modalBackdrop}
      >
        <CozyCard style={styles.modalContent}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color="#8B6F47" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>{t('searchModals.film.title')}</Text>
          <TextInput
            style={styles.input}
            placeholder={t('searchModals.film.placeholder')}
            value={query}
            onChangeText={setQuery}
            autoFocus={true}
            placeholderTextColor="rgba(139, 111, 71, 0.6)"
          />
          {loading && <ActivityIndicator size="large" color="#D4A574" style={{marginTop: 20}}/>}
          
          <FlatList
            data={results}
            renderItem={renderResult}
            keyExtractor={(item) => item.id.toString()}
            style={styles.resultsList}
            // Correction de la syntaxe du ListEmptyComponent
            ListEmptyComponent={
                !loading && query.length > 2 ? (
                    <Text style={styles.noResultsText}>{t('searchModals.noResults', { query })}</Text>
                ) : null
            }
          />
        </CozyCard>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    height: '85%',
    width: '100%',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    padding: 20,
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 1,
  },
  modalTitle: {
    fontSize: 22,
    fontFamily: 'Comfortaa-SemiBold',
    color: '#5D4E37',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 15,
    padding: 16,
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    color: '#5D4E37',
    borderWidth: 2,
    borderColor: 'rgba(212, 165, 116, 0.3)',
    marginBottom: 16,
  },
  resultsList: {
    marginTop: 10,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 165, 116, 0.2)',
  },
  poster: {
    width: 50,
    height: 75,
    borderRadius: 4,
    marginRight: 15,
    backgroundColor: '#f0f0f0',
  },
  resultInfo: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 16,
    fontFamily: 'Nunito-Bold',
    color: '#5D4E37',
  },
  resultYear: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: '#8B6F47',
    marginTop: 2,
  },
  noResultsText: {
    textAlign: 'center',
    marginTop: 30,
    color: '#8B6F47',
    fontFamily: 'Nunito-Italic',
  }
});
