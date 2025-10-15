import React from 'react';
import { View, Text, StyleSheet } from 'react-native';



export default function MyPageScreen() {





  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Page</Text>
    
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  }
});