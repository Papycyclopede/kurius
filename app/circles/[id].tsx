// app/circles/[id].tsx
import { View, Text, StyleSheet, ActivityIndicator, FlatList, Image } from 'react-native';
import React, { useState, useCallback } from 'react';
import { useLocalSearchParams, useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import BackgroundWrapper from '@/components/BackgroundWrapper';
import CozyButton from '@/components/CozyButton';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '@/constants/Theme';
import { UserPlus } from 'lucide-react-native';
import FriendInviteModal from '@/components/FriendInviteModal';
import { notificationService } from '@/services/notificationService';

interface CircleDetails {
  id: string;
  name: string;
  description: string;
}

interface Member {
  id: string;
  full_name: string;
  avatar_url: string | null;
}

export default function CircleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [circle, setCircle] = useState<CircleDetails | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInviteModalVisible, setInviteModalVisible] = useState(false);

  // CORRECTION DÉFINITIVE : La logique asynchrone est enveloppée dans une fonction
  // qui est appelée par le hook, ce qui est la seule bonne pratique.
  useFocusEffect(
    useCallback(() => {
      const fetchCircleDetails = async () => {
        if (!id) return;
        setLoading(true);
        const { data, error } = await supabase.rpc('get_circle_details', { p_circle_id: id });
        
        if (error) {
          console.error("Error fetching circle details:", error);
          setCircle(null);
          setMembers([]);
        } else if (data) {
          setCircle(data.details);
          setMembers(data.members);
        }
        setLoading(false);
      };

      fetchCircleDetails();
    }, [id])
  );

  const handleInviteFriends = async (selectedFriendIds: string[]) => {
    if (!id || selectedFriendIds.length === 0) return;

    const { error } = await supabase.rpc('add_members_to_circle', {
      p_circle_id: id,
      p_member_ids: selectedFriendIds
    });

    if (error) {
      notificationService.showError("Erreur", "Impossible d'ajouter les membres.");
      console.error(error);
    } else {
      notificationService.showSuccess("Succès", `${selectedFriendIds.length} ami(s) ajouté(s) au cercle !`);
      // On rafraîchit la liste des membres après l'ajout
      const { data } = await supabase.rpc('get_circle_details', { p_circle_id: id });
      if (data) {
        setMembers(data.members);
      }
    }
  };

  if (loading) {
    return (
      <BackgroundWrapper>
        <ActivityIndicator size="large" color={theme.colors.primary} style={StyleSheet.absoluteFill} />
      </BackgroundWrapper>
    );
  }
  
  if (!circle) {
    return (
      <BackgroundWrapper>
        <View style={styles.container}>
          <Text style={styles.title}>Cercle introuvable</Text>
        </View>
      </BackgroundWrapper>
    )
  }

  return (
    <BackgroundWrapper>
      <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
        <View style={styles.header}>
          <Text style={styles.title}>{circle.name}</Text>
          <Text style={styles.description}>{circle.description}</Text>
        </View>

        <FlatList
            data={members}
            keyExtractor={(item) => item.id}
            numColumns={4}
            contentContainerStyle={styles.membersGrid}
            ListHeaderComponent={
                <Text style={styles.membersTitle}>Membres ({members.length})</Text>
            }
            renderItem={({ item }) => (
                <View style={styles.memberContainer}>
                    <Image 
                        source={item.avatar_url ? { uri: item.avatar_url } : require('@/assets/images/kurius-avatar.png')}
                        style={styles.avatar} 
                    />
                    <Text style={styles.fullName} numberOfLines={1}>{item.full_name}</Text>
                </View>
            )}
        />
        <View style={styles.actionButtonContainer}>
            <CozyButton onPress={() => setInviteModalVisible(true)} icon={<UserPlus />} size="large">
                Inviter des amis
            </CozyButton>
        </View>
      </View>

      <FriendInviteModal 
        visible={isInviteModalVisible}
        onClose={() => setInviteModalVisible(false)}
        onInvite={handleInviteFriends}
        currentMembers={members}
      />
    </BackgroundWrapper>
  );
}

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
    },
    header: {
        alignItems: 'center',
        marginBottom: 20,
        paddingHorizontal: 20,
    },
    title: { 
        ...theme.fonts.title,
        fontSize: 28, 
        color: theme.colors.textDark,
        textAlign: 'center'
    },
    description: {
        ...theme.fonts.body,
        fontSize: 16,
        color: theme.colors.textLight,
        textAlign: 'center',
        marginTop: 4,
    },
    membersTitle: {
      ...theme.fonts.subtitle,
      fontSize: 20,
      color: theme.colors.textDark,
      paddingHorizontal: 20,
      marginBottom: 16,
    },
    membersGrid: {
        paddingBottom: 20,
    },
    memberContainer: {
        flex: 1 / 4,
        alignItems: 'center',
        marginBottom: 20,
        paddingHorizontal: 5,
    },
    avatar: { 
        width: 60, 
        height: 60, 
        borderRadius: 30, 
        backgroundColor: theme.colors.disabledBackground,
        marginBottom: 8,
    },
    fullName: { 
        ...theme.fonts.caption,
        fontSize: 12,
        textAlign: 'center',
    },
    actionButtonContainer: { 
        padding: 20, 
        borderTopWidth: 1, 
        borderTopColor: 'rgba(0,0,0,0.1)', 
        backgroundColor: 'rgba(255, 248, 231, 0.9)' 
    },
});