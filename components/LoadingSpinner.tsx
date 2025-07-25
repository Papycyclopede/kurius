import { View, Text, StyleSheet } from 'react-native';
import { useEffect, useState } from 'react';
import KuriusAvatar from './KuriusAvatar';

interface LoadingSpinnerProps {
  message?: string;
  submessage?: string;
  animated?: boolean;
}

export default function LoadingSpinner({ 
  message = "Kurius travaille...", 
  submessage,
  animated = true
}: LoadingSpinnerProps) {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 300);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      <KuriusAvatar size="large" animated={animated} />
      <Text style={styles.message}>{message}{dots}</Text>
      {submessage && <Text style={styles.submessage}>{submessage}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF8E7',
    padding: 20,
  },
  message: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3748',
    marginTop: 16,
    textAlign: 'center',
  },
  submessage: {
    fontSize: 14,
    color: '#8B9DC3',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
});