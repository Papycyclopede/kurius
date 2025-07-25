import { View, Text, StyleSheet, TextInput, Alert, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import BackgroundWrapper from '@/components/BackgroundWrapper';
import CozyCard from '@/components/CozyCard';
import CozyButton from '@/components/CozyButton';
import KuriusAvatar from '@/components/KuriusAvatar';
import { UserPlus, Mail, Lock, User } from 'lucide-react-native';

// --- Début du code complet et corrigé ---

export default function SignUpScreen() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    console.log('[SignUpScreen] Le bouton "Créer mon compte" a été pressé.'); // <-- Log ajouté

    if (!fullName.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      Alert.alert('Oups !', 'Veuillez remplir tous les champs pour rejoindre la famille Kurius 💝');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Mots de passe différents', 'Les mots de passe ne correspondent pas 🤗');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Mot de passe trop court', 'Votre mot de passe doit contenir au moins 6 caractères 🔒');
      return;
    }

    setLoading(true);
    const { error } = await signUp(email.trim(), password, fullName.trim());

    if (error) {
      setLoading(false); // On dégrise le bouton même en cas d'erreur
      console.error('[SignUpScreen] Erreur reçue depuis le contexte:', JSON.stringify(error, null, 2)); // <-- Log d'erreur détaillé
      Alert.alert(
        'Inscription impossible', 
        error.message.includes('already registered') 
          ? 'Cette adresse email est déjà utilisée 📧'
          : `Une erreur est survenue: ${error.message}`
      );
    } else {
      setLoading(false);
      Alert.alert(
        'Vérifiez vos emails ! 🎉',
        'Nous vous avons envoyé un code à 6 chiffres pour activer votre compte.',
        [{
            text: 'Compris !',
            onPress: () => router.push({ pathname: '/auth/verify-code', params: { email: email.trim() } })
        }]
      );
    }
  };

  return (
    // MODIFICATION : Utilisation de l'image de fond "accueil.png"
    <BackgroundWrapper backgroundImage={require('@/assets/images/accueil.png')} noOverlay={true}>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <View style={styles.header}>
              <KuriusAvatar size="large" animated />
              <Text style={styles.title}>Rejoignez Kurius ! ✨</Text>
              <Text style={styles.subtitle}>Créez votre cocon culturel familial</Text>
            </View>

            <CozyCard style={styles.formCard}>
              <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                  <User size={20} color="#8B6F47" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Votre nom complet"
                    value={fullName}
                    onChangeText={setFullName}
                    autoCapitalize="words"
                    placeholderTextColor="rgba(139, 111, 71, 0.6)"
                  />
                </View>

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
                    placeholder="Mot de passe (min. 6 caractères)"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    placeholderTextColor="rgba(139, 111, 71, 0.6)"
                  />
                </View>

                <View style={styles.inputWrapper}>
                  <Lock size={20} color="#8B6F47" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Confirmer le mot de passe"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                    placeholderTextColor="rgba(139, 111, 71, 0.6)"
                  />
                </View>
              </View>

              <CozyButton
                onPress={handleSignUp}
                disabled={loading}
                icon={<UserPlus size={16} color="#FFF8E7" />}
                size="large"
              >
                {loading ? 'Création du compte...' : 'Créer mon compte'}
              </CozyButton>
            </CozyCard>

            <View style={styles.footerContainer}>
                <Text style={styles.linkText}>Déjà un compte ? </Text>
                <TouchableOpacity onPress={() => router.push('/auth/sign-in')}>
                    <Text style={[styles.linkText, styles.link]}>Se connecter</Text>
                </TouchableOpacity>
            </View>

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
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    minHeight: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
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
  },
  formCard: {
    marginBottom: 16,
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
  linkText: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: '#8B6F47',
    textAlign: 'center',
  },
  link: {
    color: '#D4A574',
    fontFamily: 'Nunito-SemiBold',
  },
  footerContainer: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
});
