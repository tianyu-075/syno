// import React, { useState, useEffect } from 'react';
// import { Text } from 'react-native';

// export default function TypewriterText({
//   content = '',
//   speed = 50,
//   style,
//   onTypingEnd = () => {},
// }) {
//   const [displayed, setDisplayed] = useState('');

//   useEffect(() => {
//     let current = '';
//     let i = 0;

//     const timer = setInterval(() => {
//       current += content.charAt(i);
//       setDisplayed(current);
//       i++;
//       if (i >= content.length) {
//         clearInterval(timer);
//         onTypingEnd();
//       }
//     }, speed);

//     return () => clearInterval(timer);
//   }, [content, speed]);

//   return <Text style={style}>{displayed}</Text>;
// }