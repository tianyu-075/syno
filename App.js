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

      const { status, canAskAgain } = await Notifications.getPermissionsAsync();
      console.log('Notification permission status:', status);

      if (status !== 'granted') {
        if (canAskAgain) {
          console.log('Requesting permissions...');
          const { status: newStatus } =
            await Notifications.requestPermissionsAsync();
          console.log('New permission status:', newStatus);
        } else {
          Alert.alert(
            'Notifications disabled',
            'Please enable notifications manually in Settings.'
          );
        }
      }

      if (Platform.OS === 'android') {
        console.log('Setting Android notification channel');
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Medication Reminders',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
        console.log('Android channel set');
      }

      console.log('Notification setup complete');
    }

    setupNotifications();

    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log('📬 Notification received:', notification);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log(
          '🔔 User tapped notification:',
          response.notification.request.content
        );
      });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(
          notificationListener.current
        );
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
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
