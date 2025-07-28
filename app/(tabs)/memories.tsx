// app/(tabs)/memories.tsx
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useState, useCallback } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import { getHistory, clearHistory } from '@/services/historyService';
import { HistoryEvent } from '@/types';
import BackgroundWrapper from '@/components/BackgroundWrapper';
import CozyCard from '@/components/CozyCard';
import { Film, Book, Tv, Calendar, Users, Trash2 } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '@/constants/Theme';
import Animated, { FadeInDown } from 'react-native-reanimated';

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric'
  });
};

const CategoryIcon = ({ category }: { category: HistoryEvent['category'] }) => {
    if (category === 'film') return <Film size={14} color={theme.colors.textLight} />;
    if (category === 'book') return <Book size={14} color={theme.colors.textLight} />;
    if (category === 'tvShow') return <Tv size={14} color={theme.colors.textLight} />;
    return null;
};

export default function MemoriesScreen() {
  const { t } = useTranslation();
  const [history, setHistory] = useState<HistoryEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const insets = useSafeAreaInsets();
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      const loadHistory = async () => {
        setIsLoading(true);
        const savedHistory = await getHistory();
        setHistory(savedHistory);
        setIsLoading(false);
      };
      loadHistory();
    }, [])
  );

  const handleClearHistory = () => {
    Alert.alert(
      t('memories.reset.confirmTitle'),
      t('memories.reset.confirmMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('memories.reset.confirmButton'),
          style: 'destructive',
          onPress: async () => {
            await clearHistory();
            setHistory([]);
          },
        },
      ]
    );
  };

  const handleMemoryPress = (event: HistoryEvent) => {
    router.push({ 
      pathname: '/result-screen', 
      params: { winner: JSON.stringify(event.chosenItem) } 
    });
  };

  return (
    <BackgroundWrapper backgroundImage={require('@/assets/images/groupe.png')} noOverlay={true}>
      <ScrollView 
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 20, paddingBottom: 120 }]}
      >
        <View style={styles.header}>
            <Text style={styles.title}>{t('memories.title')}</Text>
            {history.length > 0 && (
              <TouchableOpacity onPress={handleClearHistory} style={styles.resetButton}>
                <Trash2 size={20} color={theme.colors.error} />
              </TouchableOpacity>
            )}
        </View>
        <Text style={styles.subtitle}>{t('memories.subtitle')}</Text>

        {isLoading ? (
            <ActivityIndicator size="large" color={theme.colors.white} style={{ marginTop: 60 }} />
        ) : history.length === 0 ? (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>{t('memories.empty.title')}</Text>
                <Text style={styles.emptySubtext}>{t('memories.empty.subtitle')}</Text>
            </View>
        ) : (
            <View style={styles.listContainer}>
              {history.map((event, index) => (
                  <Animated.View 
                    key={event.id}
                    entering={FadeInDown.delay(index * 100).duration(400).springify().damping(12)}
                  >
                    <TouchableOpacity onPress={() => handleMemoryPress(event)} activeOpacity={0.8}>
                      <CozyCard style={styles.memoryCard}>
                          <View style={styles.cardContent}>
                              {event.chosenItem.posterUrl && 
                                  <Image source={{ uri: event.chosenItem.posterUrl }} style={styles.itemImage} />
                              }
                              <View style={styles.infoContainer}>
                                  <View style={styles.cardHeader}>
                                      <CategoryIcon category={event.category} />
                                  </View>
                                  <Text style={styles.itemTitle} numberOfLines={2}>{event.chosenItem.title}</Text>
                                  
                                  <View style={styles.metaRow}>
                                      <Calendar size={14} color={theme.colors.textLight} />
                                      <Text style={styles.metaText}>{formatDate(event.date)}</Text>
                                  </View>
                                  <View style={styles.metaRow}>
                                      <Users size={14} color={theme.colors.textLight} />
                                      <Text style={styles.metaText} numberOfLines={1}>{event.participants.join(', ')}</Text>
                                  </View>
                              </View>
                          </View>
                      </CozyCard>
                    </TouchableOpacity>
                  </Animated.View>
              ))}
            </View>
        )}
      </ScrollView>
    </BackgroundWrapper>
  );
}

const styles = StyleSheet.create({
    container: { flex: 1, paddingHorizontal: 20 },
    header: { alignItems: 'center', justifyContent: 'center', flexDirection: 'row', position: 'relative', marginBottom: 8 },
    title: { fontSize: 28, fontFamily: 'Comfortaa-SemiBold', color: theme.colors.white, textAlign: 'center', textShadowColor: 'rgba(0, 0, 0, 0.75)', textShadowOffset: {width: 0, height: 2}, textShadowRadius: 8 },
    subtitle: { fontSize: 16, fontFamily: 'Nunito-Regular', color: theme.colors.white, textAlign: 'center', paddingHorizontal: 20, marginBottom: 20, textShadowColor: 'rgba(0, 0, 0, 0.75)', textShadowOffset: {width: 0, height: 1}, textShadowRadius: 6 },
    resetButton: { position: 'absolute', right: 0, top: 0, bottom: 0, padding: 8, justifyContent: 'center', alignItems: 'center', },
    emptyContainer: { marginTop: 50, alignItems: 'center', padding: 20 },
    emptyText: { fontSize: 18, fontFamily: 'Nunito-SemiBold', color: theme.colors.white, textShadowColor: 'rgba(0, 0, 0, 0.75)', textShadowOffset: {width: 0, height: 1}, textShadowRadius: 6 },
    emptySubtext: { fontSize: 14, fontFamily: 'Nunito-Regular', color: theme.colors.white, textAlign: 'center', marginTop: 8, textShadowColor: 'rgba(0, 0, 0, 0.75)', textShadowOffset: {width: 0, height: 1}, textShadowRadius: 6 },
    listContainer: { paddingHorizontal: 0 }, // Pas besoin de padding ici si le container principal en a déjà
    memoryCard: { marginBottom: 16 },
    cardContent: { flexDirection: 'row', gap: 15, alignItems: 'center' },
    itemImage: { width: 80, height: 120, borderRadius: 8, backgroundColor: theme.colors.disabledBackground },
    infoContainer: { flex: 1 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 14, marginBottom: 8 },
    itemTitle: { ...theme.fonts.subtitle, fontSize: 18, marginBottom: 12 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
    metaText: { ...theme.fonts.caption, fontSize: 12, flexShrink: 1 },
});