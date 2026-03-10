import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import Button from '../../components/Button';
import { useAuth } from '../../contexts/AuthContext';
import { createSession } from '../../api/sessions';
import { getCategoryEmoji, getCategoryName } from '../../utils/school';
import { LocationPresets } from '../../constants/locations';

// Time offset options in minutes from now
const TIME_OPTIONS = [
  { label: 'In 15 min', value: 15 },
  { label: 'In 30 min', value: 30 },
  { label: 'In 1 hour', value: 60 },
  { label: 'In 2 hours', value: 120 },
];

// Duration options in minutes
const DURATION_OPTIONS = [
  { label: '30 min', value: 30 },
  { label: '45 min', value: 45 },
  { label: '1 hour', value: 60 },
  { label: '1.5 hours', value: 90 },
  { label: '2 hours', value: 120 },
];

// Looking for options
const LOOKING_FOR_OPTIONS = [
  { label: '1 person', value: 1 },
  { label: '2-3 people', value: 3 },
  { label: 'Anyone (5+)', value: 5 },
];

export default function PostSessionScreen({ route, navigation }) {
  const { category } = route.params;
  const { user, profile } = useAuth();

  const [timeOffset, setTimeOffset] = useState(60);
  const [duration, setDuration] = useState(60);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [customLocation, setCustomLocation] = useState('');
  const [activityDetail, setActivityDetail] = useState('');
  const [lookingFor, setLookingFor] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showCustomLocation, setShowCustomLocation] = useState(false);

  const school = profile?.school || 'Columbia';
  const locationPresets = LocationPresets[school]?.[category] || [];

  const isValid =
    (selectedLocation || customLocation.trim().length > 2) && timeOffset && duration;

  async function handlePost() {
    if (!isValid) return;

    const startTime = new Date(Date.now() + timeOffset * 60000);
    const locationName = selectedLocation?.name || customLocation.trim();
    const locationLat = selectedLocation?.lat || null;
    const locationLng = selectedLocation?.lng || null;

    setLoading(true);
    try {
      await createSession({
        userId: user.id,
        category,
        location: locationName,
        locationLat,
        locationLng,
        startTime: startTime.toISOString(),
        duration,
        activityDetail: activityDetail.trim() || null,
        lookingFor,
      });

      Alert.alert(
        '✓ Session Posted!',
        `Your ${category} session at ${locationName} is now live.`,
        [{ text: 'View Feed', onPress: () => navigation.popToTop() }]
      );
    } catch (error) {
      if (error.message.includes('conflict')) {
        Alert.alert(
          'Time Conflict',
          'You already have another session at this time. Please choose a different time.'
        );
      } else {
        Alert.alert('Error', error.message || 'Failed to post session. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  function renderOptionRow(options, selected, onSelect) {
    return (
      <View style={styles.optionRow}>
        {options.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={[styles.optionChip, selected === opt.value && styles.optionChipActive]}
            onPress={() => onSelect(opt.value)}
            accessibilityLabel={opt.label}
            accessibilityState={{ selected: selected === opt.value }}>
            <Text
              style={[
                styles.optionChipText,
                selected === opt.value && styles.optionChipTextActive,
              ]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.cancelText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>
            {getCategoryEmoji(category)} Post {getCategoryName(category)}
          </Text>
          <View style={{ width: 50 }} />
        </View>

        <ScrollView contentContainerStyle={styles.form} showsVerticalScrollIndicator={false}>
          {/* When */}
          <Text style={styles.sectionLabel}>When?</Text>
          {renderOptionRow(TIME_OPTIONS, timeOffset, setTimeOffset)}

          {/* How long */}
          <Text style={styles.sectionLabel}>How long?</Text>
          {renderOptionRow(DURATION_OPTIONS, duration, setDuration)}

          {/* Where */}
          <Text style={styles.sectionLabel}>Where?</Text>
          <View style={styles.locationList}>
            {locationPresets.map((loc) => (
              <TouchableOpacity
                key={loc.name}
                style={[
                  styles.locationItem,
                  selectedLocation?.name === loc.name && styles.locationItemActive,
                ]}
                onPress={() => {
                  setSelectedLocation(loc);
                  setShowCustomLocation(false);
                  setCustomLocation('');
                }}>
                <Text
                  style={[
                    styles.locationItemText,
                    selectedLocation?.name === loc.name && styles.locationItemTextActive,
                  ]}>
                  {loc.name}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[
                styles.locationItem,
                showCustomLocation && styles.locationItemActive,
              ]}
              onPress={() => {
                setShowCustomLocation(true);
                setSelectedLocation(null);
              }}>
              <Text
                style={[
                  styles.locationItemText,
                  showCustomLocation && styles.locationItemTextActive,
                ]}>
                + Custom location...
              </Text>
            </TouchableOpacity>
          </View>

          {showCustomLocation && (
            <TextInput
              style={styles.input}
              value={customLocation}
              onChangeText={setCustomLocation}
              placeholder="Enter location name"
              placeholderTextColor={Colors.mediumGray}
              autoFocus
              returnKeyType="done"
              accessibilityLabel="Custom location"
            />
          )}

          {/* Activity detail */}
          <Text style={styles.sectionLabel}>What specifically? (optional)</Text>
          <TextInput
            style={styles.input}
            value={activityDetail}
            onChangeText={(t) => setActivityDetail(t.slice(0, 100))}
            placeholder={
              category === 'gym'
                ? 'e.g., Chest day, leg day...'
                : category === 'coffee'
                ? 'e.g., Quick catch-up, first time...'
                : 'e.g., Econ 201 exam prep...'
            }
            placeholderTextColor={Colors.mediumGray}
            maxLength={100}
            returnKeyType="done"
            accessibilityLabel="Activity detail"
          />
          <Text style={styles.charCount}>{activityDetail.length}/100</Text>

          {/* Looking for */}
          <Text style={styles.sectionLabel}>Looking for</Text>
          {renderOptionRow(LOOKING_FOR_OPTIONS, lookingFor, setLookingFor)}

          {/* Submit */}
          <Button
            title="POST IT"
            onPress={handlePost}
            size="large"
            disabled={!isValid}
            loading={loading}
            style={styles.submitButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderGray,
  },
  cancelText: {
    ...Typography.body,
    color: Colors.electricBlue,
  },
  title: {
    ...Typography.h3,
  },
  form: {
    padding: 20,
    paddingBottom: 48,
  },
  sectionLabel: {
    ...Typography.label,
    marginBottom: 10,
    marginTop: 20,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: Colors.mediumGray,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.borderGray,
    backgroundColor: Colors.lightGray,
  },
  optionChipActive: {
    borderColor: Colors.electricBlue,
    backgroundColor: Colors.electricBlue,
  },
  optionChipText: {
    ...Typography.bodySmall,
    color: Colors.slateGray,
    fontFamily: 'Inter-SemiBold',
  },
  optionChipTextActive: {
    color: Colors.white,
  },
  locationList: {
    gap: 8,
  },
  locationItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.borderGray,
    backgroundColor: Colors.lightGray,
  },
  locationItemActive: {
    borderColor: Colors.electricBlue,
    backgroundColor: `${Colors.electricBlue}10`,
  },
  locationItemText: {
    ...Typography.body,
    color: Colors.slateGray,
  },
  locationItemTextActive: {
    color: Colors.electricBlue,
    fontFamily: 'Inter-SemiBold',
  },
  input: {
    borderWidth: 1.5,
    borderColor: Colors.borderGray,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 13,
    ...Typography.body,
    color: Colors.midnight,
    marginTop: 8,
  },
  charCount: {
    ...Typography.caption,
    color: Colors.mediumGray,
    textAlign: 'right',
    marginTop: 4,
  },
  submitButton: {
    marginTop: 32,
  },
});
