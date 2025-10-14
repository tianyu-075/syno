import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';

const PillCard = ({ medication, onEdit, onDelete }) => {

  const handleEdit = () => {
    console.log('PillCard edit pressed for:', medication.name); // Debug log
    if (onEdit) {
      onEdit(medication);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      Alert.alert(
        'Delete Medication',
        `Are you sure you want to delete ${medication.name}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: () => onDelete(medication.id) }
        ]
      );
    }
  };

  const handleLongPress = () => {
    Alert.alert(
      'Medication Options',
      `What would you like to do with ${medication.name}?`,
      [
        { text: 'Edit', onPress: handleEdit },
        { text: 'Delete', style: 'destructive', onPress: handleDelete },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handleEdit}
      onLongPress={handleLongPress}
      activeOpacity={0.7}
      testID={`medication-card-${medication.id}`}
    >
      <View style={styles.header}>
        <Text style={styles.name}>{medication.name}</Text>
        <View style={[styles.colorBadge, { backgroundColor: medication.color || '#4e73df' }]} />
      </View>

      {medication.dosage && (
        <Text style={styles.dosage}>Dosage: {medication.dosage}</Text>
      )}

      {medication.note && (
        <Text style={styles.note}>{medication.note}</Text>
      )}

      {medication.times && medication.times.length > 0 && (
        <View style={styles.timesContainer}>
          <Text style={styles.timesLabel}>Times:</Text>
          <Text style={styles.times}>
            {medication.times.map(t => {
              const time = t.time instanceof Date ? t.time : new Date(t.time);
              return `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`;
            }).join(', ')}
          </Text>
        </View>
      )}

    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    marginVertical: 8,
    borderRadius: 12,
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  colorBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  dosage: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  note: {
    fontSize: 14,
    color: '#888',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  timesContainer: {
    marginTop: 4,
  },
  timesLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4e73df',
    marginBottom: 2,
  },
  times: {
    fontSize: 14,
    color: '#4e73df',
  },
});

export default PillCard;