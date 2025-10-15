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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function EditMedicationScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { medication } = route.params || {};

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

  useEffect(() => {
    if (medication) {
      setName(medication.name || '');
      setDosage(medication.dosage || '');
      setNote(medication.note || '');
      setColor(medication.color || '#4e73df');
      const formattedTimes = (medication.times || [{ id: Date.now(), time: null }]).map(t => ({
        id: t.id,
        time: t.time ? ensureDateObject(t.time) : null
      }));
      setTimes(formattedTimes);
    }
  }, [medication]);

  const loadData = async () => {
    try {
      const meds = await AsyncStorage.getItem('medications');
      const allergyData = await AsyncStorage.getItem('allergies');
      if (meds) setMedications(JSON.parse(meds));
      if (allergyData) setAllergies(JSON.parse(allergyData));
    } catch (e) {
      console.warn('Failed loading stored data', e);
    }
  };

  const ensureDateObject = (dateValue) => {
    if (dateValue instanceof Date) return dateValue;
    if (typeof dateValue === 'string' || typeof dateValue === 'number') return new Date(dateValue);
    if (dateValue === null) return new Date(); // For new time slots, use current time as picker default
    return new Date();
  };

  const addTime = () => {
    // Only check for duplicates if we're adding a time that would use current time
    // For now, just allow adding empty time slots
    setTimes((prev) => [...prev, { id: Date.now(), time: null }]);
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

  const formatTime = (date) => {
    if (!date) return 'Set time';
    return date instanceof Date
      ? `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
      : 'Set time';
  };

  const saveMedication = async () => {
    if (!name.trim()) {
      Alert.alert('Please enter a medication name.');
      return;
    }

    const existingMed = medications.find((m) => m.name === name.trim() && m.id !== medication?.id);
    if (existingMed) {
      Alert.alert('This medication already exists in your list');
      return;
    }

    if (allergies.find((a) => a.name === name.trim())) {
      Alert.alert('This medication is in your allergy list');
      return;
    }

    const medicationData = { name: name.trim(), dosage, note, color, times };

    try {
      const updatedMeds = medications.map(med =>
        med.id === medication.id ? { ...medication, ...medicationData } : med
      );
      await AsyncStorage.setItem('medications', JSON.stringify(updatedMeds));
      setMedications(updatedMeds);

      Alert.alert('Success', 'Medication updated successfully!');
      Keyboard.dismiss();
      navigation.navigate('PillScreen');
    } catch (e) {
      console.warn('Save error', e);
      Alert.alert('Error', 'Failed to update medication');
    }
  };

  const handleDeleteMedication = async () => {
    Alert.alert(
      'Delete Medication',
      `Are you sure you want to delete ${medication.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedMeds = medications.filter(med => med.id !== medication.id);
              await AsyncStorage.setItem('medications', JSON.stringify(updatedMeds));
              await Notifications.cancelAllScheduledNotificationsAsync();
              Alert.alert('Deleted', 'Medication removed.');
              navigation.navigate('Main');
            } catch (e) {
              console.warn('Delete error', e);
              Alert.alert('Error', 'Failed to delete medication');
            }
          },
        },
      ]
    );
  };

  if (!medication) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={styles.title}>Error: No medication data</Text>
          <TouchableOpacity style={styles.saveButton} onPress={() => navigation.navigate('PillScreen')}>
            <Text style={{ color: 'white', fontSize: 18 }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('PillScreen')}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Edit Medication</Text>
          <View style={styles.placeholder} />
        </View>

        <Text style={styles.fieldLabel}>Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Medicine name"
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.fieldLabel}>Dosage</Text>
        <TextInput
          style={styles.input}
          placeholder="Dosage (e.g., 500mg)"
          value={dosage}
          onChangeText={setDosage}
        />

        <Text style={styles.fieldLabel}>Note</Text>
        <TextInput
          style={styles.input}
          placeholder="Note (e.g., after meal)"
          value={note}
          onChangeText={setNote}
        />

        <Text style={styles.sectionTitle}>Choose tag color</Text>
        <View style={styles.colorContainer}>
          {['#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', '#e74a3b', '#858796', '#fd7e14', '#6f42c1'].map((c) => (
            <TouchableOpacity
              key={c}
              style={[styles.colorCircle, { backgroundColor: c }, color === c && styles.selectedColor]}
              onPress={() => setColor(c)}
            />
          ))}
        </View>

        {/* Time section header */}
        <View style={styles.timeHeader}>
          <Text style={styles.sectionTitle}>Reminder Time</Text>
          <TouchableOpacity onPress={addTime}>
            <Text style={styles.addTimeText}>+ Add another time</Text>
          </TouchableOpacity>
        </View>

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

        <TouchableOpacity style={styles.saveButton} onPress={saveMedication}>
          <Text style={{ color: 'white', fontSize: 18 }}>Update Medication</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteMedication}>
          <Text style={{ color: 'white', fontSize: 16 }}>Delete this medicine</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  backButton: {
    backgroundColor: '#fff',

    alignItems:"flex-start",
    justifyContent:'flex-end',
    width: 10,
    height: 1,
    top:1,
  },
  backButtonText: { color: 'grey', fontSize: 18, fontWeight: 'bold' },

  placeholder: {
    width: 50,
    height: 40,
  },

  title: { fontSize: 22, fontWeight: '700', marginBottom: 18, color: '#333' },

  fieldLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    marginTop: 12,
    marginBottom: 6,
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
    marginBottom: 12,
  },
  colorCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedColor: {
    borderColor: '#000',
    borderWidth: 3,
  },

  timeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 8,
  },
  addTimeText: {
    color: '#4e73df',
    fontSize: 15,
    fontWeight: '600',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 8,
  },

  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    position: 'relative',
  },
  timeButton: {
    padding: 14,
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    flex: 1,
  },
  timeText: {
    fontSize: 18,
    color: '#333',
    fontWeight: '600',
  },
  delButton: {
    position: 'absolute',
    right: -8,
    top: -8,
    backgroundColor: '#ccc',
    borderRadius: 14,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  delButtonText: {
    color: '#fff',
    fontSize: 18,
    lineHeight: 18,
    fontWeight: 'bold',
  },

  saveButton: {
    backgroundColor: '#4e73df',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 22,
  },

  deleteButton: {
    backgroundColor: '#999',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
});
