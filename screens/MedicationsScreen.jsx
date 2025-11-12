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
  const [times, setTimes] = useState([
    { id: Date.now(), time: null, notificationId: null },
  ]);
  const [color, setColor] = useState('#4e73df');
  const [allergies, setAllergies] = useState([]);
  const [medications, setMedications] = useState([]);
  const [showPickerId, setShowPickerId] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });
    return unsubscribe;
  }, [navigation]);

  const loadData = async () => {
    try {
      const meds = await AsyncStorage.getItem('medications');
      const allergyData = await AsyncStorage.getItem('allergies');
      if (meds) {
        const parsedMeds = JSON.parse(meds).map((med, index) => ({
          ...med,
          id: med.id || Date.now() + index, // Assign id if missing
          times: med.times.map((t) => ({
            ...t,
            time: t.time ? new Date(t.time) : null,
          })),
        }));
        console.log('Loaded medications in MedicationsScreen:', parsedMeds, parsedMeds.forEach(m => console.log(m.times)));
        setMedications(parsedMeds);
      }
      if (allergyData) setAllergies(JSON.parse(allergyData));
      clearForm();
    } catch (e) {
      console.warn('Failed loading stored data', e);
    }
  };

  const addTime = () => {
    setTimes((prev) => [
      ...prev,
      { id: Date.now(), time: null, notificationId: null },
    ]);
  };

  const ensureDateObject = (dateValue) => {
    if (dateValue instanceof Date && !isNaN(dateValue)) return dateValue;
    if (typeof dateValue === 'string' || typeof dateValue === 'number') {
      const date = new Date(dateValue);
      return isNaN(date) ? null : date;
    }
    return null;
  };

  const updateTime = (id, selectedDate) => {
    const updated = times.map((t) =>
      t.id === id ? { ...t, time: selectedDate } : t
    );
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

  const scheduleNotifications = async (medicationData) => {
    const updatedTimes = [];
    for (const t of medicationData.times) {
      if (!t.time) continue;
      let triggerDate = new Date();
      triggerDate.setHours(t.time.getHours(), t.time.getMinutes(), 0, 0);
      if (triggerDate <= new Date())
        triggerDate.setDate(triggerDate.getDate() + 1);

      const trigger = {
        type: 'daily',
        hour: triggerDate.getHours(),
        minute: triggerDate.getMinutes(),
        repeats: true,
      };

      try {
        const notificationId = await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Medication Reminder',
            body: `${medicationData.name} ${medicationData.dosage} — ${medicationData.note}`,
          },
          trigger,
        });
        updatedTimes.push({ ...t, notificationId });
      } catch (e) {
        console.warn('Failed to schedule notification', e);
      }
    }
    return updatedTimes;
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

    const matchingAllergy = allergies.find((allergy) => {
      const allergyName = typeof allergy === 'object' ? allergy.name : allergy;
      return (
        allergyName &&
        allergyName.trim().toLowerCase() === name.trim().toLowerCase()
      );
    });

    if (matchingAllergy) {
      Alert.alert(
        'Allergy Warning',
        `Warning: "${name.trim()}" matches one in your allergy list. Please confirm with your doctor or pharmacist.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Add Anyway',
            style: 'destructive',
            onPress: proceedWithAddingMedication,
          },
        ]
      );
      return;
    }

    proceedWithAddingMedication();
  };

  const proceedWithAddingMedication = async () => {
    const medicationData = { name: name.trim(), dosage, note, color, times };
    try {
      // Schedule notifications and get notificationIds
      const updatedTimes = await scheduleNotifications(medicationData);

      const newMed = { id: Date.now(), ...medicationData, times: updatedTimes };
      const updatedMeds = [...medications, newMed];
      await AsyncStorage.setItem('medications', JSON.stringify(updatedMeds));
      setMedications(updatedMeds);

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
    setTimes([{ id: Date.now(), time: null, notificationId: null }]);
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
        <Text style={styles.title}>Add Medication</Text>

        <Text style={styles.sectionTitle}>Medication Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Medicine name"
          value={name}
          onChangeText={setName}
          placeholderTextColor="#aaa"
        />

        <Text style={styles.sectionTitle}>Dosage</Text>
        <TextInput
          style={styles.input}
          placeholder="Dosage (e.g., 500mg)"
          value={dosage}
          onChangeText={setDosage}
          placeholderTextColor="#aaa"
        />

        <Text style={styles.sectionTitle}>Note</Text>
        <TextInput
          style={styles.input}
          placeholder="Note (e.g., after meal)"
          value={note}
          onChangeText={setNote}
          placeholderTextColor="#aaa"
        />

        <Text style={styles.sectionTitle}>Color tag</Text>
        <View style={styles.colorContainer}>
          {[
            '#4e73df',
            '#1cc88a',
            '#36b9cc',
            '#f6c23e',
            '#e74a3b',
            '#858796',
            '#fd7e14',
          ].map((c) => (
            <TouchableOpacity
              key={c}
              style={[
                styles.colorCircle,
                { backgroundColor: c },
                color === c && styles.selectedColor,
              ]}
              onPress={() => setColor(c)}
            />
          ))}
        </View>

        <Text style={styles.sectionTitle}>Reminder time</Text>
        {times.map((t) => (
          <View key={t.id} style={styles.timeRow}>
            <TouchableOpacity
              style={styles.timeButton}
              onPress={() => setShowPickerId(t.id)}
            >
              <Text style={styles.timeText}>{formatTime(t.time)}</Text>
            </TouchableOpacity>

            {times.length > 1 && (
              <TouchableOpacity
                style={styles.delButton}
                onPress={() => deleteTime(t.id)}
              >
                <Text style={styles.delButtonText}>x</Text>
              </TouchableOpacity>
            )}

            {showPickerId === t.id && (
              <DateTimePicker
                value={ensureDateObject(t.time) || new Date()}
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
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2e2e2e',
    marginBottom: 20,
    textAlign: 'center',
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
    marginTop: 14,
    marginBottom: 8,
  },
  colorContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 },
  colorCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginRight: 10,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedColor: { borderColor: '#4e73df', transform: [{ scale: 1.1 }] },
  timeRow: {
    backgroundColor: '#eef1f6',
    borderRadius: 10,
    marginBottom: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    position: 'relative',
  },
  timeButton: { alignSelf: 'flex-start' },
  timeText: { fontSize: 16, color: '#333' },
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
  delButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  addButton: {
    backgroundColor: '#4e73df',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  addButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
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
