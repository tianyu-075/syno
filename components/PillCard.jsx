import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';

const screenWidth = Dimensions.get('window').width;

const PillCard = ({ medication, onEdit }) => {


  const handleEdit = () => {
    console.log('PillCard edit pressed for:', medication.name);
    if (onEdit) {
      onEdit(medication);
    }
  };


  const formatTime = (times) => {
    if (!times || times.length === 0) return '--:--';
    return times.map(t => {
      const time = t.time instanceof Date ? t.time : new Date(t.time);
      return `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`;
    }).join(', ');
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handleEdit}
      activeOpacity={0.7}
      testID={`medication-card-${medication.id}`}
    >
 
      <View style={[styles.colorBar, { backgroundColor: medication.color || '#4e73df' }]} />


      <View style={styles.center}>
        <Text style={styles.name}>{medication.name}</Text>
        <Text style={styles.note}>{medication.note || 'No notes'}</Text>
      </View>


      <View style={styles.right}>
        <Text style={styles.dosage}>{medication.dosage || ''}</Text>
        <Text style={styles.times}>{formatTime(medication.times)}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    width: screenWidth * 0.92,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginVertical: 8,
    marginHorizontal: screenWidth * 0.04,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 2,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  colorBar: {
    width: 8,
    height: '100%',
    borderRadius: 4,
    marginRight: 14,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
  },
  note: {
    fontSize: 13,
    color: '#777',
    marginTop: 3,
  },
  right: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  dosage: {
    fontSize: 15,
    color: '#5a7dda',
    fontWeight: '600',
  },
  times: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
    textAlign: 'right',
  },
});


export default PillCard;
