// components/FriendInviteModal.tsx
import { View, Text, Modal, FlatList, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from 'react-native';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { theme } from '@/constants/Theme';
import CozyCard from './CozyCard';
import CozyButton from './CozyButton';
import { X, CheckSquare, Square } from 'lucide-react-native';

interface Friend {
  id: string;
  full_name: string;
  avatar_url: string | null;
}

interface FriendInviteModalProps {
  visible: boolean;
  onClose: () => void;
  onInvite: (selectedFriendIds: string[]) => void;
  currentMembers: Friend[]; // Pour exclure les amis déjà présents
}

export default function FriendInviteModal({ visible, onClose, onInvite, currentMembers }: FriendInviteModalProps) {
  const { user } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);

  useEffect(() => {
    const fetchFriends = async () => {
      if (!user || !visible) return;
      setLoading(true);
      const { data, error } = await supabase.rpc('get_friends', { p_user_id: user.id });
      if (error) {
        console.error("Error fetching friends for modal:", error);
      } else {
        const currentMemberIds = new Set(currentMembers.map(m => m.id));
        // On filtre les amis qui sont déjà dans le cercle
        const friendsToInvite = (data || []).filter((friend: Friend) => !currentMemberIds.has(friend.id));
        setFriends(friendsToInvite);
      }
      setLoading(false);
    };

    fetchFriends();
  }, [user, visible, currentMembers]);

  const handleToggleFriend = (id: string) => {
    setSelectedFriendIds(prev =>
      prev.includes(id) ? prev.filter(friendId => friendId !== id) : [...prev, id]
    );
  };

  const handleConfirmInvite = () => {
    onInvite(selectedFriendIds);
    setSelectedFriendIds([]); // Reset selection
    onClose();
  };

  const renderFriend = ({ item }: { item: Friend }) => {
    const isSelected = selectedFriendIds.includes(item.id);
    return (
      <TouchableOpacity style={styles.friendRow} onPress={() => handleToggleFriend(item.id)}>
        <Image 
          source={item.avatar_url ? { uri: item.avatar_url } : require('@/assets/images/kurius-avatar.png')}
          style={styles.avatar} 
        />
        <Text style={styles.fullName}>{item.full_name}</Text>
        {isSelected 
          ? <CheckSquare size={24} color={theme.colors.primary} /> 
          : <Square size={24} color={theme.colors.textLight} />
        }
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <CozyCard style={styles.modalContent}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color={theme.colors.textLight} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Inviter des amis</Text>
          {loading ? (
            <ActivityIndicator size="large" color={theme.colors.primary} />
          ) : (
            <FlatList
              data={friends}
              renderItem={renderFriend}
              keyExtractor={(item) => item.id}
              ListEmptyComponent={<Text style={styles.emptyText}>Tous vos amis sont déjà dans ce cercle !</Text>}
            />
          )}
          <CozyButton 
            onPress={handleConfirmInvite} 
            disabled={selectedFriendIds.length === 0} 
            style={{marginTop: 20}}
          >
            Inviter ({selectedFriendIds.length})
          </CozyButton>
        </CozyCard>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
    modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    modalContent: { height: '75%', width: '100%', borderBottomLeftRadius: 0, borderBottomRightRadius: 0, padding: 20 },
    closeButton: { position: 'absolute', top: 20, right: 20, zIndex: 1 },
    modalTitle: { ...theme.fonts.title, fontSize: 22, color: theme.colors.textDark, marginBottom: 20, textAlign: 'center' },
    friendRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.colors.borderColor },
    avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12, backgroundColor: theme.colors.disabledBackground },
    fullName: { ...theme.fonts.body, fontSize: 16, flex: 1, color: theme.colors.textDark },
    emptyText: { ...theme.fonts.body, fontStyle: 'italic', textAlign: 'center', color: theme.colors.textLight, marginTop: 40 }
});