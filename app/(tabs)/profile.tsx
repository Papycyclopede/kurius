// app/(tabs)/profile.tsx
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Switch, Image } from 'react-native'; // Ajout de 'Image'
import { LogOut, UserPlus, Mail, Star, Users as UsersIcon, Circle as CircleIcon } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import CozyButton from '@/components/CozyButton';
import LanguageSelector from '@/components/LanguageSelector';
import CozyCard from '@/components/CozyCard';
import { useTranslation } from 'react-i18next';
import BackgroundWrapper from '@/components/BackgroundWrapper';
import React from 'react';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '@/constants/Theme';

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { user, signOut, loading: authLoading, isPremium, togglePremiumStatus } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const handleSignOut = async () => { await signOut(); router.replace('/'); };

  const HEADER_HEIGHT_APPROX = 60; 
  const paddingTopForContent = insets.top + HEADER_HEIGHT_APPROX;

  if (authLoading) {
    return (
      <BackgroundWrapper backgroundImage={require('@/assets/images/profil.png')} noOverlay={true}>
        <View style={styles.loadingContainer}><ActivityIndicator size="large" color={theme.colors.primary} /></View>
      </BackgroundWrapper>
    );
  }

  if (!user) {
    return (
      <BackgroundWrapper backgroundImage={require('@/assets/images/profil.png')} noOverlay={true}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{t('auth.signIn.noAccount')}</Text>
          <CozyButton onPress={() => router.replace('/auth/sign-in')} style={{marginTop: 20}}>
            {t('auth.signIn.signInButton')}
          </CozyButton>
        </View>
      </BackgroundWrapper>
    );
  }

  return (
    <BackgroundWrapper backgroundImage={require('@/assets/images/profil.png')} noOverlay={true}>
      <ScrollView 
        style={[styles.container, { paddingTop: paddingTopForContent }]} 
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <View style={styles.content}>

          <CozyCard style={[styles.welcomeCard, styles.cardColor1]}>
            <Text style={styles.welcomeText}>{t('home.welcome', { name: user.email || 'Ami Kurius' })}</Text>
            <Text style={styles.welcomeSubtitle}>{t('profile.account_settings')}</Text>
          </CozyCard>

          <CozyCard style={isPremium ? styles.premiumCardActive : styles.premiumCardInactive}>
            <View style={styles.premiumHeader}>
              <Star size={20} color={isPremium ? '#FFD700' : theme.colors.textLight} />
              <Text style={styles.sectionTitle}>{t('profile.premiumTitle')}</Text>
            </View>
            <Text style={styles.premiumDescription}>
              {t('profile.premiumDescription')}
            </Text>
            <Switch
              trackColor={{ false: '#767577', true: theme.colors.primary }}
              thumbColor={isPremium ? theme.colors.background : '#f4f3f4'}
              ios_backgroundColor="#3e3e3e"
              onValueChange={togglePremiumStatus}
              value={isPremium}
              style={styles.premiumSwitch}
            />
          </CozyCard>

          <CozyCard style={styles.cardColor2}>
            <Text style={styles.sectionTitle}>{t('profile.friendsCircleTitle')}</Text>
            <View style={styles.friendsActions}>
                <CozyButton 
                  style={[styles.friendButton, { backgroundColor: theme.colors.cardPastels[0] }]} 
                  onPress={() => router.push('/circles')} 
                  icon={<CircleIcon size={16} />} 
                  variant="secondary"
                >
                    {t('profile.manageCircles')}
                </CozyButton>
                <CozyButton 
                  style={[styles.friendButton, { backgroundColor: theme.colors.cardPastels[1] }]} 
                  onPress={() => router.push('/friends/list')} 
                  icon={<UsersIcon size={16} />} 
                  variant="secondary"
                >
                    {t('profile.myFriends')}
                </CozyButton>
                <CozyButton 
                  style={[styles.friendButton, { backgroundColor: theme.colors.cardPastels[2] }]} 
                  onPress={() => router.push('/friends/search')} 
                  icon={<UserPlus size={16} />} 
                  variant="secondary"
                >
                    {t('profile.findFriends')}
                </CozyButton>
                <CozyButton 
                  style={[styles.friendButton, { backgroundColor: theme.colors.cardPastels[3] }]} 
                  onPress={() => router.push('/friends/requests')} 
                  icon={<Mail size={16} />} 
                  variant="secondary"
                >
                    {t('profile.pendingRequests')}
                </CozyButton>
            </View>
          </CozyCard>

          <CozyCard>
            <LanguageSelector />
          </CozyCard>

          {/* ### MODIFICATION : Ajout de la section "Powered by Qloo" ### */}
          <CozyCard style={styles.qlooCard}>
            <Text style={styles.qlooText}>Powered by</Text>
            <Image source={require('@/assets/images/qloo.png')} style={styles.qlooLogo} />
          </CozyCard>

          <View style={styles.signOutContainer}>
            <CozyButton onPress={handleSignOut} icon={<LogOut size={16} />} variant="ghost" style={{borderColor: theme.colors.error}}>{t('profile.signOut')}</CozyButton>
          </View>
        </View>
      </ScrollView>
    </BackgroundWrapper>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1 
  },
  content: { 
    paddingHorizontal: 20 
  },
  welcomeCard: {
    marginBottom: 20,
    alignItems: 'center',
    paddingVertical: 30,
  },
  welcomeText: {
    ...theme.fonts.title,
    fontSize: 22,
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    ...theme.fonts.body,
    fontSize: 16,
    textAlign: 'center',
  },
  sectionTitle: { 
    ...theme.fonts.subtitle,
    fontSize: 20, 
    marginBottom: 0,
  },
  signOutContainer: { 
    marginTop: 20, 
    alignItems: 'center' 
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  loadingText: { 
    ...theme.fonts.subtitle,
    fontSize: 18, 
    marginTop: 10, 
    textAlign: 'center' 
  },
  friendsActions: { 
    flexDirection: 'row', 
    gap: 12, 
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: 16,
  },
  friendButton: {
    width: '45%',
    minHeight: 50,
    justifyContent: 'center',
  },
  cardColor1: {
    backgroundColor: 'rgba(255, 240, 220, 0.9)',
    borderColor: 'rgba(240, 210, 190, 0.5)',
  },
  cardColor2: {
    backgroundColor: 'rgba(230, 255, 240, 0.9)',
    borderColor: 'rgba(200, 230, 210, 0.5)',
  },
  premiumCardInactive: {
    backgroundColor: 'rgba(230, 230, 230, 0.9)',
    borderColor: 'rgba(200, 200, 200, 0.5)',
  },
  premiumCardActive: {
    backgroundColor: 'rgba(255, 249, 219, 0.95)',
    borderColor: '#FFD700',
  },
  premiumHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  premiumDescription: {
    ...theme.fonts.body,
    fontSize: 14,
    color: theme.colors.textMedium,
    marginBottom: 16,
  },
  premiumSwitch: {
    alignSelf: 'flex-start'
  },
  // ### MODIFICATION : Ajout des styles pour la carte Qloo ###
  qlooCard: {
    backgroundColor: '#1A1A1A', // Un noir un peu plus doux que #000
    alignItems: 'center',
    paddingVertical: 20,
    marginTop: 20,
  },
  qlooText: {
    ...theme.fonts.caption,
    color: '#A0A0A0', // Un gris clair pour une bonne lisibilité
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  qlooLogo: {
    width: 100,
    height: 40,
    resizeMode: 'contain',
    marginTop: 8,
  },
});