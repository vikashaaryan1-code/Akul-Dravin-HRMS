import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { Animated, StyleSheet, Text, View, Easing } from 'react-native';
import { notificationSocket, NotificationPayload } from '../services/notificationSocket';

type NotificationContextType = {
  // We can add manual trigger methods if needed, but primarily this just listens
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const [activeNotification, setActiveNotification] = useState<NotificationPayload | null>(null);
  const slideAnim = useRef(new Animated.Value(-150)).current;

  useEffect(() => {
    notificationSocket.connect();

    const unsubscribe = notificationSocket.addListener((notification) => {
      setActiveNotification(notification);
      
      // Animate in
      Animated.timing(slideAnim, {
        toValue: 50, // slide down to top: 50
        duration: 300,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }).start();

      // Auto dismiss after 4 seconds
      setTimeout(() => {
        Animated.timing(slideAnim, {
          toValue: -150,
          duration: 300,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }).start(() => setActiveNotification(null));
      }, 4000);
    });

    return () => {
      unsubscribe();
      notificationSocket.disconnect();
    };
  }, [slideAnim]);

  return (
    <NotificationContext.Provider value={{}}>
      {children}
      {/* Toast Overlay */}
      {activeNotification && (
        <Animated.View
          style={[
            styles.toastContainer,
            { transform: [{ translateY: slideAnim }] }
          ]}
        >
          <View style={styles.toastContent}>
            <View style={styles.iconContainer}>
              <Text style={styles.iconText}>🔔</Text>
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.title} numberOfLines={1}>{activeNotification.title}</Text>
              <Text style={styles.message} numberOfLines={2}>{activeNotification.message}</Text>
            </View>
          </View>
        </Animated.View>
      )}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    zIndex: 9999,
  },
  toastContent: {
    flexDirection: 'row',
    backgroundColor: 'rgba(30, 41, 59, 0.95)', // slate-800
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(99, 102, 241, 0.2)', // indigo tinted
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 18,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
    marginBottom: 4,
  },
  message: {
    color: '#94a3b8', // slate-400
    fontSize: 13,
    lineHeight: 18,
  }
});
