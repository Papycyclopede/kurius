// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Home, PlusCircle, BookHeart, User, Star, Users } from 'lucide-react-native'; // MODIFIÉ ICI
import { useTranslation } from 'react-i18next';
import { theme } from '@/constants/Theme';
import { BlurView } from 'expo-blur';
import React from 'react';

export default function TabLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          position: 'absolute',
          borderTopWidth: 0,
          backgroundColor: 'transparent',
          elevation: 0,
        },
        tabBarBackground: () => (
          <BlurView
            intensity={50}
            tint="light"
            style={StyleSheet.absoluteFill}
          />
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('navigation.home'),
          tabBarIcon: ({ focused }) => (
            <View style={[
              styles.iconWrapper,
              { backgroundColor: focused ? theme.colors.iconActiveHome : theme.colors.cardPastels[0] },
              focused && styles.activeTabBorder
            ]}>
              <Home
                color={focused ? theme.colors.textOnPrimary_alt : theme.colors.iconActiveHome}
                size={24}
              />
            </View>
          ),
        }}
      />

      {/* ===== L'ONGLET MANAGE-PROFILES EST MAINTENANT VISIBLE ICI ===== */}
      <Tabs.Screen
        name="manage-profiles"
        options={{
          title: 'Profils',
          tabBarIcon: ({ focused }) => (
            <View style={[
              styles.iconWrapper,
              // J'utilise une couleur existante pour rester cohérent
              { backgroundColor: focused ? theme.colors.primary : theme.colors.cardPastels[0] },
              focused && styles.activeTabBorder
            ]}>
              <Users
                color={focused ? theme.colors.textOnPrimary_alt : theme.colors.primary}
                size={24}
              />
            </View>
          ),
        }}
      />
      
      <Tabs.Screen
        name="create-event"
        options={{
          title: t('navigation.create'),
          tabBarIcon: ({ focused }) => (
            <View style={[
              styles.iconWrapper,
              { backgroundColor: focused ? theme.colors.iconActiveCreate : theme.colors.cardPastels[1] },
              focused && styles.activeTabBorder
            ]}>
              <PlusCircle
                color={focused ? theme.colors.textOnPrimary_alt : theme.colors.iconActiveCreate}
                size={24}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="memories"
        options={{
          title: t('navigation.memories'),
          tabBarIcon: ({ focused }) => (
             <View style={[
              styles.iconWrapper,
              { backgroundColor: focused ? theme.colors.iconActiveMemories : theme.colors.cardPastels[2] },
              focused && styles.activeTabBorder
            ]}>
              <BookHeart
                color={focused ? theme.colors.textOnPrimary_alt : theme.colors.iconActiveMemories}
                size={24}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="plus"
        options={{
          title: t('navigation.plus_tab_title'),
          tabBarIcon: ({ focused }) => (
            <View style={[
              styles.iconWrapper,
              { backgroundColor: focused ? theme.colors.iconActivePlus : theme.colors.cardPastels[3] },
              focused && styles.activeTabBorder
            ]}>
              <Star
                color={focused ? theme.colors.textOnPrimary_alt : theme.colors.iconActivePlus}
                size={24}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('navigation.profile'),
          tabBarIcon: ({ focused }) => (
            <View style={[
              styles.iconWrapper,
              { backgroundColor: focused ? theme.colors.iconActiveProfile : theme.colors.cardPastels[4] },
              focused && styles.activeTabBorder
            ]}>
              <User
                color={focused ? theme.colors.textOnPrimary_alt : theme.colors.iconActiveProfile}
                size={24}
              />
            </View>
          ),
        }}
      />
      {/* La ligne originale pour manage-profiles a été remplacée par le bloc ci-dessus */}
      {/* <Tabs.Screen name="manage-profiles" options={{ href: null }} /> */}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activeTabBorder: {
    borderColor: '#000000',
  },
});