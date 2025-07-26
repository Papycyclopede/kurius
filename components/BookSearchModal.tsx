// components/BookSearchModal.tsx
import { 
  View, Text, Modal, TextInput, FlatList, TouchableOpacity, 
  StyleSheet, Image, ActivityIndicator, KeyboardAvoidingView, Platform 
} from 'react-native';
import React, { useState, useEffect } from 'react';
import { bookService, BookMetadata } from '@/services/bookService';
import { X } from 'lucide-react-native';
import CozyCard from './CozyCard';
import { useTranslation } from 'react-i18next'; // Importez useTranslation

function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => { setDebouncedValue(value); }, delay);
    return () => { clearTimeout(handler); };
  }, [value, delay]);
  return debouncedValue;
}

interface BookSearchModalProps {
  visible: boolean;
  onClose: () => void;
  onBookSelect: (book: BookMetadata) => void;
  userLanguage: 'fr' | 'en'; // NOUVEAU : Ajoutez cette prop
}

export default function BookSearchModal({ visible, onClose, onBookSelect, userLanguage }: BookSearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<BookMetadata[]>([]);
  const [loading, setLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 500);
  const { t } = useTranslation(); // Utilisez useTranslation ici

  useEffect(() => {
    const searchBooks = async () => {
      if (debouncedQuery.length < 3) {
        setResults([]);
        return;
      }
      setLoading(true);
      // S'assurer que le paramètre 'region' est un code pays valide (ex: 'US', 'FR')
      // Google Books API utilise 'country' pour la pertinence géographique.
      // Si userLanguage est 'fr', on peut essayer 'FR' comme région. Sinon 'US'.
      const regionCode = userLanguage.toUpperCase(); // 'FR' ou 'EN'
      
      const searchResults = await bookService.searchBook(debouncedQuery, 10, regionCode, userLanguage);
      setResults(searchResults || []);
      setLoading(false);
    };

    if (debouncedQuery) {
      searchBooks();
    } else {
      setResults([]);
    }
  }, [debouncedQuery, userLanguage]); // Ajoutez userLanguage aux dépendances

  const handleSelect = (book: BookMetadata) => {
    onBookSelect(book);
    setQuery('');
    setResults([]);
    onClose();
  };

  const renderResult = ({ item }: { item: BookMetadata }) => (
    <TouchableOpacity style={styles.resultItem} onPress={() => handleSelect(item)}>
      <Image 
        source={{ uri: item.coverImageUrl || undefined }} 
        style={styles.cover} 
      />
      <View style={styles.resultInfo}>
        <Text style={styles.resultTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.resultAuthor}>{item.authors.join(', ') || t('searchModals.unknownAuthor')}</Text>
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
          <Text style={styles.modalTitle}>{t('searchModals.book.title')}</Text>
          <TextInput
            style={styles.input}
            placeholder={t('searchModals.book.placeholder')}
            value={query}
            onChangeText={setQuery}
            autoFocus={true}
            placeholderTextColor="rgba(139, 111, 71, 0.6)"
          />
          {loading && <ActivityIndicator size="large" color="#D4A574" style={{marginTop: 20}}/>}
          
          <FlatList
            data={results}
            renderItem={renderResult}
            keyExtractor={(item) => item.id}
            style={styles.resultsList}
            // Re-vérification et simplification de la syntaxe du ListEmptyComponent
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
    modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    modalContent: { height: '85%', width: '100%', borderBottomLeftRadius: 0, borderBottomRightRadius: 0, padding: 20 },
    closeButton: { position: 'absolute', top: 20, right: 20, zIndex: 1 },
    modalTitle: { fontSize: 22, fontFamily: 'Comfortaa-SemiBold', color: '#5D4E37', marginBottom: 20, textAlign: 'center' },
    input: { backgroundColor: 'rgba(255, 255, 255, 0.8)', borderRadius: 15, padding: 16, fontSize: 16, fontFamily: 'Nunito-Regular', color: '#5D4E37', borderWidth: 2, borderColor: 'rgba(212, 165, 116, 0.3)', marginBottom: 16 },
    resultsList: { marginTop: 10 },
    resultItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(212, 165, 116, 0.2)' },
    cover: { width: 40, height: 60, borderRadius: 4, marginRight: 15, backgroundColor: '#f0f0f0' },
    resultInfo: { flex: 1 },
    resultTitle: { fontSize: 16, fontFamily: 'Nunito-Bold', color: '#5D4E37' },
    resultAuthor: { fontSize: 14, fontFamily: 'Nunito-Regular', color: '#8B6F47', marginTop: 2 },
    noResultsText: { textAlign: 'center', marginTop: 30, color: '#8B6F47', fontStyle: 'italic' }
});
