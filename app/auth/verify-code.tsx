import { View, Text, StyleSheet, TextInput, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import BackgroundWrapper from '@/components/BackgroundWrapper';
import CozyCard from '@/components/CozyCard';
import CozyButton from '@/components/CozyButton';
import { KeyRound } from 'lucide-react-native';

// --- Code complet et corrigé pour l'écran de vérification de code ---

export default function VerifyCodeScreen() {
  const router = useRouter();
  const { verifyOtp } = useAuth();
  const { email } = useLocalSearchParams<{ email: string }>();

  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerifyCode = async () => {
    console.log(`[VerifyCodeScreen] Bouton pressé. Email: ${email}, Token: ${token}`); // <-- Log ajouté

    if (!email || !token.trim()) {
      Alert.alert('Oups !', 'Veuillez entrer le code à 6 chiffres reçu par email.');
      return;
    }

    setLoading(true);
    const { error } = await verifyOtp({
      email,
      token: token.trim(),
      type: 'signup',
    });

    if (error) {
      setLoading(false); // On s'assure de dégriser le bouton en cas d'erreur
      console.error('[VerifyCodeScreen] Erreur reçue depuis le contexte:', JSON.stringify(error, null, 2)); // <-- Log d'erreur détaillé
      Alert.alert('Code invalide', `Le code fourni est incorrect ou a expiré. (${error.message})`);
    } else {
      setLoading(false);
      Alert.alert(
        'Compte activé ! 🎉',
        'Votre compte est maintenant actif. Vous pouvez vous connecter.',
        [{
            text: 'Aller à la connexion',
            onPress: () => router.replace('/auth/sign-in')
        }]
      );
    }
  };

  return (
    <BackgroundWrapper>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <View style={styles.header}>
              <KeyRound size={48} color="#D4A574" />
              <Text style={styles.title}>Vérifiez vos emails</Text>
              <Text style={styles.subtitle}>
                Nous avons envoyé un code à 6 chiffres à <Text style={styles.emailText}>{email}</Text>.
              </Text>
            </View>

            <CozyCard>
              <TextInput
                style={styles.input}
                placeholder="000000"
                value={token}
                onChangeText={setToken}
                keyboardType="number-pad"
                maxLength={6}
                placeholderTextColor="rgba(139, 111, 71, 0.6)"
              />
              <CozyButton
                onPress={handleVerifyCode}
                disabled={loading}
                size="large"
              >
                {loading ? 'Vérification...' : 'Valider mon compte'}
              </CozyButton>
            </CozyCard>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </BackgroundWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Comfortaa-SemiBold',
    color: '#5D4E37',
    marginTop: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    color: '#8B6F47',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: '90%',
  },
  emailText: {
    fontFamily: 'Nunito-Bold',
    color: '#5D4E37',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 15,
    padding: 16,
    fontSize: 22,
    fontFamily: 'Nunito-Bold',
    color: '#5D4E37',
    borderWidth: 2,
    borderColor: 'rgba(212, 165, 116, 0.3)',
    marginBottom: 24,
    textAlign: 'center',
    letterSpacing: 8,
  },
});