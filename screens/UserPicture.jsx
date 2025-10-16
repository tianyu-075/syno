import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';

const AVATAR_OPTIONS = [
  { id: '1', uri: 'https://cdn-icons-png.flaticon.com/512/847/847969.png'},
  { id: '2', uri: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'},
  { id: '3', uri: 'https://cdn-icons-png.flaticon.com/512/236/236832.png' },
  { id: '4', uri: 'https://cdn-icons-png.flaticon.com/512/4140/4140048.png' },
  { id: '5', uri: 'https://cdn-icons-png.flaticon.com/512/4128/4128176.png'},
  { id: '6', uri: 'https://cdn-icons-png.flaticon.com/512/4202/4202831.png'},
  { id: '7', uri: 'https://cdn-icons-png.flaticon.com/512/4333/4333609.png' },
  { id: '8', uri: 'https://cdn-icons-png.flaticon.com/512/4128/4128163.png' },
];

export default function UserPicture() {
  const navigation = useNavigation();
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [currentProfilePicture, setCurrentProfilePicture] = useState('');

  useEffect(() => {
    loadCurrentProfilePicture();
  }, []);

  const loadCurrentProfilePicture = async () => {
    try {
      const savedPicture = await AsyncStorage.getItem('profilePicture');
      if (savedPicture) {
        setCurrentProfilePicture(savedPicture);
        setSelectedAvatar(savedPicture);
      }
    } catch (e) {
      console.warn('Failed loading profile picture', e);
    }
  };

  const saveProfilePicture = async (avatarUri) => {
    try {
      await AsyncStorage.setItem('profilePicture', avatarUri);
      setCurrentProfilePicture(avatarUri);
      Alert.alert('✅ Success', 'Profile picture updated successfully!');
      // Navigate back to MyPageScreen after successful save
      setTimeout(() => {
        navigation.goBack();
      }, 1000); // Small delay to let user see success message
    } catch (e) {
      Alert.alert('⚠️ Error', 'Failed to save profile picture');
    }
  };

  const handleAvatarSelect = (avatar) => {
    setSelectedAvatar(avatar.uri);
    saveProfilePicture(avatar.uri);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Choose Profile Picture</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Current Profile Picture */}
        <View style={styles.currentSection}>
          <Text style={styles.sectionTitle}>Current Picture</Text>
          <View style={styles.currentContainer}>
            <Image
              source={{ uri: currentProfilePicture || 'https://cdn-icons-png.flaticon.com/512/847/847969.png' }}
              style={styles.currentAvatar}
            />
          </View>
        </View>

        {/* Avatar Options */}
        <Text style={styles.sectionTitle}>Choose New Picture</Text>
        <View style={styles.avatarsContainer}>
          {AVATAR_OPTIONS.map((avatar) => (
            <TouchableOpacity
              key={avatar.id}
              style={[
                styles.avatarOption,
                selectedAvatar === avatar.uri && styles.selectedAvatar,
              ]}
              onPress={() => handleAvatarSelect(avatar)}
            >
              <Image source={{ uri: avatar.uri }} style={styles.avatarImage} />
              {selectedAvatar === avatar.uri && (
                <View style={styles.checkmark}>
                  <Text style={styles.checkmarkText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f2f4f7',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingTop: 20,
  },
  backButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  backButtonText: {
    fontSize: 20,
    color: '#555',
    fontWeight: '700',
  },
  placeholder: {
    width: 45,
    height: 45,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2d3748',
    textAlign: 'center',
    flex: 1,
  },
  currentSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4a5568',
    marginBottom: 16,
  },
  currentContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#fff',
    borderWidth: 3,
    borderColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  currentAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  avatarOption: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedAvatar: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  avatarImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  checkmark: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#007AFF',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
