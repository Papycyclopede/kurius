// contexts/AuthContext.tsx
import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { Session, User, VerifyOtpParams } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { FavoriteFilm, FavoriteBook, FavoriteTvShow } from '@/types';
import React from 'react';
import { getPremiumStatus, setPremiumStatus } from '@/services/subscriptionService';
import i18n from '@/lib/i18n';

// Le type Profile inclut maintenant la langue
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
  togglePremiumStatus: () => void;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: any }>;
  verifyOtp: (params: VerifyOtpParams) => Promise<{ error: any }>;
  updateLanguage: (lang: 'fr' | 'en') => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const isMounted = useRef(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      
      if (data && isMounted.current) {
        setProfile(data);
        // On applique la langue sauvegardée à toute l'application au chargement
        if (data.language && i18n.language !== data.language) {
          i18n.changeLanguage(data.language);
        }
      }
    } catch (error) {
      setProfile(null);
      console.error("Erreur fetchProfile:", error);
    }
  };

  useEffect(() => {
    isMounted.current = true;
    
    const fetchSessionAndProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (isMounted.current) {
        setSession(session);
        setUser(session?.user ?? null);
        const premiumStatus = await getPremiumStatus();
        setIsPremium(premiumStatus);
        if (session?.user) {
          await fetchProfile(session.user.id);
        }
        setLoading(false);
      }
    };
    fetchSessionAndProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (isMounted.current) {
          setSession(session);
          setUser(session?.user ?? null);
          if (session?.user) {
            await fetchProfile(session.user.id);
          } else {
            setProfile(null);
            setLoading(false);
          }
        }
      }
    );
    return () => {
      isMounted.current = false;
      subscription.unsubscribe();
    };
  }, []);

  const updateLanguage = async (lang: 'fr' | 'en') => {
    if (!user) return;
    
    i18n.changeLanguage(lang);
    setProfile(currentProfile => currentProfile ? { ...currentProfile, language: lang } : null);

    const { error } = await supabase
      .from('profiles')
      .update({ language: lang })
      .eq('id', user.id);
      
    if (error) {
      console.error("Erreur sauvegarde de la langue:", error.message);
    }
  };
  
  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  const togglePremiumStatus = async () => {
    const newStatus = !isPremium;
    setIsPremium(newStatus);
    await setPremiumStatus(newStatus);
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
        email, password, options: { data: { full_name: fullName } },
    });
    return { data, error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) { return { error: { message: 'Utilisateur non connecté' } }; }
    const { error } = await supabase.from('profiles').update(updates).eq('id', user.id);
    if (!error) {
      setProfile(currentProfile => currentProfile ? { ...currentProfile, ...updates } : null);
    }
    return { error };
  };
  
  const verifyOtp = async (params: VerifyOtpParams) => {
    const { data, error } = await supabase.auth.verifyOtp(params);
    return { data, error };
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