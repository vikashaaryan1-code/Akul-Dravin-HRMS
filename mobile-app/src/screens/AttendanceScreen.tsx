import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Animated, PanResponder, Dimensions, Alert } from 'react-native';
import { GlassCard } from '../components/ui/GlassCard';
import { attendanceService } from '../services/api';

const SWIPE_WIDTH = Dimensions.get('window').width - 80;
const SWIPE_THRESHOLD = SWIPE_WIDTH - 60; // Button width is ~60

export const AttendanceScreen = () => {
  const [time, setTime] = useState(new Date());
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [location, setLocation] = useState('Fetching GPS...');
  
  const pan = useRef(new Animated.ValueXY()).current;

  useEffect(() => {
    // Live clock
    const timer = setInterval(() => setTime(new Date()), 1000);
    
    // Simulate reverse-geocoded GPS fetch
    setTimeout(() => {
      setLocation('HQ - San Francisco, CA (Within Range)');
    }, 1500);

    return () => clearInterval(timer);
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !isProcessing,
      onPanResponderMove: Animated.event([null, { dx: pan.x }], {
        useNativeDriver: false, // PanResponder requires false for JS-driven width bounds
      }),
      onPanResponderRelease: (e, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) {
          // Successfully Swiped
          handleSwipeAction();
        } else {
          // Snap back
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  const handleSwipeAction = async () => {
    setIsProcessing(true);
    
    try {
      if (isCheckedIn) {
        await attendanceService.punchOut();
        setIsCheckedIn(false);
      } else {
        // We pass the simulated location to the backend
        await attendanceService.punchIn(undefined, undefined, location);
        setIsCheckedIn(true);
      }
    } catch (error: any) {
      console.error('Attendance Error:', error);
      Alert.alert('Error', error?.response?.data?.message || 'Failed to record attendance');
    } finally {
      setIsProcessing(false);
      // Reset slider position
      Animated.timing(pan, {
        toValue: { x: 0, y: 0 },
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  };

  const formattedTime = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const formattedDate = time.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Daily Attendance</Text>
      
      <GlassCard style={styles.card}>
        <View style={styles.clockContainer}>
          <Text style={styles.timeText}>{formattedTime}</Text>
          <Text style={styles.dateText}>{formattedDate}</Text>
        </View>

        <View style={styles.locationBox}>
          <Text style={styles.locationLabel}>CURRENT LOCATION</Text>
          <Text style={styles.locationText}>{location}</Text>
        </View>

        <View style={styles.statusBox}>
          <Text style={styles.statusLabel}>STATUS</Text>
          <Text style={[styles.statusText, { color: isCheckedIn ? '#10b981' : '#f59e0b' }]}>
            {isCheckedIn ? 'Currently Checked In' : 'Not Checked In'}
          </Text>
        </View>

        {/* Swipe to Action Slider */}
        <View style={styles.sliderContainer}>
          <Text style={styles.sliderBackgroundText}>
            {isProcessing 
              ? 'Processing...' 
              : isCheckedIn 
                ? 'Swipe to Check-Out →' 
                : 'Swipe to Check-In →'
            }
          </Text>
          
          <Animated.View
            {...panResponder.panHandlers}
            style={[
              styles.sliderThumb,
              {
                backgroundColor: isCheckedIn ? '#ef4444' : '#10b981',
                transform: [
                  { 
                    translateX: pan.x.interpolate({
                      inputRange: [0, SWIPE_WIDTH - 60],
                      outputRange: [0, SWIPE_WIDTH - 60],
                      extrapolate: 'clamp'
                    }) 
                  }
                ]
              }
            ]}
          >
            <View style={styles.thumbArrow} />
          </Animated.View>
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
    justifyContent: 'center',
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 30,
    textAlign: 'center',
  },
  card: {
    padding: 24,
    minHeight: 400,
    justifyContent: 'space-between',
  },
  clockContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  timeText: {
    color: '#fff',
    fontSize: 54,
    fontWeight: '200',
    fontVariant: ['tabular-nums'],
    letterSpacing: 2,
  },
  dateText: {
    color: '#94a3b8',
    fontSize: 16,
    marginTop: 8,
  },
  locationBox: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  locationLabel: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 4,
  },
  locationText: {
    color: '#fff',
    fontSize: 14,
  },
  statusBox: {
    alignItems: 'center',
    marginBottom: 40,
  },
  statusLabel: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  sliderContainer: {
    height: 60,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 30,
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  sliderBackgroundText: {
    position: 'absolute',
    width: '100%',
    textAlign: 'center',
    color: 'rgba(255,255,255,0.4)',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 1,
  },
  sliderThumb: {
    position: 'absolute',
    left: 4,
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  thumbArrow: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderTopWidth: 6,
    borderBottomWidth: 6,
    borderLeftWidth: 10,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: '#fff',
    marginLeft: 4,
  }
});
