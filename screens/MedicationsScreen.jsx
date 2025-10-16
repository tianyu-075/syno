import React, { useState, useEffect } from 'react';
import {
  Keyboard,
  ScrollView,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function MedicationsScreen() {
  const navigation = useNavigation();
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [note, setNote] = useState('');
  const [times, setTimes] = useState([{ id: Date.now(), time: null }]);
  const [color, setColor] = useState('#4e73df');
  const [allergies, setAllergies] = useState([]);
  const [medications, setMedications] = useState([]);
  const [showPickerId, setShowPickerId] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  // Reload medications whenever the screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('MedicationsScreen focused - reloading data');
      loadData();
    });

    return unsubscribe;
  }, [navigation]);

  const loadData = async () => {
    try {
      const meds = await AsyncStorage.getItem('medications');
      const allergyData = await AsyncStorage.getItem('allergies');
      console.log('Raw allergy data from storage:', allergyData);
      if (meds) {
        const parsedMeds = JSON.parse(meds);
        setMedications(parsedMeds);
        console.log('Loaded medications:', parsedMeds.length);
      }
      if (allergyData) {
        const parsedAllergies = JSON.parse(allergyData);
        console.log('Parsed allergies:', parsedAllergies);
        setAllergies(parsedAllergies);
        console.log('Loaded allergies:', parsedAllergies.length);
      } else {
        console.log('No allergies found in storage');
      }
      clearForm();
    } catch (e) {
      console.warn('Failed loading stored data', e);
    }
  };

  const updateMedicationNotifications = async (existingMed, medicationData, newTimes) => {
    try {
      if (existingMed) await Notifications.cancelAllScheduledNotificationsAsync();

      for (const t of newTimes) {
        const date = t.time instanceof Date ? t.time : new Date(t.time);
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Medication Reminder',
            body: `${medicationData.name} ${medicationData.dosage} — ${medicationData.note}`,
          },
          trigger: {
            hour: date.getHours(),
            minute: date.getMinutes(),
            repeats: true,
          },
        });
      }
    } catch (e) {
      console.warn('Notification update error', e);
    }
  };

  const addTime = () => {
    setTimes((prev) => [...prev, { id: Date.now(), time: null }]);
  };

  const ensureDateObject = (dateValue) => {
    if (dateValue instanceof Date) return dateValue;
    if (typeof dateValue === 'string' || typeof dateValue === 'number') return new Date(dateValue);
    if (dateValue === null) return new Date(); // For new time slots, use current time as picker default
    return new Date();
  };

  const updateTime = (id, selectedDate) => {
    const updated = times.map((t) => (t.id === id ? { ...t, time: selectedDate } : t));
    setTimes(updated);
    setShowPickerId(null);
  };

  const deleteTime = (id) => {
    if (times.length > 1) {
      setTimes((prev) => prev.filter((t) => t.id !== id));
    } else {
      Alert.alert('Cannot Delete', 'At least one time slot is required.');
    }
  };

  const saveMedication = async () => {
    if (!name.trim()) {
      Alert.alert('Please enter a medication name.');
      return;
    }

    const existingMed = medications.find(
      (m) => m.name.toLowerCase() === name.trim().toLowerCase()
    );
    if (existingMed) {
      Alert.alert('Error', 'This medication already exists in your list');
      return;
    }

    console.log('Checking allergies for:', name.trim().toLowerCase());
    console.log('Current allergies:', allergies);

    const matchingAllergy = allergies.find(
      (allergy) => {
        const allergyName = typeof allergy === 'object' ? allergy.name : allergy;
        return allergyName && allergyName.trim().toLowerCase() === name.trim().toLowerCase();
      }
    );

    console.log('Matching allergy found:', matchingAllergy);

    if (matchingAllergy) {
      Alert.alert(
        'Allergy Warning',
        `Warning: "${name.trim()}" appears in your allergies list. Continue?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Add Anyway', style: 'destructive', onPress: proceedWithAddingMedication },
        ]
      );
      return;
    }

    proceedWithAddingMedication();
  };

  const proceedWithAddingMedication = async () => {
    const medicationData = { name: name.trim(), dosage, note, color, times };
    try {
      const newMed = { id: Date.now(), ...medicationData };
      const updatedMeds = [...medications, newMed];
      await AsyncStorage.setItem('medications', JSON.stringify(updatedMeds));
      setMedications(updatedMeds);
      await updateMedicationNotifications(null, medicationData, times);
      Alert.alert('Success', 'Medication added and reminders set!');
      Keyboard.dismiss();
      clearForm();
      navigation.navigate('Home');
    } catch (e) {
      console.warn('Save error', e);
      Alert.alert('Error', 'Failed to save medication');
    }
  };

  const clearForm = () => {
    setName('');
    setDosage('');
    setNote('');
    setColor('#4e73df');
    setTimes([{ id: Date.now(), time: null }]);
  };

  const formatTime = (date) => {
    if (!date) return 'Set time';
    if (!(date instanceof Date)) return 'Set time';
    return `${date.getHours().toString().padStart(2, '0')}:${date
      .getMinutes()
      .toString()
      .padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Add medicine</Text>

        {/* Name */}
        <Text style={styles.sectionTitle}>Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Medicine name"
          value={name}
          onChangeText={setName}
          placeholderTextColor="#aaa"
        />

        {/* Dosage */}
        <Text style={styles.sectionTitle}>Dosage</Text>
        <TextInput
          style={styles.input}
          placeholder="Dosage (e.g., 500mg)"
          value={dosage}
          onChangeText={setDosage}
          placeholderTextColor="#aaa"
        />

        {/* Note */}
        <Text style={styles.sectionTitle}>Note</Text>
        <TextInput
          style={styles.input}
          placeholder="Note (e.g., after meal)"
          value={note}
          onChangeText={setNote}
          placeholderTextColor="#aaa"
        />

        {/* Color Picker */}
        <Text style={styles.sectionTitle}>Color tag</Text>
        <View style={styles.colorContainer}>
          {['#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', '#e74a3b', '#858796', '#fd7e14', '#6f42c1'].map(
            (c) => (
              <TouchableOpacity
                key={c}
                style={[styles.colorCircle, { backgroundColor: c }, color === c && styles.selectedColor]}
                onPress={() => setColor(c)}
              />
            )
          )}
        </View>

        {/* Time Picker */}
        <Text style={styles.sectionTitle}>Reminder time</Text>
        {times.map((t) => (
          <View key={t.id} style={styles.timeRow}>
            <TouchableOpacity style={styles.timeButton} onPress={() => setShowPickerId(t.id)}>
              <Text style={styles.timeText}>{formatTime(t.time)}</Text>
            </TouchableOpacity>

            {times.length > 1 && (
              <TouchableOpacity style={styles.delButton} onPress={() => deleteTime(t.id)}>
                <Text style={styles.delButtonText}>x</Text>
              </TouchableOpacity>
            )}

            {showPickerId === t.id && (
              <DateTimePicker
                value={ensureDateObject(t.time)}
                mode="time"
                is24Hour={true}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, selectedDate) => {
                  if (selectedDate) updateTime(t.id, selectedDate);
                  if (Platform.OS === 'android') setShowPickerId(null);
                }}
              />
            )}
          </View>
        ))}

        <TouchableOpacity style={styles.addButton} onPress={addTime}>
          <Text style={styles.addButtonText}>+ Add another time</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.saveButton} onPress={saveMedication}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f9fafc' },
  container: { flex: 1, padding: 20 },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2e2e2e',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#444',
    marginBottom: 4,
    marginTop: 12,
  },

  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
    color: '#333',
    marginBottom: 6,
  },

  sectionTitle: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 8,
  },

  colorContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  colorCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginRight: 10,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedColor: {
    borderColor: '#4e73df',
    transform: [{ scale: 1.1 }],
  },
  timeRow: {
    backgroundColor: '#eef1f6',
    borderRadius: 10,
    marginBottom: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    position: 'relative',
  },
  timeButton: {
    alignSelf: 'flex-start',
  },
  timeText: {
    fontSize: 16,
    color: '#333',
  },
  delButton: {
    position: 'absolute',
    top: 6,
    right: 8,
    backgroundColor: '#ccc',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  delButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: '#4e73df',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#1cc88a',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  saveButtonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
});

