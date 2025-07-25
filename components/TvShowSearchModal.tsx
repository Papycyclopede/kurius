// components/TvShowSearchModal.tsx
import { 
  View, Text, Modal, TextInput, FlatList, TouchableOpacity, 
  StyleSheet, Image, ActivityIndicator, KeyboardAvoidingView, Platform 
} from 'react-native';
import React, { useState, useEffect } from 'react';
import { tmdbService, TvShowMetadata } from '@/services/tmdbService';
import { X } from 'lucide-react-native';
import CozyCard from './CozyCard';

function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => { setDebouncedValue(value); }, delay);
    return () => { clearTimeout(handler); };
  }, [value, delay]);
  return debouncedValue;
}

interface TvShowSearchModalProps {
  visible: boolean;
  onClose: () => void;
  onTvShowSelect: (tvShow: TvShowMetadata) => void;
}

export default function TvShowSearchModal({ visible, onClose, onTvShowSelect }: TvShowSearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<TvShowMetadata[]>([]);
  const [loading, setLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 500);

  useEffect(() => {
    const searchTvShows = async () => {
      if (debouncedQuery.length < 3) { setResults([]); return; }
      setLoading(true);
      const searchResults = await tmdbService.searchTvShow(debouncedQuery);
      setResults(searchResults || []);
      setLoading(false);
    };
    if (debouncedQuery) searchTvShows(); else setResults([]);
  }, [debouncedQuery]);

  const handleSelect = (tvShow: TvShowMetadata) => {
    onTvShowSelect(tvShow);
    setQuery('');
    setResults([]);
    onClose();
  };

  const renderResult = ({ item }: { item: TvShowMetadata }) => (
    <TouchableOpacity style={styles.resultItem} onPress={() => handleSelect(item)}>
      <Image 
        source={{ uri: tmdbService.getImageUrl(item.poster_path) }} 
        style={styles.poster} 
        // defaultSource={require('@/assets/images/icon.png')} // Suppression de cette ligne
      />
      <View style={styles.resultInfo}>
        <Text style={styles.resultTitle}>{item.name}</Text>
        <Text style={styles.resultDate}>{item.first_air_date ? `Première diffusion: ${item.first_air_date.split('-')[0]}` : ''}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalBackdrop}>
        <CozyCard style={styles.modalContent}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}><X size={24} color="#8B6F47" /></TouchableOpacity>
          <Text style={styles.modalTitle}>Rechercher une série</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Game of Thrones, Friends..."
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
            ListEmptyComponent={!loading && query.length > 2 ? (<Text style={styles.noResultsText}>Aucun résultat pour "{query}"</Text>) : null}
          />
        </CozyCard>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
    modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    modalContent: { height: '85%', width: '100%', borderBottomLeftRadius: 0, borderBottomRightRadius: 0, padding: 20 },
    closeButton: { position: 'absolute', top: 20, right: 20, zIndex: 1 },
    modalTitle: { fontSize: 22, fontFamily: 'Comfortaa-SemiBold', color: '#5D4E37', marginBottom: 20, textAlign: 'center' },
    input: { backgroundColor: 'rgba(255, 255, 255, 0.8)', borderRadius: 15, padding: 16, fontSize: 16, fontFamily: 'Nunito-Regular', color: '#5D4E37', borderWidth: 2, borderColor: 'rgba(212, 165, 116, 0.3)', marginBottom: 16 },
    resultsList: { marginTop: 10 },
    resultItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(212, 165, 116, 0.2)' },
    poster: { width: 50, height: 75, borderRadius: 4, marginRight: 15, backgroundColor: '#f0f0f0' },
    resultInfo: { flex: 1 },
    resultTitle: { fontSize: 16, fontFamily: 'Nunito-Bold', color: '#5D4E37' },
    resultDate: { fontSize: 12, fontFamily: 'Nunito-Regular', color: '#8B6F47', marginTop: 4 },
    noResultsText: { textAlign: 'center', marginTop: 30, color: '#8B6F47', fontStyle: 'italic' }
});