import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';

import { Colors, CategoryColors } from '../../constants/colors';
import { Typography } from '../../constants/typography';

const CATEGORIES = [
  {
    id: 'gym',
    emoji: '🏋️',
    title: 'GYM & FITNESS',
    subtitle: 'Never lift alone',
    color: CategoryColors.gym,
  },
  {
    id: 'coffee',
    emoji: '☕',
    title: 'COFFEE & CHILL',
    subtitle: 'Fill the gap between classes',
    color: CategoryColors.coffee,
  },
  {
    id: 'study',
    emoji: '📚',
    title: 'STUDY SESSION',
    subtitle: 'Find your focus partner',
    color: CategoryColors.study,
  },
];

export default function CategorySelectScreen({ navigation }) {
  function handleSelect(category) {
    navigation.navigate('PostSession', { category });
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>What are you doing?</Text>
        <View style={{ width: 50 }} />
      </View>

      <View style={styles.content}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.categoryCard, { borderColor: cat.color }]}
            onPress={() => handleSelect(cat.id)}
            accessibilityLabel={`${cat.title}: ${cat.subtitle}`}
            activeOpacity={0.85}>
            <View style={[styles.categoryIcon, { backgroundColor: `${cat.color}15` }]}>
              <Text style={styles.emoji}>{cat.emoji}</Text>
            </View>
            <View style={styles.categoryText}>
              <Text style={[styles.categoryTitle, { color: cat.color }]}>{cat.title}</Text>
              <Text style={styles.categorySubtitle}>{cat.subtitle}</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.electricBlue,
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
    color: Colors.midnight,
  },
  content: {
    flex: 1,
    padding: 20,
    gap: 16,
    justifyContent: 'center',
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    backgroundColor: Colors.electricBlue,
    shadowColor: Colors.midnight,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  categoryIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  emoji: {
    fontSize: 32,
  },
  categoryText: {
    flex: 1,
  },
  categoryTitle: {
    ...Typography.h3,
    marginBottom: 4,
  },
  categorySubtitle: {
    ...Typography.bodySmall,
    color: Colors.mediumGray,
  },
  arrow: {
    fontSize: 28,
    color: Colors.borderGray,
    fontFamily: 'Inter-Regular',
  },
});
