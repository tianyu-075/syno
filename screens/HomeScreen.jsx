import React from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList, Alert } from 'react-native';
import {useEffect, useState} from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, CommonActions } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PillCard from '../components/PillCard';
import SwipeablePillCard from '../components/Swipeable';




export default function HomeScreen() {
  const navigation = useNavigation();
  const [medications, setMedications] = useState([]);

  const loadMedications = async () => {
    try {
      const medications = await AsyncStorage.getItem('medications');
      if (medications) {
        const medsArray = JSON.parse(medications);
        console.log('Loaded medications:', medsArray); // Debug log
        setMedications(medsArray);
      } else {
        console.log('No medications found in storage');
        setMedications([]);
      }
    } catch (e) {
      console.warn('Failed loading medications', e);
      setMedications([]);
    }
  };

  const handleEditMedication = (medication) => {
    console.log('Navigating to edit medication:', medication.name); // Debug log
    // Navigate to the dedicated edit screen
    navigation.navigate('EditMedication', { medication });
  };

  const handleDeleteMedication = async (medicationId) => {
    try {
      const updatedMeds = medications.filter(med => med.id !== medicationId);
      await AsyncStorage.setItem('medications', JSON.stringify(updatedMeds));
      setMedications(updatedMeds);
      Alert.alert('Success', 'Medication deleted successfully');
      console.log('Medication deleted, updated meds:', updatedMeds);
    } catch (e) {
      console.warn('Failed to delete medication', e);
      Alert.alert('Error', 'Failed to delete medication');
    }
  };

  useEffect(() => {
    loadMedications();
  }, []);

  // Reload medications whenever the screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('HomeScreen focused - reloading medications');
      loadMedications();
    });

    return unsubscribe;
  }, [navigation]);

  return (
    <SafeAreaView style={styles.safeArea}>
      {medications.length === 0 ? (
        <View style={styles.container}>
          <Text style={styles.title}>Welcome to Syno</Text>
          <Text style={styles.subtitle}>Your medication management app</Text>
          <Text style={styles.noMedications}>No medications added yet.{'\n'}Go to the Medications tab to add some!</Text>
        </View>
      ) : (
        <FlatList
          data={medications}
          keyExtractor={(item) => item.id.toString()}
          ListHeaderComponent={
            <View style={styles.header}>
              <Text style={styles.title}>Welcome to Syno</Text>
              <Text style={styles.subtitle}>Your medication management app</Text>
            </View>
          }
          renderItem={({ item }) => (
            <SwipeablePillCard
              medication={item}
              onEdit={handleEditMedication}
              onDelete={handleDeleteMedication}
            >
              <PillCard
                medication={item}
                onEdit={handleEditMedication}
              />
            </SwipeablePillCard>
          )}
          contentContainerStyle={styles.container}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    marginVertical: 6,
  },
  safeArea: {
    flex: 1,
  },
  deleteContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 120,
    backgroundColor: '#ff6b6b', 
    justifyContent: 'center',
    alignItems: 'center',
    borderTopRightRadius: 18,
    borderBottomRightRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 1,
  },

  deleteButton: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },

  deleteButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.5,
  },


  content: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
    zIndex: 2,
    overflow: 'hidden',
  },

  touchableContent: {
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
});

  
















