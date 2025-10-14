import React from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import {useEffect, useState} from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, CommonActions } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PillCard from '../components/PillCard';



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
    // For TabNavigator, use CommonActions to navigate with params
    navigation.dispatch(
      CommonActions.navigate({
        name: 'Medications',
        params: { editMedication: medication },
      })
    );
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
      <View style={styles.container}>
        <Text style={styles.title}>Welcome to Syno</Text>
        <Text style={styles.subtitle}>Your medication management app</Text>

        {medications.length === 0 ? (
          <Text style={styles.noMedications}>No medications added yet.{'\n'}Go to the Medications tab to add some!</Text>
        ) : (
          medications.map((medication) => (
            <PillCard
              key={medication.id}
              medication={medication}
              onEdit={handleEditMedication}
              onDelete={handleDeleteMedication}
            />
          ))
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  noMedications: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 24,
  },
});















