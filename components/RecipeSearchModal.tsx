// components/RecipeSearchModal.tsx
import { 
  View, Text, Modal, TextInput, FlatList, TouchableOpacity, 
  StyleSheet, Image, ActivityIndicator, KeyboardAvoidingView, Platform 
} from 'react-native';
import React, { useState, useEffect } from 'react';
import { recipeService, RecipeMetadata } from '@/services/recipeService';
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

interface RecipeSearchModalProps {
  visible: boolean;
  onClose: () => void;
  onRecipeSelect: (recipe: RecipeMetadata) => void;
}

export default function RecipeSearchModal({ visible, onClose, onRecipeSelect }: RecipeSearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<RecipeMetadata[]>([]);
  const [loading, setLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 500);

  useEffect(() => {
    const searchRecipes = async () => {
      if (debouncedQuery.length < 3) {
        setResults([]);
        return;
      }
      setLoading(true);
      const searchResults = await recipeService.searchRecipe(debouncedQuery, 10);
      setResults(searchResults || []);
      setLoading(false);
    };

    if (debouncedQuery) {
      searchRecipes();
    } else {
      setResults([]);
    }
  }, [debouncedQuery]);

  const handleSelect = (recipe: RecipeMetadata) => {
    onRecipeSelect(recipe);
    setQuery('');
    setResults([]);
    onClose();
  };

  const renderResult = ({ item }: { item: RecipeMetadata }) => (
    <TouchableOpacity style={styles.resultItem} onPress={() => handleSelect(item)}>
      <Image 
        source={{ uri: item.imageUrl || undefined }} 
        style={styles.image} 
        // defaultSource={require('@/assets/images/icon.png')} // Suppression de cette ligne
      />
      <View style={styles.resultInfo}>
        <Text style={styles.resultTitle} numberOfLines={2}>{item.title}</Text>
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
          <Text style={styles.modalTitle}>Rechercher un plat ou une recette</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Pâtes carbonara, Tiramisu..."
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
            ListEmptyComponent={
                !loading && query.length > 2 ? (
                    <Text style={styles.noResultsText}>Aucun résultat pour "{query}"</Text>
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
    image: { width: 60, height: 60, borderRadius: 8, marginRight: 15, backgroundColor: '#f0f0f0' },
    resultInfo: { flex: 1 },
    resultTitle: { fontSize: 16, fontFamily: 'Nunito-Bold', color: '#5D4E37' },
    noResultsText: { textAlign: 'center', marginTop: 30, color: '#8B6F47', fontStyle: 'italic' }
});