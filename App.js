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
       <Stack.Screen name="EditMedication" component={EditMedicationScreen} />
       <Stack.Screen name="PillScreen" component={PillScreen} />
       <Stack.Screen name="UserPicture" component={UserPicture} />
     </Stack.Navigator>
     <StatusBar style="auto" />
   </NavigationContainer>
 </SafeAreaProvider>
);
}