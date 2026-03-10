import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View } from 'react-native';

import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { Colors } from '../constants/colors';

// Auth screens
import WelcomeScreen from '../screens/auth/WelcomeScreen';
import VerifyEmailScreen from '../screens/auth/VerifyEmailScreen';
import CreateProfileScreen from '../screens/auth/CreateProfileScreen';

// Main screens
import FeedScreen from '../screens/feed/FeedScreen';
import SessionDetailScreen from '../screens/feed/SessionDetailScreen';
import CategorySelectScreen from '../screens/post/CategorySelectScreen';
import PostSessionScreen from '../screens/post/PostSessionScreen';
import NotificationsScreen from '../screens/notifications/NotificationsScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import RatingScreen from '../screens/rating/RatingScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';

import LoadingScreen from '../components/LoadingScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabIcon({ name, focused, size = 22 }) {
  const icons = {
    Feed: focused ? '🏠' : '🏠',
    Notifications: focused ? '🔔' : '🔔',
    Profile: focused ? '👤' : '👤',
    Settings: focused ? '⚙️' : '⚙️',
  };
  return (
    <Text style={{ fontSize: size, opacity: focused ? 1 : 0.5 }}>
      {icons[name] || '•'}
    </Text>
  );
}

function BadgeIcon({ count, children }) {
  return (
    <View>
      {children}
      {count > 0 && (
        <View
          style={{
            position: 'absolute',
            top: -4,
            right: -8,
            backgroundColor: Colors.warmCoral,
            borderRadius: 8,
            minWidth: 16,
            height: 16,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Text style={{ color: Colors.white, fontSize: 10, fontWeight: 'bold' }}>
            {count > 99 ? '99+' : count}
          </Text>
        </View>
      )}
    </View>
  );
}

function MainTabs() {
  const { unreadCount } = useNotifications() || {};

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopColor: Colors.borderGray,
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        tabBarActiveTintColor: Colors.electricBlue,
        tabBarInactiveTintColor: Colors.mediumGray,
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: 'Inter-SemiBold',
        },
      }}>
      <Tab.Screen
        name="Feed"
        component={FeedStack}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ focused }) => <TabIcon name="Feed" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          tabBarLabel: 'Alerts',
          tabBarIcon: ({ focused }) => (
            <BadgeIcon count={unreadCount || 0}>
              <TabIcon name="Notifications" focused={focused} />
            </BadgeIcon>
          ),
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon name="Profile" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ focused }) => <TabIcon name="Settings" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

function FeedStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="FeedMain" component={FeedScreen} />
      <Stack.Screen name="SessionDetail" component={SessionDetailScreen} />
      <Stack.Screen name="CategorySelect" component={CategorySelectScreen} />
      <Stack.Screen name="PostSession" component={PostSessionScreen} />
      <Stack.Screen name="Rating" component={RatingScreen} />
      <Stack.Screen name="UserProfile" component={ProfileScreen} />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
    </Stack.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
      <Stack.Screen name="CreateProfile" component={CreateProfileScreen} />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const { isAuthenticated, hasProfile, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  if (!isAuthenticated) return <AuthStack />;
  if (!hasProfile) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="CreateProfile" component={CreateProfileScreen} />
      </Stack.Navigator>
    );
  }

  return <MainTabs />;
}
