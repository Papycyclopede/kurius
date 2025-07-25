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

interface Circle {
  id: string;
  name: string;
  description: string;
}

export default function CirclesListScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const [circles, setCircles] = useState<Circle[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCircles = async () => {
    if (!user) return;
    setLoading(true);
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
    }, [user])
  );

  return (
    <BackgroundWrapper>
      <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
        <View style={styles.header}>
          <Users size={32} color={theme.colors.textDark} />
          <Text style={styles.title}>Mes Cercles</Text>
        </View>
        
        {loading ? (
            <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
        ) : (
            <FlatList
                data={circles}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ paddingTop: 20 }}
                renderItem={({ item }) => (
                    // CORRECTION : On utilise la syntaxe "objet" pour la navigation
                    <TouchableOpacity onPress={() => router.push({
                      pathname: '/circles/[id]', // On donne le nom du fichier de la route
                      params: { id: item.id }      // On passe les paramètres ici
                    })}>
                        <CozyCard style={styles.circleCard}>
                            <Text style={styles.circleName}>{item.name}</Text>
                            <Text style={styles.circleDescription}>{item.description}</Text>
                        </CozyCard>
                    </TouchableOpacity>
                )}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>Vous n'avez encore aucun cercle.</Text>
                        <CozyButton style={{marginTop: 16}} onPress={() => router.push('/circles/create')}>
                            Créer mon premier cercle
                        </CozyButton>
                    </View>
                }
            />
        )}
        {!loading && circles.length > 0 && (
            <View style={styles.addButtonContainer}>
                <CozyButton onPress={() => router.push('/circles/create')} icon={<Plus />} size="large">
                    Créer un cercle
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