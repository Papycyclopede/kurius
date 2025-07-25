// app/(tabs)/create-event.tsx
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Image } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { Sparkles, Check, User as UserIcon, Film, Book, Tv, Users, Home } from 'lucide-react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { recommendationService, ParticipantPreferences, EventCategory as RecommendationEventCategory } from '@/services/recommendationService';
import { getLocalProfiles, LocalProfile } from '@/services/localProfileService';
import { useAuth } from '@/contexts/AuthContext';
import KuriusAvatar from '@/components/KuriusAvatar';
import CozyCard from '@/components/CozyCard';
import CozyButton from '@/components/CozyButton';
import React from 'react';
import * as Localization from 'expo-localization';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BackgroundWrapper from '@/components/BackgroundWrapper';
import { theme } from '@/constants/Theme';
import { supabase } from '@/lib/supabase';
import { notificationService } from '@/services/notificationService';

type EventType = 'local' | 'circle';
type EventCategory = RecommendationEventCategory;

interface Circle {
  id: string;
  name: string;
}

export default function CreateEventScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const [eventType, setEventType] = useState<EventType | null>(null);
  const [availableCircles, setAvailableCircles] = useState<Circle[]>([]);
  const [selectedCircle, setSelectedCircle] = useState<Circle | null>(null);
  const [localProfiles, setLocalProfiles] = useState<LocalProfile[]>([]);
  const [selectedLocalProfileIds, setSelectedLocalProfileIds] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedCategoryState, setSelectedCategoryState] = useState<EventCategory | null>(null);
  const [conversationStep, setConversationStep] = useState(0);
  const [userLanguage, setUserLanguage] = useState<string>('en');
  const [selectionLimit, setSelectionLimit] = useState<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      const loadInitialData = async () => {
        const local = await getLocalProfiles();
        setLocalProfiles(local);
        const { data: circles } = await supabase.rpc('get_user_circles');
        setAvailableCircles(circles || []);
      };
      
      const fetchUserLanguage = async () => {
        const locales = await Localization.getLocales();
        setUserLanguage(locales[0]?.languageCode || 'en');
      };

      loadInitialData();
      fetchUserLanguage();

      setEventType(null);
      setSelectedCircle(null);
      setSelectedLocalProfileIds([]);
      setSelectedCategoryState(null);
      setConversationStep(0);
      setSelectionLimit(null);
    }, [])
  );

  const handleSelectEventType = (type: EventType, limit: number | null) => {
    setEventType(type);
    setSelectionLimit(limit);
    setConversationStep(1);
  };

  const handleSelectCircle = (circle: Circle) => {
    setSelectedCircle(circle);
    setConversationStep(2);
  };

  const handleMemberToggle = (profileId: string) => {
    setSelectedLocalProfileIds(currentSelected => {
      if (selectionLimit === 1) {
        return currentSelected.includes(profileId) ? [] : [profileId];
      }
      return currentSelected.includes(profileId)
        ? currentSelected.filter(id => id !== profileId)
        : [...currentSelected, profileId];
    });
  };
  
  const handleSelectCategory = (category: EventCategory) => {
    setSelectedCategoryState(category);
    setConversationStep(3);
  };

  const handleGenerate = async () => {
    if (!selectedCategoryState) return;
    setIsGenerating(true);

    if (eventType === 'local') {
      if (selectedLocalProfileIds.length === 0) {
        notificationService.showError("Oups !", "Veuillez sélectionner au moins un participant.");
        setIsGenerating(false);
        return;
      }
      const participantsData: ParticipantPreferences[] = selectedLocalProfileIds.map(id => {
        const profile = localProfiles.find(p => p.id === id)!;
        return { name: profile.name, films: profile.films || [], books: profile.books || [], tvShows: profile.tvShows || [], };
      });
      const recommendations = await recommendationService.generateRecommendations(participantsData, selectedCategoryState, userLanguage);
      const participantNames = participantsData.map(p => p.name);
      router.push({ pathname: '/vote-screen', params: { recommendations: JSON.stringify(recommendations), participants: JSON.stringify(participantNames), category: selectedCategoryState } });
    
    } else if (eventType === 'circle' && selectedCircle) {
      const { data: eventId, error: eventError } = await supabase.rpc('create_online_event', {
        p_circle_id: selectedCircle.id,
        p_category: selectedCategoryState,
      });

      if (eventError || !eventId) {
        setIsGenerating(false);
        notificationService.showError("Erreur", "Impossible de créer l'événement en ligne.");
        console.error(eventError);
        return;
      }
      
      try {
        const { data: membersResponse, error: membersError } = await supabase.from('circle_members').select('profiles(full_name, favorite_films, favorite_books, favorite_tv_shows)').eq('circle_id', selectedCircle.id);
        if (membersError) throw membersError;
        
        const participantsData: ParticipantPreferences[] = (membersResponse || []).map((m: any) => ({
          name: m.profiles.full_name,
          films: m.profiles.favorite_films || [],
          books: m.profiles.favorite_books || [],
          tvShows: m.profiles.favorite_tv_shows || [],
        }));
        
        await recommendationService.generateAndStoreRecommendations(eventId, participantsData, selectedCategoryState, userLanguage);
        router.push({ pathname: '/events/[id]', params: { id: eventId } });

      } catch (recoError) {
        notificationService.showError("Erreur", "Impossible de générer les recommandations.");
        console.error(recoError);
      }
    }
    
    setIsGenerating(false);
  };

  return (
    <BackgroundWrapper backgroundImage={require('@/assets/images/bureau.png')} noOverlay={true}>
      <ScrollView contentContainerStyle={{paddingTop: insets.top + 40, paddingBottom: 120, paddingHorizontal: 20}}>
        
        {conversationStep === 0 && (
          <View>
            <Text style={styles.title}>Pour qui est cette activité ?</Text>
            
            <TouchableOpacity onPress={() => handleSelectEventType('local', 1)}>
              <CozyCard style={styles.typeSelectionCard}>
                <UserIcon color={theme.colors.textDark} style={styles.icon} />
                <Text style={styles.typeSelectionText}>Pour Moi Uniquement (solo)</Text>
              </CozyCard>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => handleSelectEventType('local', null)}>
              <CozyCard style={styles.typeSelectionCard}>
                <Home color={theme.colors.textDark} style={styles.icon} />
                <Text style={styles.typeSelectionText}>Mon Cercle Familial (local)</Text>
              </CozyCard>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => handleSelectEventType('circle', null)} disabled={availableCircles.length === 0}>
              <CozyCard style={[styles.typeSelectionCard, availableCircles.length === 0 && styles.disabledCard]}>
                <Users color={availableCircles.length > 0 ? theme.colors.textDark : theme.colors.textLight} style={styles.icon} />
                <Text style={[styles.typeSelectionText, availableCircles.length === 0 && styles.disabledText]}>Un Cercle d'Amis (en ligne)</Text>
              </CozyCard>
            </TouchableOpacity>
          </View>
        )}

        {eventType === 'local' && conversationStep === 1 && (
           <View>
             <Text style={styles.title}>{selectionLimit === 1 ? "Quel profil utiliser ?" : "Qui participe ?"}</Text>
             <View style={styles.membersGrid}>
               {localProfiles.map((member) => (
                   <TouchableOpacity key={member.id} style={[styles.memberCard, selectedLocalProfileIds.includes(member.id) && styles.memberCardSelected]} onPress={() => handleMemberToggle(member.id)}>
                     {member.avatarUri ? <Image source={{uri: member.avatarUri}} style={styles.memberAvatarImage} /> : <View style={styles.memberAvatarPlaceholder}><UserIcon color="#8B6F47" size={32}/></View>}
                     <Text style={styles.memberName}>{member.name}</Text>
                     {selectedLocalProfileIds.includes(member.id) && (<View style={styles.memberCheck}><Check size={12} color="#FFF8E7" strokeWidth={3} /></View>)}
                   </TouchableOpacity>
               ))}
             </View>
             <CozyButton onPress={() => setConversationStep(2)} disabled={selectedLocalProfileIds.length === 0}>Continuer</CozyButton>
           </View>
        )}
        
        {eventType === 'circle' && conversationStep === 1 && (
          <View>
            <Text style={styles.title}>Choisissez un cercle</Text>
            {availableCircles.map(circle => (
              <TouchableOpacity key={circle.id} onPress={() => handleSelectCircle(circle)}>
                <CozyCard style={styles.itemCard}><Text style={styles.itemText}>{circle.name}</Text></CozyCard>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {conversationStep === 2 && (
          <View>
            <Text style={styles.title}>Que voulez-vous faire ?</Text>
            <View style={styles.categorySelector}>
                <TouchableOpacity style={styles.categoryButton} onPress={() => handleSelectCategory('film')}><Film size={24} color={'#8B6F47'} /><Text style={styles.categoryText}>Film</Text></TouchableOpacity>
                <TouchableOpacity style={styles.categoryButton} onPress={() => handleSelectCategory('tvShow')}><Tv size={24} color={'#8B6F47'} /><Text style={styles.categoryText}>Série</Text></TouchableOpacity>
                <TouchableOpacity style={styles.categoryButton} onPress={() => handleSelectCategory('book')}><Book size={24} color={'#8B6F47'} /><Text style={styles.categoryText}>Livre</Text></TouchableOpacity>
            </View>
          </View>
        )}
        
        {conversationStep === 3 && (
            <View style={styles.generationContainer}>
                <Text style={styles.title}>Prêt à lancer la magie ?</Text>
                <KuriusAvatar size='large' animated />
                <CozyButton onPress={handleGenerate} disabled={isGenerating} icon={<Sparkles size={16} color={theme.colors.textOnPrimary_alt} />} size="large" style={{marginTop: 20}}>
                  {isGenerating ? "Magie en cours..." : "Trouver l'activité parfaite"}
                </CozyButton>
            </View>
        )}

      </ScrollView>
    </BackgroundWrapper>
  );
}

const styles = StyleSheet.create({
  title: { ...theme.fonts.title, fontSize: 28, textAlign: 'center', marginBottom: 24, color: theme.colors.textDark },
  typeSelectionCard: { flexDirection: 'row', alignItems: 'center', padding: 20, marginBottom: 16 },
  disabledCard: { backgroundColor: 'rgba(230, 230, 230, 0.7)' },
  typeSelectionText: { ...theme.fonts.subtitle, fontSize: 18, color: theme.colors.textDark },
  disabledText: { color: theme.colors.textLight },
  icon: { marginRight: 16 },
  itemCard: { padding: 20, marginBottom: 12 },
  itemText: { ...theme.fonts.body, fontSize: 16 },
  membersGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12, paddingVertical: 5, marginBottom: 20 },
  memberCard: { backgroundColor: 'rgba(255, 255, 231, 0.6)', borderRadius: 15, padding: 12, alignItems: 'center', position: 'relative', borderWidth: 2, borderColor: 'rgba(212, 165, 116, 0.2)', width: 100, },
  memberCardSelected: { borderColor: theme.colors.primary, backgroundColor: 'rgba(212, 165, 116, 0.1)', },
  memberAvatarImage: { width: 60, height: 60, borderRadius: 30, marginBottom: 8, },
  memberAvatarPlaceholder: { width: 60, height: 60, borderRadius: 30, marginBottom: 8, backgroundColor: 'rgba(212, 165, 116, 0.2)', justifyContent: 'center', alignItems: 'center', },
  memberName: { fontSize: 14, fontFamily: 'Nunito-SemiBold', color: '#5D4E37', textAlign: 'center', },
  memberCheck: { position: 'absolute', top: 4, right: 4, width: 24, height: 24, borderRadius: 12, backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center', },
  categorySelector: { flexDirection: 'row', justifyContent: 'space-around', gap: 8, },
  categoryButton: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 20, borderRadius: 15, backgroundColor: theme.colors.cardDefault, borderWidth: 2, borderColor: 'rgba(212, 165, 116, 0.3)', },
  categoryText: { marginTop: 8, fontSize: 14, fontFamily: 'Nunito-Bold', color: '#8B6F47', },
  generationContainer: { alignItems: 'center', marginTop: 40 },
});