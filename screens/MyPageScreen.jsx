import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
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
        if (typeof savedAllergies === 'string' && savedAllergies.includes(',')) {
          const allergiesArray = savedAllergies.split(',').map(item => item.trim()).filter(item => item.length > 0);
          setAllergies(allergiesArray);
        } else if (Array.isArray(savedAllergies)) {
          setAllergies(savedAllergies);
        } else if (savedAllergies) {
          setAllergies([savedAllergies]);
        }
      }
    } catch (e) {
      console.warn('Failed loading user data', e);
    }
  };

  const saveUserName = async () => {
    try {
      await AsyncStorage.setItem('userName', userName);
      Alert.alert('Success', 'Name saved successfully!');
    } catch (e) {
      console.warn('Failed saving name', e);
      Alert.alert('Error', 'Failed to save name');
    }
  };

  const addAllergy = async () => {
    if (newAllergy.trim().length > 0) {
      const updatedAllergies = [...allergies, newAllergy.trim().toLowerCase()];
      setAllergies(updatedAllergies);
      setNewAllergy('');

      try {
        await AsyncStorage.setItem('allergies', JSON.stringify(updatedAllergies));
      } catch (e) {
        console.warn('Failed saving allergies', e);
        Alert.alert('Error', 'Failed to save allergy');
      }
    }
  };

  const deleteAllergy = (index) => {
    const updatedAllergies = allergies.filter((_, i) => i !== index);
    setAllergies(updatedAllergies);
  };

  const navigateToUserPicture = () => {
    Alert.alert('User Picture', 'User picture screen would open here');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView>

    <TouchableOpacity style={styles.pictureButton} onPress={navigateToUserPicture}>
          <Text style={styles.pictureButtonText}>Change Profile Picture</Text>
        </TouchableOpacity>

        {/* image of a person icon here in a circle ,in the center, above the name section */}
      

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Name</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={userName}
              onChangeText={setUserName}
              placeholder="Enter your name"
              placeholderTextColor="#999"
            />
            <TouchableOpacity style={styles.saveButtonSmall} onPress={saveUserName}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>


        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Allergies & Medications to Avoid</Text>

    
          {allergies.length > 0 ? (
            <View>
              {allergies.map((allergy, index) => (
                <View key={index} style={styles.allergyItem}>
                  <Text style={styles.allergyText}>{allergy}</Text>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => deleteAllergy(index)}
                  >
                    <Text style={styles.deleteButtonText}>x</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>No allergies added yet</Text>
          )}

       
          <View style={styles.addAllergySection}>
            <Text style={styles.addLabel}>Add new:</Text>
            <View style={styles.addAllergyContainer}>
              <TextInput
                style={styles.input}
                value={newAllergy}
                onChangeText={setNewAllergy}
                placeholder="Enter medication or allergy"
                placeholderTextColor="#999"
              />
              <TouchableOpacity style={styles.addSmallButton} onPress={addAllergy}>
                <Text style={styles.addSmallButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    
    </SafeAreaView  >
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  input: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'transparent',
    color: '#333',
  },
  saveButtonSmall: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  allergyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    padding: 12,
    marginBottom: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  allergyText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    width: 28,
    height: 28,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    padding: 16,
  },
  addAllergySection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  addLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  addAllergyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  addSmallButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addSmallButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  pictureButton: {
    backgroundColor: '#FF9500',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  pictureButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});