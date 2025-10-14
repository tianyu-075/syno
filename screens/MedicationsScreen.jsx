import React, { useState, useEffect } from 'react';
import {
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Alert,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function MedicationsScreen({ route }) {
    const { editMedication } = route.params || {};
    const navigation = useNavigation();
    const [name, setName] = useState('');
    const [dosage, setDosage] = useState('');
    const [note, setNote] = useState('');
    const [times, setTimes] = useState([{ id: Date.now(), time: new Date() }]);
    const [color, setColor] = useState('#4e73df');
    const [allergies, setAllergies] = useState([]);
    const [medications, setMedications] = useState([]);
    const [showPickerId, setShowPickerId] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    // Reload data whenever the screen comes into focus
    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            console.log('MedicationsScreen focused - reloading data');
            loadData();
        });

        return unsubscribe;
    }, [navigation]);

    // Pre-fill form if editing existing medication
    useEffect(() => {
        if (editMedication) {
            setName(editMedication.name || '');
            setDosage(editMedication.dosage || '');
            setNote(editMedication.note || '');
            setColor(editMedication.color || '#4e73df');

            // Ensure all times are proper Date objects
            const formattedTimes = (editMedication.times || [{ id: Date.now(), time: new Date() }]).map(t => ({
                id: t.id,
                time: ensureDateObject(t.time)
            }));
            setTimes(formattedTimes);
        }
    }, [editMedication]);

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

    const updateMedicationNotifications = async (existingMed, medicationData, newTimes) => {
        try {
            // Cancel existing notifications for this medication if it exists
            if (existingMed) {
                // Note: In a real implementation, you'd want to track notification IDs
                // For now, we'll cancel all and reschedule
                await Notifications.cancelAllScheduledNotificationsAsync();
            }

            // Schedule new notifications
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
        setTimes((prev) => [...prev, { id: Date.now(), time: new Date() }]);
    };

    const ensureDateObject = (dateValue) => {
        if (dateValue instanceof Date) {
            return dateValue;
        }
        if (typeof dateValue === 'string' || typeof dateValue === 'number') {
            return new Date(dateValue);
        }
        return new Date(); // fallback to current date
    };

    const updateTime = (id, selectedDate) => {
        const updated = times.map((t) => (t.id === id ? { ...t, time: selectedDate } : t));
        setTimes(updated);
        setShowPickerId(null);
    };

    const saveMedication = async () => {
        if (!name.trim()) {
            Alert.alert('Please enter a medication name.');
            return;
        }

        // Check if medication name conflicts with existing medications (but allow if editing the same one)
        const existingMed = medications.find((m) => m.name === name.trim() && m.id !== editMedication?.id);
        if (existingMed) {
            Alert.alert('This medication already exists in your list');
            return;
        }

        if (allergies.find((a) => a.name === name.trim())) {
            Alert.alert('This medication is in your allergy list');
            return;
        }

        const medicationData = {
            name: name.trim(),
            dosage,
            note,
            color,
            times,
        };

        try {
            let updatedMeds;

            if (editMedication) {
                // Update existing medication
                updatedMeds = medications.map(med =>
                    med.id === editMedication.id
                        ? { ...editMedication, ...medicationData }
                        : med
                );
                Alert.alert('Medication updated successfully!');
            } else {
                // Create new medication
                const newMed = {
                    id: Date.now(),
                    ...medicationData,
                };
                updatedMeds = [...medications, newMed];
                Alert.alert('Medication added and reminders set!');
            }

            await AsyncStorage.setItem('medications', JSON.stringify(updatedMeds));
            setMedications(updatedMeds);
            console.log('Saved medications to storage:', updatedMeds); // Debug log

            // Schedule/Cancel notifications for the medication
            await updateMedicationNotifications(editMedication, medicationData, times);

            Keyboard.dismiss();
            clearForm();

            // Navigate back to Home tab after saving (this will trigger focus event)
            navigation.navigate('Home');
        } catch (e) {
            console.warn('Save error', e);
            Alert.alert('Failed to save medication');
        }
    };

    const clearForm = () => {
        setName('');
        setDosage('');
        setNote('');
        setColor('');
        setTimes([{ id: Date.now(), time: new Date() }]);
    };

    const formatTime = (date) =>
        date instanceof Date
            ? `${date.getHours().toString().padStart(2, '0')}:${date
                  .getMinutes()
                  .toString()
                  .padStart(2, '0')}`
            : '';

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView style={styles.container}>
                <Text style={styles.title}>{editMedication ? 'Edit Medication' : 'Add medicines'}</Text>

            <TextInput style={styles.input} placeholder="pill name" value={name} onChangeText={setName} />

            <TextInput
                style={styles.input}
                placeholder="dosage"
                keyboardType="numeric"
                value={dosage}
                onChangeText={setDosage}
            />

            <TextInput style={styles.input} placeholder="note (e.g., after meal)" value={note} onChangeText={setNote} />

            <TextInput style={styles.input} placeholder="color" value={color} onChangeText={setColor} />

            <Text style={styles.subTitle}>Time</Text>

            {times.map((t) => (
                <View key={t.id} style={styles.timeRow}>
                    <TouchableOpacity style={styles.timeButton} onPress={() => setShowPickerId(t.id)}>
                        <Text>{formatTime(t.time)}</Text>
                    </TouchableOpacity>

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
                <Text style={{ color: 'white', fontSize: 16 }}>+</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.saveButton} onPress={saveMedication}>
                <Text style={{ color: 'white', fontSize: 18 }}>
                    {editMedication ? 'Update' : 'Save'}
                </Text>
            </TouchableOpacity>
        </ScrollView>
    </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#fff' },
    container: { flex: 1, backgroundColor: '#fff', padding: 20 },
    title: { fontSize: 22, fontWeight: 'bold', marginBottom: 15 },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 10,
        marginBottom: 10,
    },
    subTitle: { fontSize: 16, marginTop: 12, marginBottom: 8 },
    timeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    timeButton: { padding: 10, backgroundColor: '#eee', borderRadius: 6 },
    addButton: {
        backgroundColor: '#4e73df',
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 12,
    },
    saveButton: {
        backgroundColor: '#28a745',
        padding: 14,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 18,
    },
});

