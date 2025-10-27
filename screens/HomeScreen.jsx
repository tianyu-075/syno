import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SwipeListView } from 'react-native-swipe-list-view';
import PillCard from '../components/PillCard';
import * as Notifications from 'expo-notifications';

export default function HomeScreen() {
  const navigation = useNavigation();
  const [medications, setMedications] = useState([]);
  const [openRowKey, setOpenRowKey] = useState(null);
  const [userName, setUserName] = useState('');
  const [profilePicture, setProfilePicture] = useState('');
  const swipeListRef = useRef(null);

  const loadMedications = async () => {
    try {
      const meds = await AsyncStorage.getItem('medications');
      if (meds) {
        setMedications(JSON.parse(meds));
      } else {
        setMedications([]);
      }
    } catch (e) {
      console.warn('Failed loading medications', e);
      setMedications([]);
    }
  };

  const loadUserData = async () => {
    try {
      const savedName = await AsyncStorage.getItem('userName');
      const savedPicture = await AsyncStorage.getItem('profilePicture');
      if (savedName) setUserName(savedName);
      if (savedPicture) setProfilePicture(savedPicture);
    } catch (e) {
      console.warn('Failed loading user data', e);
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
              const medToDelete = medications.find(
                (med) => med.id === medicationId
              );
              if (medToDelete?.times) {
                for (const t of medToDelete.times) {
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
              }
              const updatedMeds = medications.filter(
                (med) => med.id !== medicationId
              );
              await AsyncStorage.setItem(
                'medications',
                JSON.stringify(updatedMeds)
              );
              setMedications(updatedMeds);
              Alert.alert('Success', 'Medication deleted successfully');
            } catch (e) {
              console.warn('Failed to delete medication', e);
              Alert.alert('Error', 'Failed to delete medication');
            }
          },
        },
      ]
    );
  };

  useEffect(() => {
    loadMedications();
    loadUserData();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadMedications();
      loadUserData();
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

  return (
    <SafeAreaView style={styles.safeArea}>
      {medications.length === 0 ? (
        <View style={styles.container}>
          <View style={styles.userSection}>
            <Image
              source={{
                uri:
                  profilePicture ||
                  'https://cdn-icons-png.flaticon.com/512/847/847969.png',
              }}
              style={styles.profileImage}
            />
            <View style={styles.greetingSection}>
              <Text style={styles.title}>
                {userName ? `Hi, ${userName}` : 'Welcome to Syno'}
              </Text>
              <Text style={styles.subtitle}>
                Your medication management app
              </Text>
            </View>
          </View>
          <Text style={styles.noMedications}>
            No medications added yet.{'\n'}Go to the Medications tab to add
            some!
          </Text>
        </View>
      ) : (
        <SwipeListView
          ref={swipeListRef}
          data={medications}
          keyExtractor={(item, index) => item.id?.toString() ?? `temp-${index}`}
          ListHeaderComponent={
            <View style={styles.header}>
              <View style={styles.userSection}>
                <Image
                  source={{
                    uri:
                      profilePicture ||
                      'https://cdn-icons-png.flaticon.com/512/847/847969.png',
                  }}
                  style={styles.profileImage}
                />
                <View style={styles.greetingSection}>
                  <Text style={styles.title}>
                    {userName ? `Hi, ${userName}` : 'Welcome to Syno'}
                  </Text>
                  <Text style={styles.subtitle}>
                    Your medication management app
                  </Text>
                </View>
              </View>
            </View>
          }
          renderItem={({ item }) => (
            <PillCard
              medication={item}
              onEdit={() => {
                const serializableMedication = {
                  ...item,
                  times: item.times.map((t) => ({
                    ...t,
                    time:
                      t.time instanceof Date ? t.time.toISOString() : t.time,
                  })),
                };
                navigation.navigate('PillScreen', {
                  medication: serializableMedication,
                });
              }}
            />
          )}
          renderHiddenItem={renderHiddenItem}
          rightOpenValue={-80}
          disableRightSwipe
          closeOnRowPress={true}
          closeOnScroll={true}
          onRowOpen={(rowKey) => setOpenRowKey(rowKey)}
          onRowClose={(rowKey) => {
            if (openRowKey === rowKey) setOpenRowKey(null);
          }}
          contentContainerStyle={styles.container}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { position: 'relative', marginVertical: 6 },
  safeArea: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },
  userSection: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 16,
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  greetingSection: { flex: 1 },
  title: { fontSize: 28, fontWeight: '700', color: '#333', marginBottom: 4 },
  subtitle: { fontSize: 16, color: '#666' },
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
    marginVertical: 8,
  },
  deleteButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
