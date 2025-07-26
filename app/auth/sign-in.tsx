// app/auth/sign-in.tsx
import { View, Text, StyleSheet, TextInput, Alert, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { useState } from 'react';
import { Link, useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext'; // Importez useAuth
import BackgroundWrapper from '@/components/BackgroundWrapper';
import CozyCard from '@/components/CozyCard';
import CozyButton from '@/components/CozyButton';
import { LogIn, Mail, Lock, TestTube } from 'lucide-react-native';

export default function SignInScreen() {
  const router = useRouter();
  const { signIn, togglePremiumStatus, isPremium } = useAuth(); // Ajoutez togglePremiumStatus et isPremium
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Oups !', 'Veuillez remplir tous les champs 💝');
      return;
    }
    setLoading(true);
    const { error } = await signIn(email.trim(), password);
    if (error) {
      Alert.alert('Connexion impossible', 'Vérifiez vos identifiants et réessayez 🤗');
    } else {
      router.replace('/');
    }
    setLoading(false);
  };

  const handleDemoAccess = async () => { // Rendez la fonction async
    // Activez ou désactivez le mode premium.
    // L'état est stocké via AsyncStorage dans AuthContext.
    await togglePremiumStatus(); 
    router.replace('/');
  };

  return (
    <BackgroundWrapper backgroundImage={require('@/assets/images/accueil.png')} noOverlay={true}>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            {/* ### MODIFICATION : Remplacement de l'avatar par le logo ### */}
            <Image 
              source={require('@/assets/images/kurius-logo.png')} 
              style={styles.logo}
            />
            <Text style={styles.title}>Bon retour ! 🤗</Text>
            <Text style={styles.subtitle}>Reconnectez-vous à votre cocon culturel</Text>
          </View>

          <CozyCard style={styles.formCard}>
            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <Mail size={20} color="#8B6F47" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Votre email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholderTextColor="rgba(139, 111, 71, 0.6)"
                />
              </View>

              <View style={styles.inputWrapper}>
                <Lock size={20} color="#8B6F47" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Votre mot de passe"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  placeholderTextColor="rgba(139, 111, 71, 0.6)"
                />
              </View>
            </View>

            <CozyButton
              onPress={handleSignIn}
              disabled={loading}
              icon={<LogIn size={16} color="#FFF8E7" />}
              size="large"
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </CozyButton>
          </CozyCard>
          
          <CozyCard transparent style={styles.linkCard}>
            <Text style={styles.linkText}>
              Pas encore de compte ?{' '}
              <Link href="/auth/sign-up" style={styles.link}>
                Créer un compte
              </Link>
            </Text>
          </CozyCard>

          <View style={styles.demoContainer}>
            <CozyButton
              onPress={handleDemoAccess}
              variant="secondary"
              icon={<TestTube size={16} color="#8B6F47" />}
            >
              Accès Jury (Mode Démo)
            </CozyButton>
          </View>

        </View>
      </KeyboardAvoidingView>
    </BackgroundWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  // ### MODIFICATION : Ajout du style pour le logo ###
  logo: {
    width: 200,
    height: 200,
    resizeMode: 'contain',
    marginBottom: 0,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Comfortaa-SemiBold',
    color: 'white',
    marginTop: 10,
    marginBottom: 8,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: {width: 0, height: 2},
    textShadowRadius: 8
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    color: 'white',
    textAlign: 'center',
    lineHeight: 22,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 6
  },
  formCard: {
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 15,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'rgba(212, 165, 116, 0.3)',
  },
  inputIcon: {
    marginLeft: 16,
    marginRight: 12,
  },
  input: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    color: '#5D4E37',
  },
  linkCard: {
    alignItems: 'center',
    padding: 16,
    marginBottom: 10,
  },
  linkText: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: 'white',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 6
  },
  link: {
    color: 'white',
    fontFamily: 'Nunito-SemiBold',
    textDecorationLine: 'underline',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 6
  },
  demoContainer: {
    paddingHorizontal: 20,
    marginTop: 10,
  }
});
