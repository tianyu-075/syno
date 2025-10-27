import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { createStackNavigator } from '@react-navigation/stack';
import TabNavigator from './Navigation/TabNavigator';
import EditMedicationScreen from './screens/EditMedicationScreen';
import PillScreen from './screens/PillScreen';
import UserPicture from './screens/UserPicture';
import * as Notifications from 'expo-notifications';
import { Platform, StatusBar } from 'react-native';

const Stack = createStackNavigator();

Notifications.setNotificationHandler({
  handleNotification: async () => {
    const options = {
      shouldShowBanner: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    };
    console.log('Notification handler options:', options, {
      shouldShowBanner: typeof options.shouldShowBanner,
      shouldPlaySound: typeof options.shouldPlaySound,
      shouldSetBadge: typeof options.shouldSetBadge,
    });
    return options;
  },
});

export default function App() {
  console.log('App component starting');
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    async function setupNotifications() {
      console.log('Starting notification setup');
      const { status } = await Notifications.getPermissionsAsync();
      console.log('Notification permissions status:', status, typeof status);
      if (status !== 'granted') {
        console.log('Requesting permissions');
        await Notifications.requestPermissionsAsync();
        console.log('Permissions requested');
      }

      if (Platform.OS === 'android') {
        console.log('Setting Android notification channel');
        await Notifications.setNotificationChannelAsync('meds', {
          name: 'Medication Reminders',
          importance: Notifications.AndroidImportance.HIGH,
        });
        console.log('Android channel set');
      }
      console.log('Notification setup complete');
    }

    setupNotifications();

    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log('Notification received:', notification);
        if (notification.request.trigger) {
          console.log(
            'Notification request trigger:',
            notification.request.trigger,
            {
              triggerTypes: {
                hour: typeof notification.request.trigger.hour,
                minute: typeof notification.request.trigger.minute,
                repeats: typeof notification.request.trigger.repeats,
              },
            }
          );
        } else {
          console.log('Notification trigger is null');
        }
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log(
          'Notification response:',
          response.notification.request.content
        );
      });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

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
