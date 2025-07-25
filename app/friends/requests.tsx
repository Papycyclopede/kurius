// app/friends/requests.tsx
import { View, Text, FlatList, StyleSheet, Image, ActivityIndicator, Alert } from 'react-native';
import React, { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import CozyButton from '@/components/CozyButton';
import { Check, X } from 'lucide-react-native';
import BackgroundWrapper from '@/components/BackgroundWrapper';
import CozyCard from '@/components/CozyCard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { notificationService } from '@/services/notificationService';
import { theme } from '@/constants/Theme';

// CORRECTION DÉFINITIVE : `profiles` est maintenant un TABLEAU d'objets,
// conformément à ce que le message d'erreur TypeScript nous indique.
interface FriendRequest {
  id: string;
  requester_id: string;
  profiles: {
    full_name: string;
    avatar_url: string | null;
  }[]; // C'est un tableau, comme l'indique l'erreur
}

export default function FriendRequestsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    if (!user) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('friendships')
      .select(`
        id,
        requester_id,
        profiles!friendships_requester_id_fkey(full_name, avatar_url)
      `)
      .eq('receiver_id', user.id)
      .eq('status', 'pending');

    if (error) {
      notificationService.showError("Erreur", "Impossible de charger les demandes d'ami.");
      console.error("Supabase error fetching requests:", error);
    } else {
      setRequests(data as FriendRequest[]);
    }
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      fetchRequests();
    }, [user])
  );

  const handleAccept = async (friendshipId: string) => {
    const { error } = await supabase
      .from('friendships')
      .update({ status: 'accepted', updated_at: new Date().toISOString() })
      .eq('id', friendshipId);

    if (error) {
      notificationService.showError("Erreur", "Impossible d'accepter la demande.");
      console.error("Supabase error accepting request:", error);
    } else {
      notificationService.showSuccess("Succès", "Ami ajouté !");
      fetchRequests();
    }
  };

  const handleDecline = async (friendshipId: string) => {
    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('id', friendshipId);

    if (error) {
      notificationService.showError("Erreur", "Impossible de refuser la demande.");
      console.error("Supabase error declining request:", error);
    } else {
      fetchRequests();
    }
  };
  
  // CORRECTION : On extrait le premier élément du tableau `profiles`.
  const getProfileData = (item: FriendRequest) => {
      return item.profiles && item.profiles.length > 0 ? item.profiles[0] : null;
  }

  return (
    <BackgroundWrapper>
      <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
        <Text style={styles.title}>Demandes d'ami</Text>
        
        {loading ? (
            <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
        ) : (
            <FlatList
                data={requests}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ paddingTop: 20 }}
                renderItem={({ item }) => {
                    const profile = getProfileData(item);
                    if (!profile) return null;

                    return (
                        <CozyCard style={styles.requestCard}>
                            <Image 
                                source={profile.avatar_url ? { uri: profile.avatar_url } : require('@/assets/images/kurius-avatar.png')}
                                style={styles.avatar} 
                            />
                            <View>
                                <Text style={styles.fullName}>{profile.full_name}</Text>
                            </View>
                            <View style={{ flex: 1 }} />
                            <View style={styles.actions}>
                                <CozyButton size="small" onPress={() => handleDecline(item.id)} variant="ghost" style={{ borderColor: theme.colors.error }} icon={<X size={16} color={theme.colors.error} />} />
                                <CozyButton size="small" onPress={() => handleAccept(item.id)} icon={<Check size={16} />} />
                            </View>
                        </CozyCard>
                    );
                }}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>Aucune nouvelle demande d'ami.</Text>
                    </View>
                }
            />
        )}
      </View>
    </BackgroundWrapper>
  );
}

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        paddingHorizontal: 20,
    },
    title: { 
        ...theme.fonts.title,
        fontSize: 28, 
        color: theme.colors.textDark,
        textAlign: 'center',
        marginBottom: 10,
    },
    requestCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
    },
    avatar: { 
        width: 50, 
        height: 50, 
        borderRadius: 25, 
        marginRight: 16, 
        backgroundColor: theme.colors.disabledBackground
    },
    fullName: { 
        ...theme.fonts.subtitle,
        fontSize: 16, 
    },
    actions: {
        flexDirection: 'row',
        gap: 8,
    },
    emptyContainer: {
        marginTop: 40,
        alignItems: 'center',
    },
    emptyText: { 
        ...theme.fonts.body,
        textAlign: 'center', 
        color: theme.colors.textLight,
        fontStyle: 'italic'
    }
});