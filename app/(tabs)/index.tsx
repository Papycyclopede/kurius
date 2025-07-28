// app/(tabs)/index.tsx
import { View, Text, StyleSheet, Image, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { Send } from 'lucide-react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import BackgroundWrapper from '@/components/BackgroundWrapper';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import KuriusAvatar from '@/components/KuriusAvatar';
import TypingText from '@/components/TypingText';
import { theme } from '@/constants/Theme';
import { supabase } from '@/lib/supabase';
import { getLocalProfiles, LocalProfile, saveOrUpdateProfile } from '@/services/localProfileService'; // Import des services de profil
import { FavoriteFilm, FavoriteBook, FavoriteTvShow } from '@/types';

export default function HomeScreen() {
  const router = useRouter();
  const { profile, refreshProfile } = useAuth();
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();

  const [conversationHistory, setConversationHistory] = useState<{ role: string; parts: { text: string }[] }[]>([]);
  const [kuriusMessage, setKuriusMessage] = useState(t('home.kuriusWelcome'));
  const [userMessage, setUserMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [localProfiles, setLocalProfiles] = useState<LocalProfile[]>([]);

  // Charger les profils locaux au démarrage de l'écran
  useFocusEffect(
    React.useCallback(() => {
      const loadProfiles = async () => {
        const profiles = await getLocalProfiles();
        setLocalProfiles(profiles);
      };
      loadProfiles();
    }, [])
  );

  useEffect(() => {
    setKuriusMessage(t('home.kuriusWelcome'));
  }, [i18n.language, t]);

  // Met à jour un profil local avec un nouveau favori
  const applyProfileUpdate = async (profileId: string, newFavorite: FavoriteFilm | FavoriteBook | FavoriteTvShow, category: 'films' | 'books' | 'tvShows') => {
      const profileToUpdate = localProfiles.find(p => p.id === profileId);
      if (profileToUpdate) {
          const updatedProfile = {
              ...profileToUpdate,
              [category]: [...(profileToUpdate[category] || []), newFavorite]
          };
          await saveOrUpdateProfile(updatedProfile);
          // Rafraîchir la liste des profils dans l'état local
          const profiles = await getLocalProfiles();
          setLocalProfiles(profiles);
      }
  };

  const handleSendMessage = async () => {
    if (!userMessage.trim() || isLoading) return;

    const newUserMessage = { role: 'user', parts: [{ text: userMessage }] };
    const newHistory = [...conversationHistory, newUserMessage];

    setIsLoading(true);
    setKuriusMessage('');
    setUserMessage('');
    setConversationHistory(newHistory);

    try {
      const { data, error } = await supabase.functions.invoke('kurius-chat', {
        body: {
          conversationHistory: newHistory,
          userLanguage: i18n.language,
          // On envoie les profils locaux avec la requête !
          localProfiles: localProfiles,
        },
      });

      if (error) throw error;
      
      // On traite la nouvelle réponse structurée
      const { conversational_response, profile_updates } = data;
      
      setKuriusMessage(conversational_response);
      const newModelMessage = { role: 'model', parts: [{ text: conversational_response }] };
      setConversationHistory([...newHistory, newModelMessage]);

      // Si la fonction a renvoyé des mises à jour de profil, on les applique
      if (profile_updates && Array.isArray(profile_updates)) {
          for (const update of profile_updates) {
              await applyProfileUpdate(update.profileId, update.newFavorite, update.category);
          }
      }

      await refreshProfile();

    } catch (error) {
      console.error("Erreur d'appel à la fonction kurius-chat:", error);
      setKuriusMessage("Oups, il y a eu une interférence dans ma transmission...");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <BackgroundWrapper 
      backgroundImage={require('@/assets/images/bureau.png')} 
      noOverlay={true}
    >
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.container}>
          
          <View style={[styles.contentContainer, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            <View style={styles.logoContainer}>
              <Image
                source={require('@/assets/images/kurius-logo.png')}
                style={styles.logoImage}
              />
            </View>
            
            <View style={styles.avatarWrapper}>
              <View style={styles.bubbleWrapper}>
                <View style={styles.kuriusBubble}>
                    <TypingText text={kuriusMessage} style={styles.kuriusBubbleText} />
                    <View style={styles.kuriusBubbleTip} />
                </View>
              </View>

              <View style={styles.avatarContainer}>
                <KuriusAvatar size="xlarge" animated={true} speechText={kuriusMessage} />
              </View>
            </View>
          </View>

          <View style={[styles.inputContainer, { paddingBottom: insets.bottom + 65 }]}>
              <View style={styles.inputWrapper}>
                  <TextInput
                      style={styles.textInput}
                      placeholder={t('home.kuriusPlaceholder') || "Parlez à Kurius..."}
                      placeholderTextColor={theme.colors.textLight}
                      value={userMessage}
                      onChangeText={setUserMessage}
                      onSubmitEditing={handleSendMessage}
                      editable={!isLoading}
                  />
                  <TouchableOpacity onPress={handleSendMessage} style={styles.sendButton} disabled={isLoading}>
                      {isLoading ? (
                          <ActivityIndicator size="small" color={theme.colors.primary} />
                      ) : (
                          <Send size={20} color={theme.colors.primary} />
                      )}
                  </TouchableOpacity>
              </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </BackgroundWrapper>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 30,
    paddingBottom: 150,
  },
  logoContainer: {
    backgroundColor: 'rgba(255, 243, 201, 0.8)',
    borderRadius: 20,
    padding: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  logoImage: {
    width: 200,
    height: 120,
    resizeMode: 'contain',
  },
  avatarWrapper: {
    position: 'relative',
    width: 250,
    height: 350,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarContainer: {
    width: 250,
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bubbleWrapper: {
    position: 'absolute',
    bottom: 350,
    width: '150%', 
    alignItems: 'center',
    zIndex: 10,
  },
  kuriusBubble: {
    backgroundColor: theme.colors.background,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 15,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    minHeight: 60,
    justifyContent: 'center',
  },
  kuriusBubbleText: {
    ...theme.fonts.body,
    fontSize: 16,
    color: theme.colors.textDark,
    textAlign: 'center',
    lineHeight: 24,
  },
  kuriusBubbleTip: {
    position: 'absolute',
    bottom: -15, 
    alignSelf: 'center',
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 15,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: theme.colors.background,
  },
  inputContainer: {
    paddingHorizontal: 20,
    paddingTop: 10, 
    backgroundColor: 'transparent',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: 30,
    paddingLeft: 20,
    paddingRight: 10,
    height: 50,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  textInput: {
    flex: 1,
    ...theme.fonts.body,
    fontSize: 15,
    color: theme.colors.textDark,
  },
  sendButton: {
    padding: 8,
  },
});