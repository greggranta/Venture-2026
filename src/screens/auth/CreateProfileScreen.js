import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Alert,
  ScrollView,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import Button from '../../components/Button';
import { useAuth } from '../../contexts/AuthContext';
import { createProfile } from '../../api/users';
import { detectSchool } from '../../utils/school';
import { Schools, GraduationYears } from '../../constants/locations';

export default function CreateProfileScreen() {
  const { user, refreshProfile } = useAuth();
  const [name, setName] = useState('');
  const [school, setSchool] = useState(detectSchool(user?.email || '') || '');
  const [graduationYear, setGraduationYear] = useState(2026);
  const [bio, setBio] = useState('');
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);

  const isValid = name.trim().length > 1 && school && graduationYear;

  async function pickPhoto() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photos to upload a profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      setPhoto(result.assets[0]);
    }
  }

  async function takePhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow camera access to take a profile picture.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      setPhoto(result.assets[0]);
    }
  }

  function showPhotoOptions() {
    Alert.alert('Profile Photo', 'Choose how to add your photo', [
      { text: 'Take Photo', onPress: takePhoto },
      { text: 'Choose from Library', onPress: pickPhoto },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  async function handleCreate() {
    if (!isValid) return;

    setLoading(true);
    try {
      await createProfile({
        userId: user.id,
        email: user.email,
        name: name.trim(),
        school,
        graduationYear,
        photoFile: photo,
        bio: bio.trim() || null,
      });

      await refreshProfile();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to create profile. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Tell us about yourself</Text>
          <Text style={styles.subtitle}>Set up your Venture profile</Text>

          {/* Photo upload */}
          <TouchableOpacity style={styles.photoButton} onPress={showPhotoOptions}>
            {photo ? (
              <Image source={{ uri: photo.uri }} style={styles.photoPreview} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Text style={styles.photoIcon}>📷</Text>
                <Text style={styles.photoText}>Add Photo</Text>
              </View>
            )}
          </TouchableOpacity>
          <Text style={styles.photoHint}>
            Please use a real photo with your face visible
          </Text>

          {/* Name */}
          <Text style={styles.label}>Full Name *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor={Colors.mediumGray}
            autoComplete="name"
            returnKeyType="next"
            accessibilityLabel="Full name"
          />

          {/* School */}
          <Text style={styles.label}>School *</Text>
          <View style={styles.schoolGrid}>
            {Schools.map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.schoolChip, school === s && styles.schoolChipActive]}
                onPress={() => setSchool(s)}
                accessibilityLabel={`Select ${s}`}
                accessibilityState={{ selected: school === s }}>
                <Text style={[styles.schoolChipText, school === s && styles.schoolChipTextActive]}>
                  {s}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Graduation Year */}
          <Text style={styles.label}>Graduation Year *</Text>
          <View style={styles.yearRow}>
            {GraduationYears.map((year) => (
              <TouchableOpacity
                key={year}
                style={[styles.yearChip, graduationYear === year && styles.yearChipActive]}
                onPress={() => setGraduationYear(year)}
                accessibilityLabel={`Class of ${year}`}
                accessibilityState={{ selected: graduationYear === year }}>
                <Text style={[styles.yearChipText, graduationYear === year && styles.yearChipTextActive]}>
                  '{String(year).slice(-2)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Bio */}
          <Text style={styles.label}>Bio (optional)</Text>
          <TextInput
            style={[styles.input, styles.bioInput]}
            value={bio}
            onChangeText={(t) => setBio(t.slice(0, 150))}
            placeholder="Tell people what you're into..."
            placeholderTextColor={Colors.mediumGray}
            multiline
            numberOfLines={3}
            maxLength={150}
            accessibilityLabel="Bio"
          />
          <Text style={styles.charCount}>{bio.length}/150</Text>

          <Button
            title="Create Account"
            onPress={handleCreate}
            size="large"
            disabled={!isValid}
            loading={loading}
            style={styles.createButton}
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
  scrollContent: {
    padding: 24,
    paddingBottom: 48,
  },
  title: {
    ...Typography.h2,
    marginBottom: 4,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.mediumGray,
    marginBottom: 32,
  },
  photoButton: {
    alignSelf: 'center',
    marginBottom: 8,
  },
  photoPreview: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: Colors.electricBlue,
  },
  photoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.lightGray,
    borderWidth: 2,
    borderColor: Colors.borderGray,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  photoText: {
    ...Typography.caption,
    color: Colors.mediumGray,
  },
  photoHint: {
    ...Typography.caption,
    color: Colors.mediumGray,
    textAlign: 'center',
    marginBottom: 24,
  },
  label: {
    ...Typography.label,
    marginBottom: 8,
    marginTop: 4,
  },
  input: {
    borderWidth: 1.5,
    borderColor: Colors.borderGray,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 13,
    ...Typography.body,
    color: Colors.midnight,
    marginBottom: 16,
  },
  bioInput: {
    height: 90,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  charCount: {
    ...Typography.caption,
    color: Colors.mediumGray,
    textAlign: 'right',
    marginTop: -12,
    marginBottom: 16,
  },
  schoolGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  schoolChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.borderGray,
    backgroundColor: Colors.lightGray,
  },
  schoolChipActive: {
    borderColor: Colors.electricBlue,
    backgroundColor: Colors.electricBlue,
  },
  schoolChipText: {
    ...Typography.bodySmall,
    color: Colors.slateGray,
  },
  schoolChipTextActive: {
    color: Colors.white,
    fontFamily: 'Inter-SemiBold',
  },
  yearRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  yearChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.borderGray,
    backgroundColor: Colors.lightGray,
  },
  yearChipActive: {
    borderColor: Colors.electricBlue,
    backgroundColor: Colors.electricBlue,
  },
  yearChipText: {
    ...Typography.bodySmall,
    color: Colors.slateGray,
    fontFamily: 'Inter-SemiBold',
  },
  yearChipTextActive: {
    color: Colors.white,
  },
  createButton: {
    marginTop: 8,
  },
});
