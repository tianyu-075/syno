import React from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';

export default function PillScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const { medication } = route.params || {};

    console.log('PillScreen - Received route params:', route.params);
    console.log('PillScreen - Medication object:', medication);

    const formatTime = (times) => {
        if (!times || times.length === 0) return '--:--';
        return times.map(t => {
            const time = t.time instanceof Date ? t.time : new Date(t.time);
            return `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`;
        }).join(', ');
    };

    const navigateToEdit = () => {
        console.log('PillScreen - Navigating to EditMedication with medication:', medication);
        console.log('Medication ID:', medication?.id);
        console.log('Medication Name:', medication?.name);
        navigation.navigate('EditMedication', { medication });
    };

    if (!medication) {
        console.log('PillScreen - No medication data received');
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.container}>
                    <Text style={styles.title}>Error: No medication data</Text>
                    <Text style={styles.errorText}>Medication data was not passed correctly.</Text>
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('Main')}>
                        <Text style={styles.backButtonText}>Go Back</Text>
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

                <Text style={styles.title}>Medication Details</Text>

                {/* Pill Card Visual */}
                <View style={styles.pillCard}>
                    <View style={styles.colorBarContainer}>
                        <View style={styles.whiteHalf} />
                        <View style={[styles.colorHalf, { backgroundColor: medication.color || '#4e73df' }]} />
                    </View>
                    
                    <View style={styles.detailsContainer}>
                        <Text style={styles.pillName}>{medication.name}</Text>
                        {medication.dosage && <Text style={styles.pillDosage}>{medication.dosage}</Text>}
                        {medication.note && <Text style={styles.pillNote}>{medication.note}</Text>}
                        <Text style={styles.pillTimes}>Times: {formatTime(medication.times)}</Text>
                    </View>
                </View>

                {/* Edit Button */}
                <TouchableOpacity style={styles.editButton} onPress={navigateToEdit}>
                    <Text style={styles.editButtonText}>Edit Medication</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#f8f9fa' },
    container: { flex: 1, backgroundColor: '#f8f9fa', padding: 20 },
    backButton: {
        backgroundColor: '#6c757d',
        padding: 12,
        borderRadius: 10,
        marginBottom: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    backButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        marginBottom: 24,
        textAlign: 'center',
        color: '#2d3748',
        letterSpacing: -0.5,
    },
    errorText: {
        fontSize: 16,
        color: '#e53e3e',
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 22,
    },
    pillCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 20,
        marginBottom: 32,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
        elevation: 5,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.8)',
    },
    colorBarContainer: {
        width: 12,
        height: 80,
        borderRadius: 6,
        marginRight: 16,
        overflow: 'hidden',
    },
    whiteHalf: {
        flex: 1,
        backgroundColor: '#fff',
    },
    colorHalf: {
        flex: 1,
    },
    detailsContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    pillName: {
        fontSize: 22,
        fontWeight: '700',
        color: '#2d3748',
        marginBottom: 8,
        letterSpacing: -0.3,
    },
    pillDosage: {
        fontSize: 18,
        color: '#4a5568',
        fontWeight: '600',
        marginBottom: 6,
    },
    pillNote: {
        fontSize: 16,
        color: '#718096',
        marginBottom: 8,
        lineHeight: 22,
    },
    pillTimes: {
        fontSize: 15,
        color: '#4a5568',
        fontWeight: '500',
    },
    editButton: {
        backgroundColor: '#007AFF',
        padding: 18,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 28,
        shadowColor: '#007AFF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    editButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '600',
        letterSpacing: 0.3,
    },
});
