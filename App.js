import React, { useEffect, useRef, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { createStackNavigator } from '@react-navigation/stack';
import { Platform, Alert, AppState } from 'react-native';
import * as Notifications from 'expo-notifications';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';

import TabNavigator from './Navigation/TabNavigator';
import EditMedicationScreen from './screens/EditMedicationScreen';
import PillScreen from './screens/PillScreen';
import UserPicture from './screens/UserPicture';

const Stack = createStackNavigator();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function App() {
  const [triggerDate, setTriggerDate] = useState(new Date(Date.now() + 60000));
  const notificationListener = useRef();
  const responseListener = useRef();
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    async function setupNotifications() {
      console.log('🔧 Checking notification permissions...');
      const { status: existingStatus, canAskAgain } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted' && canAskAgain) {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        Alert.alert(
          'Notifications Disabled',
          'Please enable notifications in system settings to receive reminders.'
        );
        return;
      }

      // ✅ Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Medication Reminders',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      console.log('🎉 Notification setup complete.');
      await syncStoredMedicationsNotifications();
    }

    setupNotifications();

    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log('📩 Notification received:', notification);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log(
          '👆 Notification tapped:',
          response.notification.request.content
        );
      });

    const handleAppStateChange = (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        console.log('App resumed — syncing notifications...');
        syncStoredMedicationsNotifications().catch((e) =>
          console.warn('Sync on resume failed', e)
        );
      }
      appState.current = nextAppState;
    };

    const sub = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      if (notificationListener.current) notificationListener.current.remove();
      if (responseListener.current) responseListener.current.remove();
      sub.remove();
    };
  }, []);

  const syncStoredMedicationsNotifications = async () => {
    try {
      const medsJson = await AsyncStorage.getItem('medications');
      if (!medsJson) {
        console.log('No stored medications to sync.');
        return;
      }

      let meds = JSON.parse(medsJson);
      if (!Array.isArray(meds)) meds = [];

      let changed = false;

      for (let mi = 0; mi < meds.length; mi++) {
        const med = meds[mi];
        if (!Array.isArray(med.times)) med.times = [];

        for (let ti = 0; ti < med.times.length; ti++) {
          const t = med.times[ti];
          let timeObj = null;

          if (t && t.time) {
            timeObj = t.time instanceof Date ? t.time : new Date(t.time);
            if (isNaN(timeObj)) timeObj = null;
          }
          if (!timeObj) continue;
          if (t.notificationId) continue;

          const hour = timeObj.getHours();
          const minute = timeObj.getMinutes();

          const trigger = {
            hour,
            minute,
            repeats: true,
          };

          try {
            const notificationId =
              await Notifications.scheduleNotificationAsync({
                content: {
                  title: 'Medication Reminder',
                  body: `${med.name || 'Medication'} ${med.dosage || ''} — ${med.note || ''}`,
                },
                trigger,
              });

            meds[mi].times[ti] = {
              ...t,
              notificationId,
              time: timeObj.toISOString(),
            };

            changed = true;
            console.log(
              `Scheduled ${med.name} at ${hour}:${minute} -> ID ${notificationId}`
            );
          } catch (err) {
            console.warn('Failed to schedule notification', err);
          }
        }
      }

      if (changed) {
        await AsyncStorage.setItem('medications', JSON.stringify(meds));
        console.log('✅ Notifications synced and saved.');
      } else {
        console.log('No new notifications to create.');
      }
    } catch (err) {
      console.warn('Error in syncStoredMedicationsNotifications', err);
    }
  };

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Main" component={TabNavigator} />
          <Stack.Screen
            name="EditMedication"
            component={EditMedicationScreen}
          />
          <Stack.Screen name="PillScreen" component={PillScreen} />
          <Stack.Screen name="UserPicture" component={UserPicture} />
        </Stack.Navigator>
        <StatusBar style="auto" />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
