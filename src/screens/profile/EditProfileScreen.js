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
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import Button from '../../components/Button';
import { useAuth } from '../../contexts/AuthContext';
import { updateProfile, getPhotoUrl } from '../../api/users';
import { GraduationYears } from '../../constants/locations';

export default function EditProfileScreen({ navigation }) {
  const { user, profile, refreshProfile } = useAuth();

  const [name, setName] = useState(profile?.name || '');
  const [graduationYear, setGraduationYear] = useState(profile?.graduation_year || 2026);
  const [bio, setBio] = useState(profile?.bio || '');
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);

  const currentPhotoUrl = getPhotoUrl(profile?.photo_url);
  const displayPhotoUrl = photo?.uri || currentPhotoUrl;

  const hasChanges =
    name !== profile?.name ||
    graduationYear !== profile?.graduation_year ||
    bio !== (profile?.bio || '') ||
    photo !== null;

  async function pickPhoto() {
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

  async function handleSave() {
    if (!name.trim() || name.trim().length < 2) {
      Alert.alert('Error', 'Please enter a valid name.');
      return;
    }

    setLoading(true);
    try {
      await updateProfile(user.id, {
        name: name.trim(),
        graduationYear,
        bio: bio.trim() || null,
        photoFile: photo,
      });

      await refreshProfile();
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to save changes. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>EDIT PROFILE</Text>
          <View style={{ width: 50 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Photo */}
          <View style={styles.photoSection}>
            <TouchableOpacity onPress={pickPhoto}>
              {displayPhotoUrl ? (
                <Image source={{ uri: displayPhotoUrl }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Text style={styles.avatarInitial}>{name?.charAt(0) || '?'}</Text>
                </View>
              )}
              <View style={styles.changePhotoOverlay}>
                <Text style={styles.changePhotoText}>📷</Text>
              </View>
            </TouchableOpacity>
            <Text style={styles.changePhotoLabel}>Change Photo</Text>
          </View>

          {/* Name */}
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor={Colors.mediumGray}
            autoComplete="name"
            returnKeyType="next"
          />

          {/* Graduation Year */}
          <Text style={styles.label}>Graduation Year</Text>
          <View style={styles.yearRow}>
            {GraduationYears.map((year) => (
              <TouchableOpacity
                key={year}
                style={[styles.yearChip, graduationYear === year && styles.yearChipActive]}
                onPress={() => setGraduationYear(year)}>
                <Text style={[styles.yearChipText, graduationYear === year && styles.yearChipTextActive]}>
                  '{String(year).slice(-2)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Bio */}
          <Text style={styles.label}>Bio</Text>
          <TextInput
            style={[styles.input, styles.bioInput]}
            value={bio}
            onChangeText={(t) => setBio(t.slice(0, 150))}
            placeholder="Tell people what you're into..."
            placeholderTextColor={Colors.mediumGray}
            multiline
            numberOfLines={3}
            maxLength={150}
          />
          <Text style={styles.charCount}>{bio.length}/150</Text>

          <Button
            title="Save Changes"
            onPress={handleSave}
            size="large"
            disabled={!hasChanges}
            loading={loading}
            style={styles.saveButton}
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderGray,
  },
  cancelText: {
    ...Typography.body,
    color: Colors.mediumGray,
  },
  title: {
    ...Typography.h3,
    letterSpacing: 1,
  },
  content: {
    padding: 24,
    paddingBottom: 48,
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: Colors.electricBlue,
  },
  avatarPlaceholder: {
    backgroundColor: Colors.electricBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: Colors.white,
    fontSize: 36,
    fontFamily: 'Inter-Bold',
  },
  changePhotoOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.electricBlue,
    borderRadius: 14,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  changePhotoText: {
    fontSize: 14,
  },
  changePhotoLabel: {
    ...Typography.caption,
    color: Colors.electricBlue,
    marginTop: 8,
  },
  label: {
    ...Typography.label,
    marginBottom: 8,
    marginTop: 8,
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
  saveButton: {
    marginTop: 8,
  },
});
