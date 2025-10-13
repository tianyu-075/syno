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
import PillCard from '../components/PillCard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function MedicationsScreen() {
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

    const addTime = () => {
        setTimes((prev) => [...prev, { id: Date.now(), time: new Date() }]);
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

        if (medications.find((m) => m.name === name.trim())) {
            Alert.alert('This medication already exists in your list');
            return;
        }

        if (allergies.find((a) => a.name === name.trim())) {
            Alert.alert('This medication is in your allergy list');
            return;
        }

        const newMed = {
            id: Date.now(),
            name: name.trim(),
            dosage,
            note,
            color,
            times,
        };

        try {
            const updatedMeds = [...medications, newMed];
            await AsyncStorage.setItem('medications', JSON.stringify(updatedMeds));
            setMedications(updatedMeds);

            // schedule notifications (ensure you've requested permissions elsewhere)
            for (const t of times) {
                const date = t.time instanceof Date ? t.time : new Date(t.time);
                await Notifications.scheduleNotificationAsync({
                    content: {
                        title: 'Medication Reminder',
                        body: `${name} ${dosage} — ${note}`,
                    },
                    trigger: {
                        hour: date.getHours(),
                        minute: date.getMinutes(),
                        repeats: true,
                    },
                });
            }

            Alert.alert('Medication added and reminders set!');
            Keyboard.dismiss();
            clearForm();
        } catch (e) {
            console.warn('Save error', e);
            Alert.alert('Failed to save medication');
        }
    };

    const clearForm = () => {
        setName('');
        setDosage('');
        setNote('');
        setColor('#4e73df');
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
        <ScrollView style={styles.container}>
            <Text style={styles.title}>Add medicines</Text>

            <TextInput style={styles.input} placeholder="pill name" value={name} onChangeText={setName} />

            <TextInput
                style={styles.input}
                placeholder="dosage (e.g., 500mg)"
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
                            value={t.time}
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
                <Text style={{ color: 'white', fontSize: 18 }}>Save</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
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

