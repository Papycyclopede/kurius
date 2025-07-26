// app/circles/index.tsx
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import React, { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import BackgroundWrapper from '@/components/BackgroundWrapper';
import CozyCard from '@/components/CozyCard';
import CozyButton from '@/components/CozyButton';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { theme } from '@/constants/Theme';
import { Users, Plus } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { getDemoCircles } from '@/services/demoDataService'; // L'import fonctionnera maintenant

interface Circle {
  id: string;
  name: string;
  description: string;
}

export default function CirclesListScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, isPremium, session } = useAuth();
  const { t } = useTranslation();
  const [circles, setCircles] = useState<Circle[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCircles = async () => {
    setLoading(true);
    if (isPremium && !session) {
      setCircles(getDemoCircles());
      setLoading(false);
      return;
    }

    if (!user) {
      setLoading(false);
      return;
    }
    
    const { data, error } = await supabase.rpc('get_user_circles');
    if (error) {
      console.error("Supabase error fetching circles:", error);
    } else {
      setCircles(data || []);
    }
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      fetchCircles();
    }, [user, isPremium, session])
  );

  return (
    <BackgroundWrapper>
      <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
        <View style={styles.header}>
          <Users size={32} color={theme.colors.textDark} />
          <Text style={styles.title}>{t('circles.list.title')}</Text>
        </View>
        
        {loading ? (
            <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
        ) : (
            <FlatList
                data={circles}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ paddingTop: 20 }}
                renderItem={({ item }) => (
                    <TouchableOpacity onPress={() => router.push({
                      pathname: '/circles/[id]',
                      params: { id: item.id }
                    })}>
                        <CozyCard style={styles.circleCard}>
                            <Text style={styles.circleName}>{item.name}</Text>
                            <Text style={styles.circleDescription}>{item.description}</Text>
                        </CozyCard>
                    </TouchableOpacity>
                )}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>{t('circles.list.emptyTitle')}</Text>
                        <CozyButton style={{marginTop: 16}} onPress={() => router.push('/circles/create')}>
                            {t('circles.list.emptyButton')}
                        </CozyButton>
                    </View>
                }
            />
        )}
        {!loading && (isPremium || circles.length > 0) && (
            <View style={styles.addButtonContainer}>
                <CozyButton onPress={() => router.push('/circles/create')} icon={<Plus />} size="large">
                    {t('circles.list.addCircleButton')}
                </CozyButton>
            </View>
        )}
      </View>
    </BackgroundWrapper>
  );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { alignItems: 'center', paddingHorizontal: 20, marginBottom: 10, },
    title: { ...theme.fonts.title, fontSize: 28, color: theme.colors.textDark, textAlign: 'center', marginTop: 8 },
    circleCard: { marginHorizontal: 20, marginBottom: 12, },
    circleName: { ...theme.fonts.subtitle, fontSize: 18, marginBottom: 4 },
    circleDescription: { ...theme.fonts.body, color: theme.colors.textLight },
    emptyContainer: { marginTop: 60, alignItems: 'center', paddingHorizontal: 20 },
    emptyText: { ...theme.fonts.subtitle, fontSize: 18, textAlign: 'center', color: theme.colors.textMedium },
    addButtonContainer: { padding: 20, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.1)', backgroundColor: 'rgba(255, 248, 231, 0.9)' },
});
