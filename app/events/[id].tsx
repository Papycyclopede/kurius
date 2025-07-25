// app/events/[id].tsx
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import React, { useState, useEffect, useCallback } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import BackgroundWrapper from '@/components/BackgroundWrapper';
import CozyCard from '@/components/CozyCard';
import CozyButton from '@/components/CozyButton';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '@/constants/Theme';
import { useAuth } from '@/contexts/AuthContext';
import { EnrichedRecommendation } from '@/services/recommendationService';
import { notificationService } from '@/services/notificationService';
import { Crown } from 'lucide-react-native';

interface Vote {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
}
interface RecommendationWithVotes extends EnrichedRecommendation {
  id: string; // L'ID de la recommandation dans la DB, pas TMDb
  votes: Vote[] | null;
}
interface EventDetails {
  details: { name: string; description: string; creator_id: string; status: string; };
  recommendations: RecommendationWithVotes[];
  participants: { id: string; full_name: string }[];
}

export default function RealtimeVoteScreen() {
  const { id: eventId } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();

  const [eventDetails, setEventDetails] = useState<EventDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [userVote, setUserVote] = useState<string | null>(null);

  const fetchEventDetails = useCallback(async () => {
    if (!eventId) return;
    const { data, error } = await supabase.rpc('get_event_details_for_voting', { p_event_id: eventId });
    if (error) {
      notificationService.showError("Erreur", "Impossible de charger l'événement.");
      router.back();
    } else {
      setEventDetails(data);
      const currentUserVote = data.recommendations?.find((rec: any) => rec.votes?.some((v: any) => v.user_id === user?.id));
      if (currentUserVote) {
        setUserVote(currentUserVote.id);
      }
    }
    setLoading(false);
  }, [eventId, user?.id]);

  useEffect(() => {
    fetchEventDetails();
  }, [fetchEventDetails]);

  useEffect(() => {
    if (!eventId) return;
    const voteChannel = supabase.channel(`votes-for-${eventId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'votes', filter: `event_id=eq.${eventId}` }, 
      (payload) => {
        console.log('Changement détecté dans les votes !', payload);
        fetchEventDetails();
      }
    ).subscribe();

    const eventChannel = supabase.channel(`event-status-for-${eventId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'cultural_events', filter: `id=eq.${eventId}`},
      (payload) => {
        const newStatus = payload.new.status;
        if (newStatus === 'completed' || newStatus === 'cancelled') {
            handleVoteClosure(true); // on force la redirection
        }
      }
    ).subscribe();

    return () => {
      supabase.removeChannel(voteChannel);
      supabase.removeChannel(eventChannel);
    };
  }, [eventId, fetchEventDetails]);

  const handleVote = async (recommendationId: string) => {
    setUserVote(recommendationId);
    const { error } = await supabase.rpc('cast_vote', {
      p_event_id: eventId,
      p_recommendation_id: recommendationId
    });
    if (error) {
      notificationService.showError("Erreur", "Votre vote n'a pas pu être enregistré.");
      setUserVote(null);
    }
  };

  const handleVoteClosure = async (isRealtimeUpdate = false) => {
    const { data: winner, error } = await supabase.rpc('close_vote_and_get_winner', { p_event_id: eventId });
    if (error && !isRealtimeUpdate) { // on n'affiche l'erreur que si c'est le créateur qui clique
        notificationService.showError("Erreur", "Impossible de clôturer le vote.");
    } else if (winner) {
        notificationService.showSuccess("Vote terminé !", `Le choix du groupe est : ${winner.title}`);
        router.replace({ pathname: '/result-screen', params: { winner: JSON.stringify(winner) } });
    } else if (!isRealtimeUpdate) {
        notificationService.showInfo("Vote annulé", "Aucun vote n'a été enregistré.");
        router.replace('/(tabs)');
    }
  };

  if (loading || !eventDetails) {
    return (
      <BackgroundWrapper>
        <ActivityIndicator size="large" color={theme.colors.primary} style={StyleSheet.absoluteFill} />
      </BackgroundWrapper>
    );
  }

  const isCreator = user?.id === eventDetails.details.creator_id;

  return (
    <BackgroundWrapper>
      <ScrollView contentContainerStyle={[styles.container, { paddingTop: insets.top + 20 }]}>
        <View style={styles.header}>
          <Text style={styles.title}>{eventDetails.details.name}</Text>
          <Text style={styles.subtitle}>Faites votre choix !</Text>
        </View>

        {eventDetails.recommendations.map((rec) => (
          <CozyCard key={rec.id} style={[styles.card, userVote === rec.id && styles.selectedCard]}>
            <View style={styles.cardHeader}>
              {rec.posterUrl && <Image source={{ uri: rec.posterUrl }} style={styles.posterImage} />}
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>{rec.title}</Text>
              </View>
            </View>
            
            <View style={styles.votesContainer}>
              <Text style={styles.votesLabel}>Votes :</Text>
              {(rec.votes || []).map(vote => (
                <Image key={vote.user_id} source={{uri: vote.avatar_url || undefined}} style={styles.voterAvatar} />
              ))}
            </View>

            <CozyButton onPress={() => handleVote(rec.id)}>
              {userVote === rec.id ? "C'est mon vote !" : "Voter pour celui-ci"}
            </CozyButton>
          </CozyCard>
        ))}

        {isCreator && (
            <View style={styles.actionButtonContainer}>
                <CozyButton onPress={() => handleVoteClosure(false)} icon={<Crown />} size="large">
                    Clôturer le vote et voir le résultat
                </CozyButton>
            </View>
        )}
      </ScrollView>
    </BackgroundWrapper>
  );
}

const styles = StyleSheet.create({
    container: { paddingBottom: 40 },
    header: { padding: 20, alignItems: 'center' },
    title: { ...theme.fonts.title, fontSize: 28, textAlign: 'center' },
    subtitle: { ...theme.fonts.body, fontSize: 16, color: theme.colors.textLight, marginTop: 8 },
    card: { marginHorizontal: 20, backgroundColor: theme.colors.cardDefault, marginBottom: 16, borderWidth: 3, borderColor: 'transparent' },
    selectedCard: { borderColor: theme.colors.primary },
    cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
    posterImage: { width: 80, height: 120, borderRadius: 8, backgroundColor: theme.colors.disabledBackground },
    cardInfo: { flex: 1 },
    cardTitle: { ...theme.fonts.subtitle, fontSize: 18, marginBottom: 4 },
    votesContainer: { flexDirection: 'row', alignItems: 'center', height: 40, marginVertical: 8, paddingHorizontal: 5 },
    votesLabel: { ...theme.fonts.caption, marginRight: 8, color: theme.colors.textLight },
    voterAvatar: { width: 32, height: 32, borderRadius: 16, marginRight: -12, borderWidth: 2, borderColor: theme.colors.background },
    actionButtonContainer: { padding: 20, marginTop: 20 }
});