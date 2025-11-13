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
  const medication = route.params?.medication;
  if (!medication) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.errorText}>⚠️ No medication data received.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

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
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (medication) {
      setName(medication.name || '');
      setDosage(medication.dosage || '');
      setNote(medication.note || '');
      setColor(medication.color || '#4e73df');
      const formattedTimes = (
        medication.times || [
          { id: Date.now(), time: null, notificationId: null },
        ]
      ).map((t) => ({
        id: t.id,
        time: t.time ? ensureDateObject(t.time) : null,
        notificationId: t.notificationId || null,
      }));
      setTimes(formattedTimes);
      setHasUnsavedChanges(false);
    }
  }, [medication]);

  const loadData = async () => {
    try {
      const meds = await AsyncStorage.getItem('medications');
      const allergyData = await AsyncStorage.getItem('allergies');
      if (meds) {
        const parsedMeds = JSON.parse(meds);
        const convertedMeds = parsedMeds.map((med) => ({
          ...med,
          times: med.times.map((t) => ({
            ...t,
            time: t.time ? new Date(t.time) : null,
            notificationId: t.notificationId || null,
          })),
        }));
        setMedications(convertedMeds);
      }
      if (allergyData) setAllergies(JSON.parse(allergyData));
    } catch (e) {
      console.warn('Failed loading stored data', e);
    }
  };

  const ensureDateObject = (dateValue) => {
    if (dateValue instanceof Date && !isNaN(dateValue)) return dateValue;
    if (typeof dateValue === 'string' || typeof dateValue === 'number') {
      const date = new Date(dateValue);
      return isNaN(date) ? null : date;
    }
    return null;
  };

  const addTime = () => {
    setTimes((prev) => [
      ...prev,
      { id: Date.now(), time: null, notificationId: null },
    ]);
    setHasUnsavedChanges(true);
  };

  const handleBackPress = () => {
    navigation.navigate('PillScreen', { medication });
  };

  const updateTime = async (id, selectedDate) => {
    setTimes((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          if (t.notificationId) {
            Notifications.cancelScheduledNotificationAsync(
              t.notificationId
            ).catch((e) => console.warn('Cancel notification error', e));
          }
          return { ...t, time: selectedDate, notificationId: null };
        }
        return t;
      })
    );
    setShowPickerId(null);
    setHasUnsavedChanges(true);
  };

  const deleteTime = async (id) => {
    setTimes((prev) => {
      if (prev.length <= 1) {
        Alert.alert('Cannot Delete', 'At least one time slot is required.');
        return prev;
      }

      const timeToDelete = prev.find((t) => t.id === id);
      if (timeToDelete?.notificationId) {
        Notifications.cancelScheduledNotificationAsync(timeToDelete.notificationId)
          .catch((e) => console.warn('Cancel notification error', e));
      }

      const updatedTimes = prev.filter((t) => t.id !== id);
      setHasUnsavedChanges(true);
      return updatedTimes;
    });
  };

  const formatTime = (date) => {
    if (!date) return 'Set time';
    return date instanceof Date
      ? `${date.getHours().toString().padStart(2, '0')}:${date
        .getMinutes()
        .toString()
        .padStart(2, '0')}`
      : 'Set time';
  };

  const saveMedication = async () => {
    if (!name.trim()) {
      Alert.alert('Please enter a medication name.');
      return;
    }
    if (!hasUnsavedChanges) {
      navigation.navigate('PillScreen', { medication });
      return;
    }

    const isSameTimes = (times1, times2) => {
      if (times1.length !== times2.length) return false;
      const normalize = (arr) =>
        [...arr]
          .map((t) =>
            t.time instanceof Date
              ? `${t.time.getHours()}:${t.time.getMinutes()}`
              : t.time
          )
          .sort()
          .join(',');
      return normalize(times1) === normalize(times2);
    };

    const checkDuplicate = () => {
      return medications.some((m) => {
        if (m.id === medication?.id) return false;
        const sameName =
          m.name.trim().toLowerCase() === name.trim().toLowerCase();
        const sameDosage = m.dosage === dosage;
        const sameNote = m.note === note;
        const sameColor = m.color === color;
        const sameTimes = isSameTimes(m.times, times);
        return sameName && sameDosage && sameNote && sameColor && sameTimes;
      });
    };

    if (checkDuplicate()) {
      Alert.alert('This medication reminder already exists in your list');
      return;
    }

    const allergyMatch = allergies.find((a) => {
      const allergyName = typeof a === 'object' ? a.name : a;
      return (
        allergyName &&
        allergyName.trim().toLowerCase() === name.trim().toLowerCase()
      );
    });

    const scheduleNotification = async (medicationData, t) => {
      const date = ensureDateObject(t.time);
      if (!date) return { ...t, notificationId: null };

      const now = new Date();
      let triggerDate = new Date(now);
      triggerDate.setHours(date.getHours(), date.getMinutes(), 0, 0);
      if (triggerDate <= now) triggerDate.setDate(triggerDate.getDate() + 1);

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
        return { ...t, notificationId };
      } catch (e) {
        console.warn('Failed to schedule notification', e);
        return { ...t, notificationId: null };
      }
    };

    const performSave = async () => {
      const medId = medication?.id || Date.now();
      const medicationData = {
        id: medId,
        name: name.trim(),
        dosage,
        note,
        color,
        times,
      };

      // 先取消旧通知，防止重复触发
      if (medication?.times) {
        for (const t of medication.times) {
          if (t.notificationId) {
            try {
              await Notifications.cancelScheduledNotificationAsync(
                t.notificationId
              );
            } catch (e) {
              console.warn('Cancel old notification error', e);
            }
          }
        }
      }

      // 重新调度新通知
      const updatedTimes = [];
      for (const t of times) {
        const scheduled = await scheduleNotification(medicationData, t);
        updatedTimes.push(scheduled);
      }

      const finalMedicationData = {
        ...medicationData,
        times: updatedTimes,
      };

      const finalMeds = medications.some((m) => m.id === medId)
        ? medications.map((m) => (m.id === medId ? finalMedicationData : m))
        : [...medications, finalMedicationData];

      try {
        await AsyncStorage.setItem('medications', JSON.stringify(finalMeds));
        setMedications(finalMeds);
        setHasUnsavedChanges(false);
        Alert.alert('Success', 'Medication updated successfully!');
        Keyboard.dismiss();
        navigation.navigate('PillScreen', {
          medication: {
            ...finalMedicationData,
            times: finalMedicationData.times.map((t) => ({
              ...t,
              time: t.time ? t.time.toISOString() : null,
            })),
          },
        });
      } catch (e) {
        console.warn('Save error', e);
        Alert.alert('Error', 'Failed to update medication');
      }
    };

    if (allergyMatch) {
      Alert.alert(
        'Allergy Warning',
        `Warning: "${name.trim()}" matches one in your allergy list. Please confirm with your doctor or pharmacist.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Save Anyway',
            style: 'destructive',
            onPress: () => performSave(),
          },
        ]
      );
      return;
    }

    await performSave();
  };

  const handleDeleteMedication = async () => {
    if (!medication?.id) {
      Alert.alert('Error', 'Medication data is missing');
      return;
    }

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
              for (const t of medication.times || []) {
                if (t.notificationId) {
                  try {
                    await Notifications.cancelScheduledNotificationAsync(
                      t.notificationId
                    );
                  } catch (e) {
                    console.warn('Cancel notification error', e);
                  }
                }
              }
              const updatedMeds = medications.filter(
                (med) => med.id !== medication.id
              );
              await AsyncStorage.setItem(
                'medications',
                JSON.stringify(updatedMeds)
              );
              setMedications(updatedMeds);
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
          <TouchableOpacity
            style={styles.saveButton}
            onPress={() => navigation.navigate('PillScreen')}
          >
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
          <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Edit Medication</Text>
          <View style={styles.placeholder} />
        </View>

        <Text style={styles.fieldLabel}>Medication Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Medicine name"
          value={name}
          onChangeText={(text) => {
            setName(text);
            setHasUnsavedChanges(true);
          }}
        />

        <Text style={styles.fieldLabel}>Dosage</Text>
        <TextInput
          style={styles.input}
          placeholder="Dosage (e.g., 500mg)"
          value={dosage}
          onChangeText={(text) => {
            setDosage(text);
            setHasUnsavedChanges(true);
          }}
        />

        <Text style={styles.fieldLabel}>Note</Text>
        <TextInput
          style={styles.input}
          placeholder="Note (e.g., after meal)"
          value={note}
          onChangeText={(text) => {
            setNote(text);
            setHasUnsavedChanges(true);
          }}
        />

        <Text style={styles.sectionTitle}>Change tag color</Text>
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
              onPress={() => {
                setColor(c);
                setHasUnsavedChanges(true);
              }}
            />
          ))}
        </View>

        <View style={styles.timeHeader}>
          <Text style={styles.sectionTitle}>Reminder Time</Text>
          <TouchableOpacity onPress={addTime}>
            <Text style={styles.addTimeText}>+ Add another time</Text>
          </TouchableOpacity>
        </View>

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
              <View style={styles.pickerOverlay}>
                <TouchableOpacity
                  style={styles.pickerBackdrop}
                  onPress={() => setShowPickerId(null)}
                  activeOpacity={1}
                />
                <View style={styles.pickerContainer}>
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
                </View>
              </View>
            )}
          </View>
        ))}

        <TouchableOpacity style={styles.saveButton} onPress={saveMedication}>
          <Text style={{ color: 'white', fontSize: 18 }}>
            {medication ? 'Update Medication' : 'Add Medication'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDeleteMedication}
        >
          <Text style={{ color: 'white', fontSize: 16 }}>
            Delete this medication
          </Text>
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
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  backButtonText: { color: '#555', fontSize: 20, fontWeight: '700' },
  placeholder: { width: 50, height: 40 },
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
  colorContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
  colorCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedColor: { borderColor: '#000', borderWidth: 3 },
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
  timeText: { fontSize: 18, color: '#333', fontWeight: '600' },
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
  pickerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});
