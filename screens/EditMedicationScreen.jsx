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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Platform } from 'react-native';

export default function EditMedicationScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const { medication } = route.params || {};

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

    // Pre-fill form with medication data
    useEffect(() => {
        if (medication) {
            setName(medication.name || '');
            setDosage(medication.dosage || '');
            setNote(medication.note || '');
            setColor(medication.color || '#4e73df');

            // Ensure all times are proper Date objects
            const formattedTimes = (medication.times || [{ id: Date.now(), time: new Date() }]).map(t => ({
                id: t.id,
                time: ensureDateObject(t.time)
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

    const updateMedicationNotifications = async (existingMed, medicationData, newTimes) => {
        try {
            if (existingMed) {
                await Notifications.cancelAllScheduledNotificationsAsync();
            }

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
                            // Remove medication from AsyncStorage
                            const updatedMeds = medications.filter(med => med.id !== medication.id);
                            await AsyncStorage.setItem('medications', JSON.stringify(updatedMeds));

                            // Cancel notifications for this medication
                            await Notifications.cancelAllScheduledNotificationsAsync();

                            Alert.alert('Success', 'Medication deleted successfully!');
                            navigation.navigate('Main');
                        } catch (e) {
                            console.warn('Delete error', e);
                            Alert.alert('Error', 'Failed to delete medication');
                        }
                    }
                }
            ]
        );
    };

    const saveMedication = async () => {
        if (!name.trim()) {
            Alert.alert('Please enter a medication name.');
            return;
        }

        // Check if medication name conflicts with existing medications (but allow if editing the same one)
        const existingMed = medications.find((m) => m.name === name.trim() && m.id !== medication?.id);
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
            // Update existing medication
            const updatedMeds = medications.map(med =>
                med.id === medication.id
                    ? { ...medication, ...medicationData }
                    : med
            );

            await AsyncStorage.setItem('medications', JSON.stringify(updatedMeds));
            setMedications(updatedMeds);

            // Update notifications
            await updateMedicationNotifications(medication, medicationData, times);

            Alert.alert('Success', 'Medication updated successfully!');
            Keyboard.dismiss();

            // Navigate back to Main tab
            navigation.navigate('Main');
        } catch (e) {
            console.warn('Save error', e);
            Alert.alert('Error', 'Failed to update medication');
        }
    };

    const formatTime = (date) => {
        // Check if this is a default/unset time (current time that hasn't been modified)
        const now = new Date();
        const isDefaultTime = date instanceof Date &&
            date.getHours() === now.getHours() &&
            date.getMinutes() === now.getMinutes() &&
            date.getSeconds() === now.getSeconds();

        return date instanceof Date && !isDefaultTime
            ? `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
            : 'Set time';
    };

    if (!medication) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.container}>
                    <Text style={styles.title}>Error: No medication data</Text>
                    <TouchableOpacity style={styles.saveButton} onPress={() => navigation.navigate('Main')}>
                        <Text style={{ color: 'white', fontSize: 18 }}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView style={styles.container}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('Main')}>
                    <Text style={styles.backButtonText}>← Back to Home</Text>
                </TouchableOpacity>

                <Text style={styles.title}>Edit Medication</Text>

                <TextInput style={styles.input} placeholder="pill name" value={name} onChangeText={setName} />

                <TextInput
                    style={styles.input}
                    placeholder="dosage (e.g., 500mg, 2 tablets, 1ml)"
                    value={dosage}
                    onChangeText={setDosage}
                />

                <TextInput style={styles.input} placeholder="note (e.g., after meal)" value={note} onChangeText={setNote} />

                <Text style={styles.subTitle}>Choose tag color</Text>
                            <View style={styles.colorContainer}>
                                        {['#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', '#e74a3b', '#858796', '#fd7e14', '#6f42c1'].map(
                                        (c) => (
                                        <TouchableOpacity
                                          key={c}
                                          style={[
                                      styles.colorCircle,
                                      { backgroundColor: c },
                                      color === c && styles.selectedColor,
                        ]}
                                    onPress={() => setColor(c)}
                                  />
                                )
                              )}
                            </View>

                <Text style={styles.subTitle}>Time</Text>

                {times.map((t) => (
                    <View key={t.id} style={styles.timeRow}>
                        <TouchableOpacity style={styles.timeButton} onPress={() => setShowPickerId(t.id)}>
                            <Text>{formatTime(t.time)}</Text>
                        </TouchableOpacity>

                        {times.length > 1 && (
                            <TouchableOpacity style={styles.delButton} onPress={() => deleteTime(t.id)}>
                                <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>x</Text>
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

                <View style={styles.buttonRow}>
                    <TouchableOpacity style={styles.addButton} onPress={addTime}>
                        <Text style={{ color: 'white', fontSize: 16 }}>+</Text>
                    </TouchableOpacity>
    
                </View>
    
                <TouchableOpacity style={styles.saveButton} onPress={saveMedication}>
                    <Text style={{ color: 'white', fontSize: 18 }}>Update Medication</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={handleDeleteMedication}>
                        <Text style={{ color: 'white', fontSize: 16 }}>Delete this medicine</Text>
                    </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#fff' },
    container: { flex: 1, backgroundColor: '#fff', padding: 20 },
    backButton: {
        backgroundColor: '#6c757d',
        padding: 10,
        borderRadius: 8,
        marginBottom: 15,
        alignItems: 'center',
    },
    backButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
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
    delButton: {
        padding: 10,
        backgroundColor:'#dc3545',
        borderRadius: 6,
        marginLeft: 10,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 12,
        marginBottom: 10,
    },
    addButton: {
        backgroundColor: '#4e73df',
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    deleteButton: {
        backgroundColor: '#dc3545',
        width: 80,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveButton: {
        backgroundColor: '#28a745',
        padding: 14,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 18,
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
});