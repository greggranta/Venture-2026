import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';

import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { useAuth } from '../../contexts/AuthContext';

function SettingsItem({ icon, label, onPress, destructive = false, value }) {
  return (
    <TouchableOpacity style={styles.item} onPress={onPress}>
      <Text style={styles.itemIcon}>{icon}</Text>
      <Text style={[styles.itemLabel, destructive && styles.itemLabelDestructive]}>{label}</Text>
      {value && <Text style={styles.itemValue}>{value}</Text>}
      {!value && <Text style={styles.itemArrow}>›</Text>}
    </TouchableOpacity>
  );
}

export default function SettingsScreen({ navigation }) {
  const { profile, signOut } = useAuth();

  function handleSignOut() {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of Venture?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: signOut },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>SETTINGS</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Account section */}
        <Text style={styles.sectionHeader}>Account</Text>
        <View style={styles.section}>
          <SettingsItem icon="👤" label="Edit Profile" onPress={() => navigation.navigate('Profile')} />
          <SettingsItem icon="📧" label="Email" value={profile?.email} />
          <SettingsItem icon="🏫" label="School" value={profile?.school} />
        </View>

        {/* Notifications section */}
        <Text style={styles.sectionHeader}>Notifications</Text>
        <View style={styles.section}>
          <SettingsItem
            icon="🔔"
            label="Push Notifications"
            onPress={() => Linking.openSettings()}
          />
          <SettingsItem
            icon="📱"
            label="Session Reminders"
            value="15 min before"
          />
        </View>

        {/* Privacy & Safety section */}
        <Text style={styles.sectionHeader}>Privacy & Safety</Text>
        <View style={styles.section}>
          <SettingsItem
            icon="🔒"
            label="Privacy Policy"
            onPress={() => Alert.alert('Privacy Policy', 'Coming soon!')}
          />
          <SettingsItem
            icon="📋"
            label="Terms of Service"
            onPress={() => Alert.alert('Terms of Service', 'Coming soon!')}
          />
          <SettingsItem
            icon="🚨"
            label="Report a Problem"
            onPress={() => Alert.alert('Report', 'Coming soon!')}
          />
        </View>

        {/* About section */}
        <Text style={styles.sectionHeader}>About</Text>
        <View style={styles.section}>
          <SettingsItem icon="📝" label="Version" value="1.0.0 (MVP)" />
          <SettingsItem
            icon="❤️"
            label="Made for Chicago Students"
            value="2026"
          />
        </View>

        {/* Danger zone */}
        <View style={[styles.section, styles.dangerSection]}>
          <SettingsItem
            icon="🚪"
            label="Sign Out"
            onPress={handleSignOut}
            destructive
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Venture — Real connections. Real meetups.
          </Text>
          <Text style={styles.footerSubtext}>
            🏋️☕📚 Chicago College Students Only
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.lightGray,
  },
  header: {
    backgroundColor: Colors.background,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderGray,
  },
  title: {
    ...Typography.h3,
    letterSpacing: 1,
  },
  sectionHeader: {
    ...Typography.caption,
    color: Colors.mediumGray,
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  section: {
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.borderGray,
  },
  dangerSection: {
    marginTop: 24,
    marginBottom: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderGray,
  },
  itemIcon: {
    fontSize: 20,
    marginRight: 14,
    width: 28,
    textAlign: 'center',
  },
  itemLabel: {
    ...Typography.body,
    flex: 1,
    color: Colors.midnight,
  },
  itemLabelDestructive: {
    color: Colors.error,
  },
  itemValue: {
    ...Typography.bodySmall,
    color: Colors.mediumGray,
  },
  itemArrow: {
    fontSize: 22,
    color: Colors.borderGray,
  },
  footer: {
    alignItems: 'center',
    padding: 32,
  },
  footerText: {
    ...Typography.bodySmall,
    color: Colors.mediumGray,
    marginBottom: 4,
    textAlign: 'center',
  },
  footerSubtext: {
    ...Typography.caption,
    color: Colors.mediumGray,
  },
});
