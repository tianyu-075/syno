import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function PillScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const [currentMedication, setCurrentMedication] = useState(route.params?.medication || null);

  useEffect(() => {
    const refreshMedicationData = async () => {
      if (currentMedication?.id) {
        try {
          const meds = await AsyncStorage.getItem('medications');
          if (meds) {
            const medicationsArray = JSON.parse(meds);
            const updatedMed = medicationsArray.find(m => m.id === currentMedication.id);
            if (updatedMed) setCurrentMedication(updatedMed);
          }
        } catch (e) {
          console.warn('Failed to refresh medication data', e);
        }
      }
    };

    const unsubscribe = navigation.addListener('focus', refreshMedicationData);
    return unsubscribe;
  }, [navigation, currentMedication?.id]);

  const formatTime = (times) => {
    if (!times || times.length === 0) return '--:--';

    // Sort times from smallest to largest (0-24 hour format)
    const sortedTimes = times.sort((a, b) => {
      const timeA = a.time instanceof Date ? a.time : new Date(a.time);
      const timeB = b.time instanceof Date ? b.time : new Date(b.time);

      const hourA = timeA.getHours();
      const hourB = timeB.getHours();

      // First sort by hour
      if (hourA !== hourB) {
        return hourA - hourB;
      }

      // If hours are equal, sort by minute
      return timeA.getMinutes() - timeB.getMinutes();
    });

    // Format the sorted times
    return sortedTimes.map(t => {
      const time = t.time instanceof Date ? t.time : new Date(t.time);
      return `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`;
    }).join(', ');
  };

  const navigateToEdit = () => {
    navigation.navigate('EditMedication', { medication: currentMedication });
  };

  if (!currentMedication) {
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
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('Main')}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Medication</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Pill & Name */}
        <View style={styles.pillRow}>
          <View style={styles.colorBarContainer}>
            <View style={styles.whiteHalf} />
            <View style={[styles.colorHalf, { backgroundColor: currentMedication.color || '#4e73df' }]} />
          </View>

          <View style={styles.nameContainer}>
            <Text style={styles.nameLabel}>Name</Text>
            <Text style={styles.pillName}>{currentMedication.name}</Text>
            
          </View>
        </View>


        <View style={styles.infoLine}>
        {currentMedication.dosage && (
              <>
          <Text style={styles.infoLabel}>Dosage</Text>
                <Text style={styles.infoValue}>{currentMedication.dosage}</Text>
              </>
            )}
            </View>

        {/* Time */}
        <View style={styles.infoLine}>
          <Text style={styles.infoLabel}>Time</Text>
          <Text style={styles.infoValue}>{formatTime(currentMedication.times)}</Text>
        </View>

        {/* Note */}
        {currentMedication.note && (
          <View style={styles.infoLine}>
            <Text style={styles.infoLabel}>Note</Text>
            <Text style={styles.infoValue}>{currentMedication.note}</Text>
          </View>
        )}

        {/* Edit Button */}
        <TouchableOpacity style={styles.editButton} onPress={navigateToEdit}>
          <Text style={styles.editButtonText}>Edit Medication</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f2f4f7',
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 40,
    marginTop: 10,
  },
  backButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  backButtonText: {
    fontSize: 20,
    color: '#555',
    fontWeight: '700',
  },
  placeholder: { width: 42 },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#222',
    textAlign: 'center',
    flex: 1,
  },

  /** —— pill and name —— */
  pillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:'space-between',
    padding: 20,
    marginLeft: 50,
    marginBottom: 40,
    elevation: 2,
  },
  colorBarContainer: {
    width: 40,
    height: 100,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: '#bbb',
    overflow: 'hidden',
    flexDirection: 'column',
    marginRight: 18,
  },
  whiteHalf: {
    flex: 1,
    backgroundColor: '#fff',
  },
  colorHalf: {
    flex: 1,
  },
  nameContainer: {
    marginLeft: 40,
    flex: 1,
  },
  nameLabel: {
    fontSize: 15,
    color: '#6b7280',
    marginBottom: 4,
    fontWeight: '500',
  },
  pillName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 10,
  },
  dosageLabel: {
    fontSize: 15,
    color: '#6b7280',
    marginBottom: 4,
    fontWeight: '500',
  },
  pillDosage: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4e73df',
  },

  /** —— info section —— */
  infoLine: {
    marginBottom: 22,
  },
  infoLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 6,
  },
  infoValue: {
    fontSize: 18,
    color: '#111827',
    lineHeight: 26,
    fontWeight: '500',
  },

  /** —— button —— */
  editButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 60,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  editButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
