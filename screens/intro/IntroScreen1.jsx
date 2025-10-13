// import React, { useEffect, useState } from 'react';
// import { View, Text, StyleSheet, TouchableWithoutFeedback, Image } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';

// export default function IntroScreen1() {
//   const [displayText, setDisplayText] = useState('');
//   const [showFullText, setShowFullText] = useState(false);

//   const text = "Welcome to Syno";
//   const subtitle = "Simplify your health journey — calm, organized, and always on time.";

//   useEffect(() => {
//     if (showFullText) return;

//     let i = 0;
//     const interval = setInterval(() => {
//       if (i < text.length) {
//         setDisplayText(text.slice(0, i + 1));
//         i++;
//       } else {
//         clearInterval(interval);
//         setTimeout(() => setShowFullText(true), 500); 
//       }
//     }, 100);

//     return () => clearInterval(interval);
//   }, [showFullText]);

//   const handlePress = () => {
//     setDisplayText(text);
//     setShowFullText(true);
//   };

//   return (
//     <TouchableWithoutFeedback onPress={handlePress}>
//       <SafeAreaView style={styles.container}>
//         <Image
//           source={require('../../assets/introscreen1.png')}
//           style={styles.image}
//           resizeMode="contain"
//         />
//         <Text style={styles.title}>{displayText}</Text>
//         {showFullText && <Text style={styles.subtitle}>{subtitle}</Text>}
//       </SafeAreaView>
//     </TouchableWithoutFeedback>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#E8F1F8', 
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingHorizontal: 24,
//   },
//   image: {
//     width: 250,
//     height: 250,
//     marginBottom: 30,
//   },
//   title: {
//     fontSize: 28,
//     fontWeight: '700',
//     color: '#3A7CA5', 
//     marginBottom: 12,
//   },
//   subtitle: {
//     fontSize: 16,
//     color: '#6B7280',
//     textAlign: 'center',
//     lineHeight: 22,
//     maxWidth: 300,
//   },
// });
