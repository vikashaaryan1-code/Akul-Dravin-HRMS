import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { timesheetService } from '../services/api';

export const TimesheetScreen = () => {
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [project, setProject] = useState('');
  const [hours, setHours] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [logs, setLogs] = useState<any[]>([]);
  const [weekDays, setWeekDays] = useState<{ day: string; date: string; fullDate: string }[]>([]);

  useEffect(() => {
    // Generate current week dates
    const curr = new Date();
    const week = [];
    
    // Start from Monday
    const first = curr.getDate() - curr.getDay() + (curr.getDay() === 0 ? -6 : 1); 
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(curr.setDate(first + i));
      week.push({
        day: day.toLocaleDateString('en-US', { weekday: 'short' }),
        date: day.getDate().toString(),
        fullDate: day.toISOString().split('T')[0] // YYYY-MM-DD
      });
    }
    setWeekDays(week);
  }, []);

  const handleAddLog = async () => {
    if (!project || !hours) {
      Alert.alert('Validation Error', 'Please enter both project name and hours.');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const activeDate = weekDays[activeDayIndex];
      const res = await timesheetService.submitLog(project, parseFloat(hours), notes, activeDate.fullDate);
      
      setLogs([{
        id: res.data?.data?.id || Date.now().toString(),
        day: activeDate.day,
        date: activeDate.date,
        project,
        hours,
        notes
      }, ...logs]);

      setProject('');
      setHours('');
      setNotes('');
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.message || 'Failed to submit timesheet');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitWeek = () => {
    Alert.alert('Timesheet Submitted', 'Your timesheet for this week has been sent to your manager for approval.');
    setLogs([]);
  };

  if (weekDays.length === 0) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#38bdf8" />
      </View>
    );
  }

  const currentWeekLabel = `Week of ${weekDays[0].day} ${weekDays[0].date} - ${weekDays[6].day} ${weekDays[6].date}`;

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.header}>
          <Text style={styles.title}>Timesheets</Text>
          <Text style={styles.subtitle}>{currentWeekLabel}</Text>
        </View>

        {/* Week Carousel */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.carousel}>
          {weekDays.map((item, idx) => {
            const isActive = activeDayIndex === idx;
            return (
              <TouchableOpacity 
                key={idx} 
                style={[styles.dayCard, isActive && styles.dayCardActive]}
                onPress={() => setActiveDayIndex(idx)}
              >
                <Text style={[styles.dayText, isActive && styles.dayTextActive]}>{item.day}</Text>
                <Text style={[styles.dateText, isActive && styles.dateTextActive]}>{item.date}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Entry Form */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Log Hours for {weekDays[activeDayIndex].day}, {weekDays[activeDayIndex].date}</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Project Name (e.g. Project Delta)"
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={project}
            onChangeText={setProject}
          />

          <TextInput
            style={styles.input}
            placeholder="Hours (e.g. 4.5)"
            placeholderTextColor="rgba(255,255,255,0.4)"
            keyboardType="numeric"
            value={hours}
            onChangeText={setHours}
          />

          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Notes (optional)"
            placeholderTextColor="rgba(255,255,255,0.4)"
            multiline
            numberOfLines={3}
            value={notes}
            onChangeText={setNotes}
          />

          <TouchableOpacity 
            style={styles.addButton} 
            onPress={handleAddLog}
            disabled={isSubmitting}
          >
            {isSubmitting ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.addButtonText}>ADD ENTRY</Text>}
          </TouchableOpacity>
        </View>

        {/* Log History */}
        <View style={styles.historySection}>
          <Text style={styles.historyTitle}>Recent Entries</Text>
          
          {logs.length === 0 ? (
            <Text style={styles.emptyText}>No hours logged yet.</Text>
          ) : (
            logs.map(log => (
              <View key={log.id} style={styles.logCard}>
                <View>
                  <Text style={styles.logProject}>{log.project}</Text>
                  <Text style={styles.logMeta}>{log.day}, {log.date} • {log.notes || 'No notes'}</Text>
                </View>
                <View style={styles.hoursBadge}>
                  <Text style={styles.hoursText}>{log.hours}h</Text>
                </View>
              </View>
            ))
          )}
        </View>

      </ScrollView>

      {/* Footer Submit */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmitWeek}>
          <Text style={styles.submitButtonText}>SUBMIT TIMESHEET</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100, // Make room for footer
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
  },
  carousel: {
    flexGrow: 0,
    marginBottom: 24,
  },
  dayCard: {
    width: 60,
    height: 70,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  dayCardActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
    borderColor: '#38bdf8',
  },
  dayText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    fontWeight: '700',
    marginBottom: 4,
  },
  dayTextActive: {
    color: '#38bdf8',
  },
  dateText: {
    fontSize: 18,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
  },
  dateTextActive: {
    color: '#fff',
  },
  formCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 32,
  },
  formTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#38bdf8',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  input: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    marginBottom: 12,
    fontSize: 14,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  addButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 1,
  },
  historySection: {
    marginBottom: 40,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.4)',
    fontStyle: 'italic',
  },
  logCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#38bdf8',
  },
  logProject: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  logMeta: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
  },
  hoursBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  hoursText: {
    color: '#38bdf8',
    fontWeight: '700',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 40, // extra for safe area
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  submitButton: {
    backgroundColor: '#38bdf8',
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#38bdf8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  submitButtonText: {
    color: '#0f172a',
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 2,
  },
});
