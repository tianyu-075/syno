import React, { useRef, useState } from 'react';
import { Animated, PanResponder, StyleSheet, Text, TouchableOpacity, View, Alert, Dimensions } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

const SwipeablePillCard = ({ medication, onEdit, onDelete, children }) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const [isOpen, setIsOpen] = useState(false);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Only respond to horizontal swipes
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 10;
      },
      onPanResponderMove: (evt, gestureState) => {
        // Only allow swiping left (negative X)
        if (gestureState.dx < 0) {
          const newX = Math.max(gestureState.dx, -100); // Limit swipe distance
          translateX.setValue(newX);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        const threshold = -50; // Minimum swipe distance to trigger

        if (gestureState.dx < threshold) {
          // Swipe enough - open delete button
          Animated.spring(translateX, {
            toValue: -80,
            useNativeDriver: true,
            tension: 100,
            friction: 8,
          }).start();
          setIsOpen(true);
        } else {
          // Not enough swipe - close
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            tension: 100,
            friction: 8,
          }).start();
          setIsOpen(false);
        }
      },
    })
  ).current;

  const closeSwipe = () => {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
    setIsOpen(false);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Medication',
      `Are you sure you want to delete ${medication.name}?`,
      [
        { text: 'Cancel', onPress: closeSwipe },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            onDelete(medication.id);
            closeSwipe();
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Hidden delete area (revealed on swipe) */}
      <View style={styles.hiddenArea}>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDelete}
        >
          <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
      </View>

      {/* Main content */}
      <Animated.View
        style={[
          styles.content,
          {
            transform: [{ translateX }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        {/* Invisible overlay that closes swipe when tapped */}
        {isOpen && (
          <TouchableOpacity
            style={styles.overlay}
            onPress={closeSwipe}
            activeOpacity={1}
          />
        )}

        {/* Actual content */}
        <TouchableOpacity
          style={styles.touchableContent}
          onPress={() => onEdit(medication)}
          activeOpacity={0.7}
        >
          {children}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    marginVertical: 8,
  },
  hiddenArea: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 80,
    backgroundColor: '#dc3545',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    zIndex: 1,
  },
  deleteButton: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 2,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 3,
  },
  touchableContent: {
    padding: 16,
  },
});

export default SwipeablePillCard;