import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { TestTube, X, Vote, Trophy } from 'lucide-react-native';
import CozyCard from './CozyCard';
import CozyButton from './CozyButton';

export default function DemoButton() {
  const { t } = useTranslation();
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);

  const navigateToDemo = (route: string) => {
    setShowModal(false);
    router.push(route as any);
  };

  return (
    <>
      <TouchableOpacity
        style={styles.demoButton}
        onPress={() => setShowModal(true)}
      >
        <TestTube size={18} color="#D4A574" />
        <Text style={styles.demoButtonText}>DEMO</Text>
      </TouchableOpacity>

      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <CozyCard style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('demo.title')}</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowModal(false)}
              >
                <X size={20} color="#8B6F47" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalSubtitle}>{t('demo.subtitle')}</Text>

            <View style={styles.demoButtons}>
              <CozyButton
                onPress={() => navigateToDemo('/vote-screen')}
                icon={<Vote size={16} color="#FFF8E7" />}
                style={styles.demoNavButton}
              >
                {t('demo.buttons.vote')}
              </CozyButton>

              <CozyButton
                onPress={() => navigateToDemo('/result-screen')}
                icon={<Trophy size={16} color="#FFF8E7" />}
                style={styles.demoNavButton}
              >
                {t('demo.buttons.result')}
              </CozyButton>
            </View>

            <CozyButton
              onPress={() => setShowModal(false)}
              variant="secondary"
              style={styles.closeModalButton}
            >
              {t('demo.buttons.close')}
            </CozyButton>
          </CozyCard>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  demoButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 2,
    borderColor: '#D4A574',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
  },
  demoButtonText: {
    fontSize: 12,
    fontFamily: 'Nunito-Bold',
    color: '#D4A574',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Comfortaa-SemiBold',
    color: '#5D4E37',
  },
  closeButton: {
    padding: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: '#8B6F47',
    marginBottom: 20,
  },
  demoButtons: {
    gap: 12,
    marginBottom: 20,
  },
  demoNavButton: {
    width: '100%',
  },
  closeModalButton: {
    width: '100%',
  },
});