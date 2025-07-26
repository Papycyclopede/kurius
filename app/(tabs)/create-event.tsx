// app/(tabs)/create-event.tsx
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Image } from 'react-native';
import { useState, useEffect } from 'react';
import { Sparkles, Check, User as UserIcon, Film, Book, Tv, Users, Home, HeartHandshake, Zap } from 'lucide-react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { recommendationService, ParticipantPreferences, EventCategory as RecommendationEventCategory } from '@/services/recommendationService';
import { getLocalProfiles, LocalProfile } from '@/services/localProfileService';
import { useAuth } from '@/contexts/AuthContext';
import KuriusAvatar from '@/components/KuriusAvatar';
import CozyCard from '@/components/CozyCard';
import CozyButton from '@/components/CozyButton';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BackgroundWrapper from '@/components/BackgroundWrapper';
import { theme } from '@/constants/Theme';
import { supabase } from '@/lib/supabase';
import { notificationService } from '@/services/notificationService';
import TypingText from '@/components/TypingText';

type EventType = 'local' | 'circle';
type EventCategory = RecommendationEventCategory;

interface Circle {
  id: string;
  name: string;
}

export default function CreateEventScreen() {
  const router = useRouter();
  const { user, isPremium } = useAuth();
  // MODIFICATION: On récupère l'instance i18n pour connaître la langue actuelle
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();

  const [eventType, setEventType] = useState<EventType | null>(null);
  const [availableCircles, setAvailableCircles] = useState<Circle[]>([]);
  const [selectedCircle, setSelectedCircle] = useState<Circle | null>(null);
  const [localProfiles, setLocalProfiles] = useState<LocalProfile[]>([]);
  const [selectedLocalProfileIds, setSelectedLocalProfileIds] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedCategoryState, setSelectedCategoryState] = useState<EventCategory | null>(null);
  const [conversationStep, setConversationStep] = useState(0);
  
  // SUPPRESSION: L'état userLanguage et l'import de expo-localization ne sont plus nécessaires.
  // const [userLanguage, setUserLanguage] = useState<string>('en');

  const KURIUS_BOTTOM_AREA_HEIGHT = 280; 

  useFocusEffect(
    React.useCallback(() => {
      const loadInitialData = async () => {
        const local = await getLocalProfiles();
        setLocalProfiles(local);
        if (user) {
            const { data: circles, error: circlesError } = await supabase.rpc('get_user_circles'); 
            if (circlesError) {
              console.error("Error fetching circles:", circlesError);
              setAvailableCircles([]);
            } else {
              setAvailableCircles(circles || []);
            }
        }
      };
      
      loadInitialData();

      // On réinitialise l'écran à chaque fois qu'il est affiché
      setEventType(null);
      setSelectedCircle(null);
      setSelectedLocalProfileIds([]);
      setSelectedCategoryState(null);
      setConversationStep(0);
    }, [user])
  );

  const handleSelectEventType = (type: EventType) => {
    setEventType(type);
    setConversationStep(1);
  };

  const handleSelectCategory = (category: EventCategory) => {
    setSelectedCategoryState(category);
    setConversationStep(2);
  };

  const handleSelectCircle = (circle: Circle) => {
    setSelectedCircle(circle);
    setConversationStep(3);
  };
  
  const handleMemberToggle = (profileId: string) => {
    setSelectedLocalProfileIds(prev => prev.includes(profileId) ? prev.filter(id => id !== profileId) : [...prev, profileId]);
  };
  
  const handleGenerate = async () => {
    if (!selectedCategoryState) {
      notificationService.showError(t('common.oops'), t('createEvent.errors.categoryRequired'));
      return;
    }
    setIsGenerating(true);

    // MODIFICATION: On utilise i18n.language qui est toujours à jour
    const currentLanguage = i18n.language;

    if (eventType === 'local') {
      if (selectedLocalProfileIds.length === 0) {
        notificationService.showError(t('common.oops'), t('createEvent.errors.noParticipants'));
        setIsGenerating(false);
        return;
      }
      const participantsData: ParticipantPreferences[] = selectedLocalProfileIds.map(id => {
        const profile = localProfiles.find(p => p.id === id)!;
        return { name: profile.name, films: profile.films || [], books: profile.books || [], tvShows: profile.tvShows || [] };
      });

      const recommendations = await recommendationService.generateRecommendations(
        participantsData, 
        selectedCategoryState, 
        currentLanguage, // On passe la langue actuelle
      );
      
      const participantNames = participantsData.map(p => p.name);
      router.push({ pathname: '/vote-screen', params: { recommendations: JSON.stringify(recommendations), participants: JSON.stringify(participantNames), category: selectedCategoryState } });
    
    } else if (eventType === 'circle' && selectedCircle) {
      const { data: eventId, error: eventError } = await supabase.rpc('create_online_event', {
        p_circle_id: selectedCircle.id,
        p_category: selectedCategoryState,
      });

      if (eventError || !eventId) {
        setIsGenerating(false);
        notificationService.showError(t('common.error'), t('createEvent.errors.generationError'));
        console.error(eventError);
        return;
      }
      
      try {
        const { data: membersResponse, error: membersError } = await supabase.from('circle_members').select('profiles(full_name, favorite_films, favorite_books, favorite_tv_shows)').eq('circle_id', selectedCircle.id);
        if (membersError) throw membersError;
        
        const participantsData: ParticipantPreferences[] = membersResponse.map((m: any) => ({
          name: m.profiles.full_name,
          films: m.profiles.favorite_films || [],
          books: m.profiles.favorite_books || [],
          tvShows: m.profiles.favorite_tv_shows || [],
        }));
        
        await recommendationService.generateAndStoreRecommendations(eventId, participantsData, selectedCategoryState, currentLanguage);
        
        router.push({ pathname: '/events/[id]', params: { id: eventId } });

      } catch (recoError) {
        notificationService.showError(t('common.error'), t('createEvent.errors.generationError'));
        console.error(recoError);
      }
    }
    
    setIsGenerating(false);
  };

  const getKuriusSpeechText = () => {
    const hasCircles = availableCircles.length > 0;
    switch(conversationStep) {
      case 0:
        return (isPremium && hasCircles)
          ? t('createEvent.dialogue.step0_premium')
          : t('createEvent.dialogue.step1');
      case 1:
        return t('createEvent.dialogue.step1');
      case 2:
        return t('createEvent.dialogue.step2');
      case 3:
        return t('createEvent.dialogue.step4_generate');
      default:
        return '';
    }
  };

  const hasCircles = availableCircles.length > 0;

  return (
    <BackgroundWrapper backgroundImage={require('@/assets/images/bureau.png')} noOverlay={true}>
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20, paddingBottom: KURIUS_BOTTOM_AREA_HEIGHT }]}>
        
        {conversationStep === 0 && (
          isPremium && hasCircles ? (
            <View style={styles.sectionContainer}>
              <TouchableOpacity onPress={() => handleSelectEventType('local')}>
                <CozyCard style={styles.typeSelectionCard}>
                  <HeartHandshake color={theme.colors.textDark} style={styles.icon} />
                  <Text style={styles.typeSelectionText}>Cercle Familial</Text>
                </CozyCard>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleSelectEventType('circle')}>
                <CozyCard style={styles.typeSelectionCard}>
                  <Zap color={theme.colors.textDark} style={styles.icon} />
                  <Text style={styles.typeSelectionText}>Cercles d'Amis Partagés</Text>
                </CozyCard>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.sectionContainer}>
              <TouchableOpacity onPress={() => handleSelectEventType('local')}>
                <CozyCard style={styles.typeSelectionCard}><Home color={theme.colors.textDark} style={styles.icon} /><Text style={styles.typeSelectionText}>{t('createEvent.typeSelection.localCircle')}</Text></CozyCard>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleSelectEventType('circle')} disabled={!hasCircles}>
                <CozyCard style={[styles.typeSelectionCard, !hasCircles && styles.disabledCard]}>
                  <Users color={hasCircles ? theme.colors.textDark : theme.colors.textLight} style={styles.icon} />
                  <Text style={[styles.typeSelectionText, !hasCircles && styles.disabledText]}>{t('createEvent.typeSelection.sharedCircles')}</Text>
                </CozyCard>
              </TouchableOpacity>
            </View>
          )
        )}

        {conversationStep === 1 && (
          <View style={styles.sectionContainer}>
            <CozyCard style={styles.categoryCardWrapper}>
              <View style={styles.categorySelector}>
                  <TouchableOpacity style={styles.categoryButton} onPress={() => handleSelectCategory('film')}><Film size={24} color={'#8B6F47'} /><Text style={styles.categoryText}>{t('createEvent.categories.film')}</Text></TouchableOpacity>
                  <TouchableOpacity style={styles.categoryButton} onPress={() => handleSelectCategory('tvShow')}><Tv size={24} color={'#8B6F47'} /><Text style={styles.categoryText}>{t('createEvent.categories.tvShow')}</Text></TouchableOpacity>
                  <TouchableOpacity style={styles.categoryButton} onPress={() => handleSelectCategory('book')}><Book size={24} color={'#8B6F47'} /><Text style={styles.categoryText}>{t('createEvent.categories.book')}</Text></TouchableOpacity>
              </View>
            </CozyCard>
          </View>
        )}

        {conversationStep === 2 && eventType === 'local' && (
           <View style={styles.sectionContainer}>
             <CozyCard style={styles.memberSelectionCard}>
                <View style={styles.membersGrid}>
                  {localProfiles.map((member) => (
                      <TouchableOpacity key={member.id} style={[styles.memberCard, selectedLocalProfileIds.includes(member.id) && styles.memberCardSelected]} onPress={() => handleMemberToggle(member.id)}>
                        {member.avatarUri ? <Image source={{uri: member.avatarUri}} style={styles.memberAvatarImage} /> : <View style={styles.memberAvatarPlaceholder}><UserIcon color="#8B6F47" size={32}/></View>}
                        <Text style={styles.memberName}>{member.name}</Text>
                        {selectedLocalProfileIds.includes(member.id) && (<View style={styles.memberCheck}><Check size={12} color="#FFF8E7" strokeWidth={3} /></View>)}
                      </TouchableOpacity>
                  ))}
                </View>
                <CozyButton 
                  onPress={() => setConversationStep(3)}
                  disabled={selectedLocalProfileIds.length === 0}
                  style={{ marginTop: 12 }}
                >
                  {t('common.continue')}
                </CozyButton>
             </CozyCard>
           </View>
        )}
        
        {conversationStep === 2 && eventType === 'circle' && (
          <View style={styles.sectionContainer}>
            {availableCircles.map(circle => (
              <TouchableOpacity key={circle.id} onPress={() => handleSelectCircle(circle)}>
                <CozyCard style={styles.itemCard}><Text style={styles.itemText}>{circle.name}</Text></CozyCard>
              </TouchableOpacity>
            ))}
          </View>
        )}
        
        {conversationStep === 3 && (
            <View style={styles.generationContainer}>
                <CozyButton onPress={handleGenerate} disabled={isGenerating} icon={<Sparkles size={16} color={theme.colors.textOnPrimary_alt} />} size="large" style={{marginTop: 20}}>
                  {isGenerating ? t('createEvent.generateButtonLoading') : t('createEvent.generateButton')}
                </CozyButton>
            </View>
        )}

      </ScrollView>

      <View style={[styles.kuriusFixedBottomContainer, { paddingBottom: insets.bottom }]}>
        <View style={styles.kuriusBubbleContainer}>
          <View style={styles.kuriusBubble}>
            <Text style={[styles.kuriusBubbleText, { color: 'transparent' }]}>{getKuriusSpeechText()}</Text>
            <View style={[StyleSheet.absoluteFill, styles.typingTextContainer]}>
              <TypingText text={getKuriusSpeechText()} style={styles.kuriusBubbleText} />
            </View>
            <View style={styles.kuriusBubbleTip} />
          </View>
          <KuriusAvatar size='xlarge' animated speechText={getKuriusSpeechText()} />
        </View>
      </View>
    </BackgroundWrapper>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
    flexGrow: 1, 
  },
  kuriusFixedBottomContainer: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: 'center',
    backgroundColor: 'transparent',
    zIndex: 10,
  },
  kuriusBubbleContainer: {
    alignItems: 'center',
    width: '100%',
    position: 'relative',
  },
  kuriusBubble: {
    backgroundColor: theme.colors.background,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 15,
    marginHorizontal: 20,
    alignSelf: 'center',
    maxWidth: '85%',
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    position: 'absolute',
    bottom: 390,
    zIndex: 1, 
  },
  kuriusBubbleText: {
    ...theme.fonts.body,
    fontSize: 16,
    color: theme.colors.textDark,
    textAlign: 'center',
    lineHeight: 24,
  },
  typingTextContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  kuriusBubbleTip: {
    position: 'absolute',
    bottom: -15, 
    left: '50%',
    marginLeft: -10,
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
  sectionContainer: {
    marginBottom: 20,
  },
  typeSelectionCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 20, 
    marginBottom: 16 
  },
  disabledCard: { 
    backgroundColor: 'rgba(230, 230, 230, 0.7)',
    borderColor: 'rgba(212, 165, 116, 0.2)',
  },
  typeSelectionText: { 
    ...theme.fonts.subtitle, 
    fontSize: 18, 
    color: theme.colors.textDark 
  },
  disabledText: { 
    color: theme.colors.textLight 
  },
  icon: { 
    marginRight: 16 
  },
  itemCard: { 
    padding: 20, 
    marginBottom: 12 
  },
  itemText: { 
    ...theme.fonts.body, 
    fontSize: 16 
  },
  memberSelectionCard: {
    backgroundColor: theme.colors.cardPastels[1],
    padding: 15,
  },
  membersGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'center', 
    gap: 12, 
    paddingVertical: 5, 
  },
  memberCard: { 
    backgroundColor: 'rgba(255, 255, 231, 0.6)', 
    borderRadius: 15, 
    padding: 12, 
    alignItems: 'center', 
    position: 'relative', 
    borderWidth: 2, 
    borderColor: 'rgba(212, 165, 116, 0.2)', 
    width: 100, 
  },
  memberCardSelected: { 
    borderColor: theme.colors.primary, 
    backgroundColor: 'rgba(212, 165, 116, 0.1)', 
  },
  memberAvatarImage: { 
    width: 60, 
    height: 60, 
    borderRadius: 30, 
    marginBottom: 8, 
  },
  memberAvatarPlaceholder: { 
    width: 60, 
    height: 60, 
    borderRadius: 30, 
    marginBottom: 8, 
    backgroundColor: 'rgba(212, 165, 116, 0.2)', 
    justifyContent: 'center', 
    alignItems: 'center', 
  },
  memberName: { 
    fontSize: 14, 
    fontFamily: 'Nunito-SemiBold', 
    color: '#5D4E37', 
    textAlign: 'center', 
  },
  memberCheck: { 
    position: 'absolute', 
    top: 4, 
    right: 4, 
    width: 24, 
    height: 24, 
    borderRadius: 12, 
    backgroundColor: theme.colors.primary, 
    justifyContent: 'center', 
    alignItems: 'center', 
  },
  categoryCardWrapper: {
    marginBottom: 24, 
    paddingVertical: 10,
    backgroundColor: theme.colors.cardPastels[0], 
    borderColor: 'rgba(212, 165, 116, 0.3)',
    borderWidth: 1,
  },
  categorySelector: { 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    gap: 8, 
  },
  categoryButton: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 20, 
    borderRadius: 15, 
    backgroundColor: theme.colors.cardDefault, 
    borderWidth: 2, 
    borderColor: 'rgba(212, 165, 116, 0.3)', 
  },
  categoryText: { 
    marginTop: 8, 
    fontSize: 14, 
    fontFamily: 'Nunito-Bold', 
    color: '#8B6F47', 
  },
  generationContainer: { 
    alignItems: 'center', 
    marginTop: 40 
  },
});
