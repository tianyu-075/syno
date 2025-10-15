import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import {useEffect, useState, useRef} from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SwipeListView } from 'react-native-swipe-list-view';
import PillCard from '../components/PillCard';




export default function HomeScreen() {
  const navigation = useNavigation();
  const [medications, setMedications] = useState([]);
  const [openRowKey, setOpenRowKey] = useState(null);
  const swipeListRef = useRef(null);

  const loadMedications = async () => {
    try {
      const medications = await AsyncStorage.getItem('medications');
      if (medications) {
        const medsArray = JSON.parse(medications);
        console.log('Loaded medications:', medsArray); // Debug log
        setMedications(medsArray);
      } else {
        console.log('No medications found in storage');
        setMedications([]);
      }
    } catch (e) {
      console.warn('Failed loading medications', e);
      setMedications([]);
    }
  };

  const handleRowPress = (medication) => {
    const rowKey = medication.id.toString();
    
    // If row is open, close it instead of navigating
    if (openRowKey === rowKey) {
      swipeListRef.current?.closeAllOpenRows();
      setOpenRowKey(null);
    } else {
      // Row is closed, navigate to edit
      console.log('Navigating to edit medication:', medication.name);
      navigation.navigate('EditMedication', { medication });
    }
  };

  const handleDeleteMedication = async (medicationId, medicationName) => {
    Alert.alert(
      'Delete Medication',
      `Are you sure you want to delete ${medicationName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedMeds = medications.filter(med => med.id !== medicationId);
              await AsyncStorage.setItem('medications', JSON.stringify(updatedMeds));
              setMedications(updatedMeds);
              Alert.alert('Success', 'Medication deleted successfully');
              console.log('Medication deleted, updated meds:', updatedMeds);
            } catch (e) {
              console.warn('Failed to delete medication', e);
              Alert.alert('Error', 'Failed to delete medication');
            }
          }
        }
      ]
    );
  };

  useEffect(() => {
    loadMedications();
  }, []);

  // Reload medications whenever the screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('HomeScreen focused - reloading medications');
      loadMedications();
    });

    return unsubscribe;
  }, [navigation]);

  const renderHiddenItem = (data) => (
    <View style={styles.rowBack}>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteMedication(data.item.id, data.item.name)}
      >
        <Text style={styles.deleteButtonText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

  const onRowOpen = (rowKey) => {
    setOpenRowKey(rowKey);
  };

  const onRowClose = (rowKey) => {
    if (openRowKey === rowKey) {
      setOpenRowKey(null);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {medications.length === 0 ? (
        <View style={styles.container}>
          <Text style={styles.title}>Welcome to Syno</Text>
          <Text style={styles.subtitle}>Your medication management app</Text>
          <Text style={styles.noMedications}>No medications added yet.{'\n'}Go to the Medications tab to add some!</Text>
        </View>
      ) : (
        <SwipeListView
          ref={swipeListRef}
          data={medications}
          keyExtractor={(item) => item.id.toString()}
          ListHeaderComponent={
            <View style={styles.header}>
              <Text style={styles.title}>Welcome to Syno</Text>
              <Text style={styles.subtitle}>Your medication management app</Text>
            </View>
          }
          renderItem={({ item }) => (
            <PillCard
              medication={item}
              onEdit={handleRowPress}
            />
          )}
          renderHiddenItem={renderHiddenItem}
          rightOpenValue={-80}
          disableRightSwipe
          closeOnRowPress={false}
          closeOnScroll={true}
          onRowOpen={onRowOpen}
          onRowClose={onRowClose}
          contentContainerStyle={styles.container}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    marginVertical: 6,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  noMedications: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 40,
    lineHeight: 24,
  },
  rowBack: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingRight: 15,
    marginVertical: 8,
  },
  deleteButton: {
    backgroundColor: '#dc3545',
    justifyContent: 'center',
    alignItems: 'center',
    width: 100,
    height: '100%',
    borderTopRightRadius: 16,
borderBottomRightRadius: 16,
borderTopLeftRadius: 0,
borderBottomLeftRadius: 0,
right:1,
    marginVertical: 8,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

  