// app/friends/search.tsx
import { View, Text, TextInput, FlatList, StyleSheet, Image, ActivityIndicator } from 'react-native';
import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import CozyButton from '@/components/CozyButton';
import { UserPlus, Search } from 'lucide-react-native';
import BackgroundWrapper from '@/components/BackgroundWrapper';
import CozyCard from '@/components/CozyCard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { notificationService } from '@/services/notificationService';
import { theme } from '@/constants/Theme';
import { useTranslation } from 'react-i18next';

interface FoundUser {
  id: string;
  full_name: string;
  avatar_url: string | null;
}

export default function SearchFriendsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FoundUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!user) return;
    if (query.trim().length < 3) {
      notificationService.showError("Recherche trop courte", "Veuillez entrer au moins 3 caractères.");
      return;
    }
    setLoading(true);
    setHasSearched(true);
    
    const { data, error } = await supabase.rpc('search_users', { 
      search_term: query.trim().toLowerCase(),
      current_user_id: user.id 
    });

    setLoading(false);

    if (error) {
      notificationService.showError(t('common.error'), "La recherche d'utilisateurs a échoué.");
      console.error(error);
    } else {
      setResults(data || []);
    }
  };

  const handleAddFriend = async (receiverId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('friendships')
      .insert({ 
        requester_id: user.id, 
        receiver_id: receiverId,
        status: 'pending' 
      });

    if (error) {
      if (error.code === '23505') {
        notificationService.showInfo("Déjà fait !", "Une demande d'ami est déjà en cours ou vous êtes déjà amis.");
      } else {
        notificationService.showError(t('common.error'), t('friends.requests.errorSend'));
        console.error(error);
      }
    } else {
      notificationService.showSuccess(t('common.success'), "Demande d'ami envoyée !");
      setResults(currentResults => currentResults.filter(r => r.id !== receiverId));
    }
  };

  return (
    <BackgroundWrapper>
      <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
        <View style={styles.header}>
            <Text style={styles.title}>{t('friends.search.title')}</Text>
            <Text style={styles.subtitle}>{t('friends.search.subtitle')}</Text>
        </View>
        
        <CozyCard>
            <View style={styles.inputContainer}>
                <Search size={20} color={theme.colors.textLight} style={styles.inputIcon} />
                <TextInput
                    style={styles.input}
                    placeholder={t('friends.search.placeholder')}
                    value={query}
                    onChangeText={setQuery}
                    onSubmitEditing={handleSearch}
                    autoCapitalize="none"
                    placeholderTextColor={theme.colors.textLight}
                />
            </View>
            <CozyButton onPress={handleSearch} disabled={loading}>
                {loading ? t('friends.search.buttonLoading') : t('friends.search.button')}
            </CozyButton>
        </CozyCard>

        {loading ? (
            <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
        ) : (
            <FlatList
                data={results}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ paddingTop: 20 }}
                renderItem={({ item }) => (
                <CozyCard style={styles.resultItemCard}>
                    <View style={styles.resultItem}>
                        <Image 
                            source={item.avatar_url ? { uri: item.avatar_url } : require('@/assets/images/kurius-avatar.png')} 
                            style={styles.avatar} 
                        />
                        <View>
                            <Text style={styles.fullName}>{item.full_name}</Text>
                        </View>
                        <View style={{ flex: 1 }} />
                        <CozyButton size="small" onPress={() => handleAddFriend(item.id)} icon={<UserPlus size={14} />} variant="secondary" />
                    </View>
                </CozyCard>
                )}
                ListEmptyComponent={
                    hasSearched && results.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>{t('friends.search.noResults', { query })}</Text>
                        </View>
                    ) : null
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
        marginBottom: 20,
    },
    title: { 
        ...theme.fonts.title,
        fontSize: 28, 
        color: theme.colors.textDark,
        textAlign: 'center'
    },
    subtitle: {
        ...theme.fonts.body,
        fontSize: 16,
        color: theme.colors.textLight,
        textAlign: 'center',
        marginTop: 4,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        borderRadius: theme.sizing.borderRadiusInput,
        borderWidth: 1,
        borderColor: theme.colors.borderColor,
        marginBottom: 16,
    },
    inputIcon: {
        marginLeft: 16,
    },
    input: { 
        flex: 1,
        padding: 16, 
        fontSize: 16,
        fontFamily: 'Nunito-Regular',
        color: theme.colors.textDark
    },
    resultItemCard: {
        marginBottom: 12,
    },
    resultItem: { 
        flexDirection: 'row', 
        alignItems: 'center',
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
    },
    emptyText: { 
        ...theme.fonts.body,
        textAlign: 'center', 
        color: theme.colors.textLight,
        fontStyle: 'italic'
    }
});
