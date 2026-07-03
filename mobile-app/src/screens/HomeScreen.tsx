import React from 'react';
import { StyleSheet, Text, View, Button } from 'react-native';
import { GlassCard } from '../components/ui/GlassCard';

export const HomeScreen = ({ navigation }: any) => {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Welcome, Rahul</Text>
      <GlassCard style={styles.card}>
        <Text style={styles.cardTitle}>Quick Actions</Text>
        <View style={styles.actionRow}>
          <Button title="Clock In" onPress={() => navigation.navigate('Attendance')} />
          <Button title="Timesheets" onPress={() => navigation.navigate('Timesheets')} />
          <Button title="Vault" onPress={() => navigation.navigate('Documents')} />
        </View>
      </GlassCard>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    padding: 20,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    marginTop: 40,
  },
  card: {
    marginBottom: 20,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
