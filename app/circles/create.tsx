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
import { useTranslation } from 'react-i18next';

export default function CreateCircleScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateCircle = async () => {
    if (name.trim().length < 3) {
      notificationService.showError(t('circles.create.errors.nameTooShort'), "Le nom du cercle doit faire au moins 3 caractères.");
      return;
    }
    setLoading(true);

    const { data, error } = await supabase.rpc('create_circle', {
      p_name: name.trim(),
      p_description: description.trim()
    });

    setLoading(false);

    if (error) {
      notificationService.showError(t('common.error'), t('circles.create.errors.creationFailed'));
      console.error(error);
    } else {
      notificationService.showSuccess(t('common.success'), t('circles.create.success'));
      router.back();
    }
  };

  return (
    <BackgroundWrapper>
      <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('circles.create.title')}</Text>
        </View>
        
        <CozyCard>
          <Text style={styles.label}>{t('circles.create.nameLabel')}</Text>
          <TextInput
            style={styles.input}
            placeholder={t('circles.create.namePlaceholder')}
            value={name}
            onChangeText={setName}
            placeholderTextColor={theme.colors.textLight}
          />

          <Text style={styles.label}>{t('circles.create.descriptionLabel')}</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder={t('circles.create.descriptionPlaceholder')}
            value={description}
            onChangeText={setDescription}
            multiline
            placeholderTextColor={theme.colors.textLight}
          />

          <CozyButton onPress={handleCreateCircle} disabled={loading} size="large" style={{marginTop: 10}}>
            {loading ? t('circles.create.creatingButton') : t('circles.create.createButton')}
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
