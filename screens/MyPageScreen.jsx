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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MyPageScreen() {
  const navigation = useNavigation();
  const [userName, setUserName] = useState('');
  const [allergies, setAllergies] = useState([]);
  const [newAllergy, setNewAllergy] = useState('');
  const [profilePicture, setProfilePicture] = useState('');


  const disclaimerText = "Disclaimer: This app does not provide medical advice. All medication and allergy information is entered by the user. The warning shown is based solely on name matching and is not a substitute for professional medical judgment. Always consult your doctor or pharmacist before taking any medication."

  const citationText = "For reliable information about medications, you can visit MedlinePlus, a service of the U.S. National Library of Medicine."

  const citationURL = "https://medlineplus.gov/druginformation.html"

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadUserData();
    });
    return unsubscribe;
  }, [navigation]);

  const loadUserData = async () => {
    try {
      const savedName = await AsyncStorage.getItem('userName');
      const savedPicture = await AsyncStorage.getItem('profilePicture');
      const savedAllergies = await AsyncStorage.getItem('allergies');
      if (savedName) setUserName(savedName);
      if (savedPicture) setProfilePicture(savedPicture);
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
    const trimmedAllergy = newAllergy.trim();

    if (trimmedAllergy.length > 0) {
      // Check for duplicates (case-insensitive)
      const existingAllergy = allergies.find(
        (allergy) => allergy.toLowerCase() === trimmedAllergy.toLowerCase()
      );

      if (existingAllergy) {
        Alert.alert('Error', 'This allergy already exists in your list');
        return;
      }

      const updated = [...allergies, trimmedAllergy];
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
    navigation.navigate('UserPicture');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContentContainer}
        >
          {/* Profile */}
          <View style={styles.profileContainer}>
            <View style={styles.avatarContainer}>
              <Image
                source={{
                  uri:
                    profilePicture ||
                    'https://cdn-icons-png.flaticon.com/512/847/847969.png',
                }}
                style={styles.avatar}
              />
            </View>
            <TouchableOpacity onPress={navigateToUserPicture}>
              <Text style={styles.changePictureText}>
                Change Profile Picture
              </Text>
            </TouchableOpacity>
          </View>

          {/* Name */}
          <Text style={styles.sectionTitle}>Name</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={userName}
              onChangeText={setUserName}
              placeholder="Enter your name"
              placeholderTextColor="#A0AEC0"
            />
            <TouchableOpacity
              style={styles.saveButtonSmall}
              onPress={saveUserName}
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>

          {/* Allergies */}
          <Text style={[styles.sectionTitle, { marginTop: 30 }]}>
            Allergies & Medications to Avoid
          </Text>


          {allergies.length > 0 ? (
            allergies.map((item, i) => (
              <View key={i} style={styles.allergyItem}>
                <Text style={styles.allergyText}>{item}</Text>
                <TouchableOpacity
                  onPress={() => deleteAllergy(i)}
                  style={styles.deleteButton}
                >
                  <Text style={styles.deleteButtonText}>×</Text>
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No allergies added yet</Text>
          )}

          {/* Add Allergy */}
          <View style={styles.addAllergySection}>
            <Text style={styles.addLabel}>Add new</Text>
            <View style={styles.addRow}>
              <TextInput
                style={styles.input}
                value={newAllergy}
                onChangeText={setNewAllergy}
                placeholder="Enter allergy or medication"
                placeholderTextColor="#A0AEC0"
              />
              <TouchableOpacity style={styles.addButton} onPress={addAllergy}>
                <Text style={styles.addButtonText}>+ Add</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ height: 60 }} />
          <Text style={styles.disclaimerText}>{disclaimerText}</Text>
          <Text style={styles.citationText} onPress={() => Linking.openURL(citationURL)}>{citationText}</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },

  profileContainer: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 20,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  changePictureText: {
    marginTop: 12,
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: '600',
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 10,
  },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1E293B',
  },

  saveButtonSmall: {
    backgroundColor: '#10B981',
    paddingHorizontal: 20,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },

  allergyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  allergyText: {
    fontSize: 16,
    color: '#1E293B',
    flex: 1,
  },
  deleteButton: {
    backgroundColor: '#F1F5F9',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#94A3B8',
    fontSize: 18,
    fontWeight: '700',
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 15,
    textAlign: 'center',
    marginVertical: 10,
  },

  addAllergySection: {
    marginTop: 22,
  },
  addLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 3,
  },
  addButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 22,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  disclaimerText: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
    marginBottom: 10,
  },
  citationText: {
    fontSize: 12,
    color: '#3B82F6',
    textDecorationLine: 'underline',
    marginBottom: 10,
  },
});