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

    const formatTime = (times) => {
        if (!times || times.length === 0) return '--:--';
        return times.map(t => {
            const time = t.time instanceof Date ? t.time : new Date(t.time);
            return `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`;
        }).join(', ');
    };

    const navigateToEdit = () => {
        navigation.navigate('EditMedication', { medication });
    };

    if (!medication) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.container}>
                    <Text style={styles.title}>Error: No medication data</Text>
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('Home')}>
                        <Text style={styles.backButtonText}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView style={styles.container}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('Home')}>
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
    safeArea: { flex: 1, backgroundColor: '#fff' },
    container: { flex: 1, backgroundColor: '#fff', padding: 20 },
    backButton: {
        backgroundColor: '#6c757d',
        padding: 10,
        borderRadius: 8,
        marginBottom: 20,
        alignItems: 'center',
    },
    backButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    title: { 
        fontSize: 24, 
        fontWeight: 'bold', 
        marginBottom: 20,
        textAlign: 'center',
        color: '#333'
    },
    pillCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 16,
        marginBottom: 30,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#e0e0e0',
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
    },
    pillName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    pillDosage: {
        fontSize: 16,
        color: '#5a7dda',
        fontWeight: '600',
        marginBottom: 4,
    },
    pillNote: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    pillTimes: {
        fontSize: 14,
        color: '#888',
        fontWeight: '500',
    },
    editButton: {
        backgroundColor: '#007AFF',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 20,
    },
    editButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '600',
    },
});
