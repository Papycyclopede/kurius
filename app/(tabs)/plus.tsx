// app/(tabs)/plus.tsx
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Star, Users, Archive } from 'lucide-react-native';
import BackgroundWrapper from '@/components/BackgroundWrapper';
import CozyCard from '@/components/CozyCard';
import CozyButton from '@/components/CozyButton';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '@/constants/Theme'; // Assurez-vous d'importer votre thème ici

const FeatureItem = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
  <View style={styles.featureItem}>
    <View style={styles.featureIcon}>{icon}</View>
    <View style={styles.featureTextContainer}>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureDescription}>{description}</Text>
    </View>
  </View>
);

export default function PlusScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <BackgroundWrapper backgroundImage={require('@/assets/images/groupe.png')} noOverlay={true}>
      <ScrollView contentContainerStyle={[styles.container, { paddingTop: insets.top + 20 }]}>
        <View style={styles.header}>
          <Star size={48} color="#FFD700" fill="#FFD700" />
          <Text style={styles.title}>{t('plus.title')}</Text>
          <Text style={styles.subtitle}>{t('plus.subtitle')}</Text>
        </View>

        <CozyCard style={styles.card}>
          <FeatureItem
            icon={<Users size={24} color="#D4A574" />}
            title={t('plus.feature1_title')}
            description={t('plus.feature1_description')}
          />
          <FeatureItem
            icon={<Archive size={24} color="#D4A574" />}
            title={t('plus.feature2_title')}
            description={t('plus.feature2_description')}
          />
           
        </CozyCard>

        <CozyCard style={styles.pricingCard}>
          <Text style={styles.price}>{t('plus.price')}</Text>
          <Text style={styles.billingInfo}>{t('plus.billing_info')}</Text>
          <CozyButton size="large" style={{ marginTop: 16 }} onPress={() => alert(t('plus.subscribe_button'))}>
            {t('plus.subscribe_button')}
          </CozyButton>
        </CozyCard>
        
        {/* Texte du disclaimer ajusté */}
        <Text style={styles.disclaimer}>
          {t('plus.disclaimer')}
        </Text>
      </ScrollView>
    </BackgroundWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  header: {
    alignItems: 'center',
    marginVertical: 30,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Comfortaa-Bold',
    color: '#FFFFFF', // Changé en blanc pour la visibilité
    marginTop: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.75)', // Ombre pour le contraste
    textShadowOffset: {width: 0, height: 2},
    textShadowRadius: 8
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    color: '#FFFFFF', // Changé en blanc pour la visibilité
    textAlign: 'center',
    marginTop: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.75)', // Ombre pour le contraste
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 6
  },
  card: {
    paddingVertical: 10,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
  },
  featureIcon: {
    marginRight: 16,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontFamily: 'Nunito-Bold',
    color: '#5D4E37', 
  },
  featureDescription: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: '#8B6F47', 
    marginTop: 4,
  },
  pricingCard: {
    alignItems: 'center',
  },
  price: {
    fontSize: 28,
    fontFamily: 'Comfortaa-SemiBold',
    color: '#5D4E37',
  },
  billingInfo: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: '#8B6F47',
    marginTop: 4,
  },
  disclaimer: {
    marginTop: 20,
    fontSize: 12,
    fontFamily: 'Nunito-Italic',
    color: '#FFFFFF', // Changé en blanc pour la visibilité
    textAlign: 'center',
    paddingHorizontal: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.75)', // Ombre pour le contraste
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 4 // Une ombre légèrement plus petite pour ce texte
  }
});