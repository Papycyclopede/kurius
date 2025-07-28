// app/(tabs)/manage-profiles.tsx
import {
	View, Text, StyleSheet, FlatList, TouchableOpacity,
	Alert, Image, ScrollView, Keyboard
  } from 'react-native';
  import { useState, useCallback } from 'react';
  import { useRouter, useFocusEffect } from 'expo-router';
  import { Plus, Trash2, User, Film, Book, Tv } from 'lucide-react-native';
  import { getLocalProfiles, saveLocalProfiles, LocalProfile } from '@/services/localProfileService';
  import { theme } from '@/constants/Theme';
  import BackgroundWrapper from '@/components/BackgroundWrapper';
  import CozyCard from '@/components/CozyCard';
  import CozyButton from '@/components/CozyButton';
  import React from 'react';
  import { useTranslation } from 'react-i18next';
  import { useSafeAreaInsets } from 'react-native-safe-area-context';
  import Animated, { FadeInDown } from 'react-native-reanimated';

  export default function ManageProfilesScreen() {
	const { t } = useTranslation();
	const insets = useSafeAreaInsets();
	const router = useRouter();

	const [profiles, setProfiles] = useState<LocalProfile[]>([]);

	useFocusEffect(
	  useCallback(() => {
		const loadProfiles = async () => {
		  const loadedProfiles = await getLocalProfiles();
		  setProfiles(loadedProfiles);
		};

		loadProfiles();
	  }, [])
	);

	const handleEdit = (profile: LocalProfile) => {
	  router.push({ pathname: '/edit-profile', params: { profileId: profile.id } });
	};

	const handleAddNew = () => {
      Keyboard.dismiss(); 
	  router.push('/onboarding/taste-wizard');
	};

	const handleDelete = (profileId: string) => {
	  Alert.alert(
		t('manageProfiles.deleteConfirm.title'),
		t('manageProfiles.deleteConfirm.message'),
		[
		  { text: t('common.cancel'), style: "cancel" },
		  {
			text: t('common.delete'),
			style: "destructive",
			onPress: async () => {
			  const updatedProfiles = profiles.filter(p => p.id !== profileId);
			  await saveLocalProfiles(updatedProfiles);
			  setProfiles(updatedProfiles);
			}
		  }
		]
	  );
	};

	const renderProfile = ({ item, index }: { item: LocalProfile, index: number }) => {
	  const cardColor = theme.colors.cardPastels[index % theme.colors.cardPastels.length];

	  return (
		<Animated.View
		  entering={FadeInDown.delay(index * 100).duration(400).springify().damping(12)}
		>
		  <TouchableOpacity onPress={() => handleEdit(item)} activeOpacity={0.8}>
			<CozyCard style={[styles.profileCard, { backgroundColor: cardColor }]} padding={15}>
			  <View style={styles.profileHeader}>
				<Animated.View sharedTransitionTag={`profile-${item.id}-avatar`}>
				  {item.avatarUri ? (
					<Image source={{ uri: item.avatarUri }} style={styles.avatarImage} />
				  ) : (
					<View style={styles.avatarPlaceholder}>
					  <User color={theme.colors.textLight} size={24} />
					</View>
				  )}
				</Animated.View>

				<Animated.Text sharedTransitionTag={`profile-${item.id}-name`} style={styles.name}>
				  {item.name}
				</Animated.Text>

				<View style={{ flex: 1 }} />
				<TouchableOpacity onPress={(e) => { e.stopPropagation(); handleDelete(item.id); }} style={styles.actionButton}>
				  <Trash2 size={18} color={theme.colors.error} />
				</TouchableOpacity>
			  </View>

			  <View style={styles.tastesContainer}>
				<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tastesGrid}>
				  <View style={styles.tasteItem}><Film size={14} color={theme.colors.textLight} /><Text style={styles.tasteCount}>{item.films?.length || 0}</Text></View>
				  <View style={styles.tasteItem}><Book size={14} color={theme.colors.textLight} /><Text style={styles.tasteCount}>{item.books?.length || 0}</Text></View>
				  <View style={styles.tasteItem}><Tv size={14} color={theme.colors.textLight} /><Text style={styles.tasteCount}>{item.tvShows?.length || 0}</Text></View>
				</ScrollView>
			  </View>
			</CozyCard>
		  </TouchableOpacity>
		</Animated.View>
	  );
	};

	const BUTTON_AREA_HEIGHT = 120;

	return (
	  <BackgroundWrapper backgroundImage={require('@/assets/images/cosy.png')} noOverlay={true}>
		<View style={[styles.container, { paddingTop: insets.top }]}>
		  <FlatList
			data={profiles}
			renderItem={renderProfile}
			keyExtractor={(item) => item.id}
			style={styles.list}
			contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + BUTTON_AREA_HEIGHT + 20 }]}
			ListEmptyComponent={
			  <View style={styles.emptyContainer}>
				<Text style={styles.emptyText}>{t('manageProfiles.empty.title')}</Text>
				<Text style={styles.emptySubtext}>{t('manageProfiles.empty.subtitle')}</Text>
			  </View>
			}
			ListFooterComponent={
			  <View style={styles.listFooterButtonContainer}>
                {/* --- DÉBUT DE LA CORRECTION --- */}
				<CozyButton onPress={handleAddNew} icon={<Plus size={16} color={theme.colors.textOnPrimary_alt} />} size="large">
				  {t('manageProfiles.addProfileButton')}
				</CozyButton>
                {/* --- FIN DE LA CORRECTION (suppression de la faute de frappe "Co.zyButton") --- */}
			  </View>
			}
		  />
		</View>
	  </BackgroundWrapper>
	);
  }

  const styles = StyleSheet.create({
	container: { flex: 1 },
	list: { flex: 1 },
	listContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 20 },
	profileCard: { marginBottom: 16 },
	profileHeader: { flexDirection: 'row', alignItems: 'center' },
	avatarImage: { width: 50, height: 50, borderRadius: 25 },
	avatarPlaceholder: {
	  width: 50, height: 50, borderRadius: 25,
	  backgroundColor: 'rgba(212, 165, 116, 0.1)',
	  justifyContent: 'center', alignItems: 'center'
	},
	name: { ...theme.fonts.subtitle, fontSize: 18, color: theme.colors.textDark, marginLeft: 12 },
	actionButton: { padding: 8, marginLeft: 8 },
	tastesContainer: { borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)', paddingTop: 12, marginTop: 12 },
	tastesGrid: { flexDirection: 'row', gap: 20 },
	tasteItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
	tasteCount: { ...theme.fonts.body, color: theme.colors.textLight },
	emptyContainer: { marginTop: 80, alignItems: 'center', padding: 20 },
	emptyText: { ...theme.fonts.subtitle, fontSize: 18, color: theme.colors.textLight, marginBottom: 8 },
	emptySubtext: { ...theme.fonts.body, color: theme.colors.textLight, textAlign: 'center' },
	listFooterButtonContainer: {
	  paddingVertical: 20,
	  alignItems: 'center',
	  backgroundColor: 'transparent',
	},
  });