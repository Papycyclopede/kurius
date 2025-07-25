// app/circles/create.tsx
import { View, Text, TextInput, StyleSheet, Alert } from 'react-native';
import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import BackgroundWrapper from '@/components/BackgroundWrapper';
import CozyCard from '@/components/CozyCard';
import CozyButton from '@/components/CozyButton';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { theme } from '@/constants/Theme';
import { notificationService } from '@/services/notificationService';

export default function CreateCircleScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateCircle = async () => {
    if (name.trim().length < 3) {
      notificationService.showError("Nom trop court", "Le nom du cercle doit faire au moins 3 caractères.");
      return;
    }
    setLoading(true);

    const { data, error } = await supabase.rpc('create_circle', {
      p_name: name.trim(),
      p_description: description.trim()
    });

    setLoading(false);

    if (error) {
      notificationService.showError("Erreur", "La création du cercle a échoué.");
      console.error(error);
    } else {
      notificationService.showSuccess("Cercle créé !", `Le cercle "${name.trim()}" a été créé avec succès.`);
      router.back(); // Revenir à la liste des cercles
    }
  };

  return (
    <BackgroundWrapper>
      <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Créer un nouveau cercle</Text>
        </View>
        
        <CozyCard>
          <Text style={styles.label}>Nom du cercle</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Soirées Ciné, Club de lecture..."
            value={name}
            onChangeText={setName}
            placeholderTextColor={theme.colors.textLight}
          />

          <Text style={styles.label}>Description (optionnel)</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="Une petite description pour votre cercle"
            value={description}
            onChangeText={setDescription}
            multiline
            placeholderTextColor={theme.colors.textLight}
          />

          <CozyButton onPress={handleCreateCircle} disabled={loading} size="large" style={{marginTop: 10}}>
            {loading ? "Création..." : "Créer le cercle"}
          </CozyButton>
        </CozyCard>
      </View>
    </BackgroundWrapper>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: { 
    ...theme.fonts.title,
    fontSize: 28, 
    color: theme.colors.textDark,
    textAlign: 'center'
  },
  label: {
    ...theme.fonts.subtitle,
    fontSize: 16,
    color: theme.colors.textMedium,
    marginBottom: 8,
    marginLeft: 4,
  },
  input: { 
    backgroundColor: 'rgba(255, 255, 255, 0.7)', 
    borderRadius: theme.sizing.borderRadiusInput, 
    padding: 16,
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    borderWidth: 1,
    borderColor: theme.colors.borderColor,
    color: theme.colors.textDark,
    marginBottom: 16,
  },
  textarea: {
    height: 100,
    textAlignVertical: 'top',
  },
});