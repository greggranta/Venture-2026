import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [expoPushToken, setExpoPushToken] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    if (!user) return;

    registerForPushNotificationsAsync().then((token) => {
      if (token) {
        setExpoPushToken(token);
        savePushToken(user.id, token);
      }
    });

    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      setUnreadCount((prev) => prev + 1);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      // Handle notification tap - navigate to relevant screen
      const data = response.notification.request.content.data;
      if (data?.session_id) {
        // Navigation handled in AppNavigator
      }
    });

    fetchUnreadCount(user.id);

    // Subscribe to real-time notifications
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          setUnreadCount((prev) => prev + 1);
        }
      )
      .subscribe();

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
      supabase.removeChannel(channel);
    };
  }, [user]);

  async function registerForPushNotificationsAsync() {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#0066FF',
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') return null;

    const token = (await Notifications.getExpoPushTokenAsync({ projectId: '94921410-6f6f-4a2d-83cc-c8cbbac3d7aa' })).data;
    return token;
  }

  async function savePushToken(userId, token) {
    await supabase.from('users').update({ fcm_token: token }).eq('id', userId);
  }

  async function fetchUnreadCount(userId) {
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false);

    setUnreadCount(count || 0);
  }

  function markRead() {
    setUnreadCount(0);
  }

  return (
    <NotificationContext.Provider value={{ expoPushToken, unreadCount, markRead }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
