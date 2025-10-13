import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import TabNavigator from './Navigation/TabNavigator';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar'



Notifications.setNotificationHandler({
handleNotification: async () => ({
shouldShowAlert: true,
shouldPlaySound: true,
shouldSetBadge: false,
}),
});

export default function App() {
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    async function setupNotifications() {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        await Notifications.requestPermissionsAsync();
      }

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('meds', {
          name: 'Medication Reminders',
          importance: Notifications.AndroidImportance.HIGH,
        });
      }
    }

    setupNotifications();

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('gotcha', notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('pressed', response.notification.request.content);
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener.current);
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);


return (
<NavigationContainer>
<TabNavigator />
<StatusBar style="auto" />
</NavigationContainer>

);
}