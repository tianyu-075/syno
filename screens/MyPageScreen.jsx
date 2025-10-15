import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MyPageScreen() {
  const navigation = useNavigation();
  const [userName, setUserName] = useState('');
  const [allergies, setAllergies] = useState([]);
  const [newAllergy, setNewAllergy] = useState('');

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const savedName = await AsyncStorage.getItem('userName');
      const savedAllergies = await AsyncStorage.getItem('allergies');
      if (savedName) setUserName(savedName);
      if (savedAllergies) {
        const parsed = JSON.parse(savedAllergies);
        if (Array.isArray(parsed)) setAllergies(parsed);
      }
    } catch (e) {
      console.warn('Failed loading user data', e);
    }
  };

  const saveUserName = async () => {
    try {
      await AsyncStorage.setItem('userName', userName);
      Alert.alert('✅ Success', 'Name saved successfully!');
    } catch (e) {
      Alert.alert('⚠️ Error', 'Failed to save name');
    }
  };

  const addAllergy = async () => {
    if (newAllergy.trim().length > 0) {
      const updated = [...allergies, newAllergy.trim()];
      setAllergies(updated);
      setNewAllergy('');
      try {
        await AsyncStorage.setItem('allergies', JSON.stringify(updated));
      } catch (e) {
        Alert.alert('⚠️ Error', 'Failed to save allergy');
      }
    }
  };

  const deleteAllergy = (index) => {
    const updated = allergies.filter((_, i) => i !== index);
    setAllergies(updated);
    AsyncStorage.setItem('allergies', JSON.stringify(updated));
  };

  const navigateToUserPicture = () => {
    Alert.alert('Change Picture', 'Profile picture screen would open here.');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <View style={styles.profileContainer}>
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: 'https://cdn-icons-png.flaticon.com/512/847/847969.png' }}
              style={styles.avatar}
            />
          </View>
          <TouchableOpacity onPress={navigateToUserPicture}>
            <Text style={styles.changePictureText}>Change Profile Picture</Text>
          </TouchableOpacity>
        </View>

        {/* Name Section */}
        <Text style={styles.sectionTitle}>Name</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={userName}
            onChangeText={setUserName}
            placeholder="Enter your name"
            placeholderTextColor="#aaa"
          />
          <TouchableOpacity style={styles.saveButtonSmall} onPress={saveUserName}>
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>

        {/* Allergy Section */}
        <Text style={[styles.sectionTitle, { marginTop: 28 }]}>
          Allergies & Medications to Avoid
        </Text>

        {allergies.length > 0 ? (
          allergies.map((item, i) => (
            <View key={i} style={styles.allergyItem}>
              <Text style={styles.allergyText}>{item}</Text>
              <TouchableOpacity onPress={() => deleteAllergy(i)} style={styles.deleteButton}>
                <Text style={styles.deleteButtonText}>×</Text>
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No allergies added yet</Text>
        )}

        {/* Add allergy */}
        <View style={styles.addAllergySection}>
          <Text style={styles.addLabel}>Add new</Text>
          <View style={styles.addRow}>
            <TextInput
              style={styles.input}
              value={newAllergy}
              onChangeText={setNewAllergy}
              placeholder="Enter allergy or medication"
              placeholderTextColor="#aaa"
            />
            <TouchableOpacity style={styles.addButton} onPress={addAllergy}>
              <Text style={styles.addButtonText}>+ Add</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f2f4f7',
    paddingHorizontal: 20,
  },

  // Profile
  profileContainer: {
    alignItems: 'center',
    marginVertical: 30,
  },
  avatarContainer: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#fff',
    borderWidth: 3,
    borderColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  changePictureText: {
    marginTop: 12,
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // Titles
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },

  // Input row
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#d1d5db',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  input: {
    flex: 1,
    padding: 14,
    fontSize: 16,
    color: '#111827',
  },

  // Save button
  saveButtonSmall: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 22,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopRightRadius: 14,
    borderBottomRightRadius: 14,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },

  // Allergy list
  allergyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  allergyText: {
    fontSize: 16,
    color: '#111827',
    flex: 1,
  },
  deleteButton: {
    backgroundColor: '#f3f4f6',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#6b7280',
    fontSize: 18,
    fontWeight: '700',
  },
  emptyText: {
    color: '#6b7280',
    fontSize: 15,
    textAlign: 'center',
    marginVertical: 10,
  },

  // Add allergy
  addAllergySection: {
    marginTop: 18,
  },
  addLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#d1d5db',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  addButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 22,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopRightRadius: 14,
    borderBottomRightRadius: 14,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
