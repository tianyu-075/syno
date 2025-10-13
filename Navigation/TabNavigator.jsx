import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import MedicationsScreen from '../screens/MedicationsScreen';
import MyPageScreen from '../screens/MyPageScreen';


const Tab = createBottomTabNavigator();


export default function TabNavigator() {
return (
<Tab.Navigator screenOptions={{ headerShown: false }}>
<Tab.Screen name="Home" component={HomeScreen} />
<Tab.Screen name="Medications" component={MedicationsScreen} />
<Tab.Screen name="MyPage" component={MyPageScreen} />
</Tab.Navigator>
);
}