// contexts/AuthContext.tsx
import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { Session, User, VerifyOtpParams } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { FavoriteFilm, FavoriteBook, FavoriteTvShow } from '@/types';
import React from 'react';
import { getPremiumStatus, setPremiumStatus } from '@/services/subscriptionService';
// On importe juste i18n, plus besoin de la fonction d'initialisation
import i18n from '@/lib/i18n';

interface Profile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  favorite_films: FavoriteFilm[];
  favorite_books: FavoriteBook[];
  favorite_tv_shows: FavoriteTvShow[];
  language?: 'fr' | 'en';
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isPremium: boolean;
  togglePremiumStatus: () => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: any }>;
  verifyOtp: (params: VerifyOtpParams) => Promise<{ error: any }>;
  updateLanguage: (lang: 'fr' | 'en') => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const JURY_USER_ID = 'jury-user-007';
const juryUser: User = {
  id: JURY_USER_ID,
  app_metadata: { provider: 'email' },
  user_metadata: { full_name: 'Jury Member' },
  aud: 'authenticated',
  created_at: new Date().toISOString(),
};
const juryProfile: Profile = {
  id: JURY_USER_ID,
  email: 'jury@kurius.app',
  full_name: 'Jury Member',
  avatar_url: '',
  favorite_films: [],
  favorite_books: [],
  favorite_tv_shows: [],
  language: 'fr',
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    
    // ON RETIRE L'INITIALISATION D'ICI
    // initializeI18next('fr');

    const handleAuthStateChange = async (_event: string, session: Session | null) => {
      if (!isMounted.current) return;
      
      setLoading(true);
      const premiumStatus = await getPremiumStatus();
      setIsPremium(premiumStatus);
      
      const currentUser = session?.user ?? null;
      
      if (currentUser) {
        setSession(session);
        setUser(currentUser);
        const fetchedProfile = await fetchProfile(currentUser.id);
        // Cette logique de synchronisation reste correcte
        if (fetchedProfile?.language && i18n.language !== fetchedProfile.language) {
          await i18n.changeLanguage(fetchedProfile.language);
        }
      } else {
        setSession(null);
        if (premiumStatus) {
          setUser(juryUser);
          setProfile(juryProfile);
          if (i18n.language !== juryProfile.language) {
            await i18n.changeLanguage(juryProfile.language);
          }
        } else {
          setUser(null);
          setProfile(null);
        }
      }
      setLoading(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);

    supabase.auth.getSession().then(({ data: { session } }) => {
        handleAuthStateChange('INITIAL_SESSION', session);
    });

    return () => {
      isMounted.current = false;
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    if (userId === JURY_USER_ID) {
        setProfile(juryProfile);
        return juryProfile;
    }
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      if (data && isMounted.current) setProfile(data);
      return data || null;
    } catch (error) {
      if (isMounted.current) setProfile(null);
      console.error("Erreur fetchProfile:", error);
      return null;
    }
  };

  const updateLanguage = async (lang: 'fr' | 'en') => {
    await i18n.changeLanguage(lang);
    if (profile) {
      const newProfile = { ...profile, language: lang };
      setProfile(newProfile);
      if (user?.id === JURY_USER_ID) {
         juryProfile.language = lang;
      }
    }
    if (user && user.id !== JURY_USER_ID) {
      await supabase.from('profiles').update({ language: lang }).eq('id', user.id);
    }
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  const togglePremiumStatus = async () => {
    const newStatus = !isPremium;
    await setPremiumStatus(newStatus);
    setIsPremium(newStatus);

    if (newStatus && !session) {
      setUser(juryUser);
      setProfile(juryProfile);
    } else if (!newStatus && user?.id === JURY_USER_ID) {
      setUser(null);
      setProfile(null);
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    return await supabase.auth.signUp({
      email, password, options: { data: { full_name: fullName } },
    });
  };

  const signIn = async (email: string, password: string) => {
    const result = await supabase.auth.signInWithPassword({ email, password });
    if (!result.error && isPremium) {
        await setPremiumStatus(false);
        setIsPremium(false);
    }
    return result;
  };

  const signOut = async () => {
    if (user?.id === JURY_USER_ID) {
      await togglePremiumStatus();
    } else {
      await supabase.auth.signOut();
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: { message: 'Utilisateur non connecté' } };
    if (user.id === JURY_USER_ID) {
        setProfile(p => p ? {...p, ...updates} : null);
        return { error: null };
    }
    const { error } = await supabase.from('profiles').update(updates).eq('id', user.id);
    if (!error) await refreshProfile();
    return { error };
  };

  const verifyOtp = async (params: VerifyOtpParams) => {
    return await supabase.auth.verifyOtp(params);
  };

  const value = { session, user, profile, loading, isPremium, togglePremiumStatus, signUp, signIn, signOut, updateProfile, verifyOtp, updateLanguage, refreshProfile };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}