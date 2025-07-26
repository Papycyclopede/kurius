// app/friends/list.tsx
import { View, Text, FlatList, StyleSheet, Image, ActivityIndicator } from 'react-native';
import React, { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import BackgroundWrapper from '@/components/BackgroundWrapper';
import CozyCard from '@/components/CozyCard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { theme } from '@/constants/Theme';
import { Users } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

interface Friend {
  id: string;
  full_name: string;
  avatar_url: string | null;
}

export default function FriendListScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFriends = async () => {
    if (!user) return;
    setLoading(true);

    const { data, error } = await supabase.rpc('get_friends', { p_user_id: user.id });

    if (error) {
      console.error("Supabase error fetching friends:", error);
    } else {
      setFriends(data || []);
    }
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      fetchFriends();
    }, [user])
  );

  return (
    <BackgroundWrapper>
      <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
        <View style={styles.header}>
            <Users size={32} color={theme.colors.textDark} />
            <Text style={styles.title}>{t('friends.list.title')}</Text>
        </View>
        
        {loading ? (
            <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
        ) : (
            <FlatList
                data={friends}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ paddingTop: 20 }}
                renderItem={({ item }) => (
                    <CozyCard style={styles.friendCard}>
                        <Image 
                            source={item.avatar_url ? { uri: item.avatar_url } : require('@/assets/images/kurius-avatar.png')}
                            style={styles.avatar} 
                        />
                        <Text style={styles.fullName}>{item.full_name}</Text>
                    </CozyCard>
                )}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>Votre liste d'amis est vide.</Text>
                        <Text style={styles.emptySubtext}>Utilisez la recherche pour trouver et ajouter des amis !</Text>
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
    header: {
        alignItems: 'center',
        marginBottom: 10,
    },
    title: { 
        ...theme.fonts.title,
        fontSize: 28, 
        color: theme.colors.textDark,
        textAlign: 'center',
        marginTop: 8,
    },
    friendCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        marginBottom: 12,
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
    emptyContainer: {
        marginTop: 40,
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    emptyText: { 
        ...theme.fonts.subtitle,
        fontSize: 18,
        textAlign: 'center', 
        color: theme.colors.textMedium,
        marginBottom: 8,
    },
    emptySubtext: {
        ...theme.fonts.body,
        textAlign: 'center', 
        color: theme.colors.textLight,
    }
});
