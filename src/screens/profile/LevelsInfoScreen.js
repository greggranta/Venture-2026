import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';

import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { LEVELS } from '../../utils/levels';

export default function LevelsInfoScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>HOW IT WORKS</Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* Tokens section */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>⚡ What are tokens?</Text>
          <Text style={styles.cardBody}>
            Tokens are your reputation on Venture. You earn them by actually showing up and being a
            good presence in the community.
          </Text>
          <View style={styles.earningRow}>
            <View style={styles.earningItem}>
              <Text style={styles.earningAmount}>+2</Text>
              <Text style={styles.earningLabel}>for showing up{'\n'}to a session</Text>
            </View>
            <View style={styles.earningDivider} />
            <View style={styles.earningItem}>
              <Text style={styles.earningAmount}>+1</Text>
              <Text style={styles.earningLabel}>for a positive{'\n'}vibe rating</Text>
            </View>
          </View>
        </View>

        {/* Levels section */}
        <Text style={styles.sectionHeading}>LEVELS</Text>

        {LEVELS.map((lvl) => (
          <View
            key={lvl.level}
            style={[styles.levelCard, lvl.level === 3 && styles.insiderCard]}>
            <View style={styles.levelHeader}>
              <View style={[styles.badgeCircle, { backgroundColor: lvl.color + '22' }]}>
                <Text style={styles.badgeEmoji}>{lvl.badge}</Text>
              </View>
              <View style={styles.levelMeta}>
                <Text style={[styles.levelName, { color: lvl.color }]}>
                  Level {lvl.level} — {lvl.name}
                </Text>
                <Text style={styles.tokenRange}>
                  {lvl.max !== null
                    ? `${lvl.min}–${lvl.max} tokens`
                    : `${lvl.min}+ tokens`}
                </Text>
              </View>
            </View>
            <View style={styles.perksContainer}>
              {lvl.perks.map((perk, i) => (
                <View key={i} style={styles.perkRow}>
                  <Text style={[styles.perkDot, { color: lvl.color }]}>•</Text>
                  <Text style={styles.perkText}>{perk}</Text>
                </View>
              ))}
            </View>
            {lvl.level === 3 && (
              <View style={[styles.insiderBanner, { backgroundColor: lvl.color }]}>
                <Text style={styles.insiderBannerText}>
                  💎 Insider — our most dedicated members
                </Text>
              </View>
            )}
          </View>
        ))}

        <Text style={styles.footerNote}>
          Levels update automatically as you earn tokens. Keep showing up.
        </Text>
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
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderGray,
  },
  backText: {
    ...Typography.body,
    color: Colors.electricBlue,
    width: 48,
  },
  headerTitle: {
    ...Typography.h3,
    letterSpacing: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 18,
    marginBottom: 20,
  },
  cardTitle: {
    ...Typography.h3,
    marginBottom: 8,
  },
  cardBody: {
    ...Typography.body,
    color: Colors.slateGray,
    lineHeight: 22,
    marginBottom: 20,
  },
  earningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.lightGray,
    borderRadius: 10,
    overflow: 'hidden',
  },
  earningItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
  },
  earningDivider: {
    width: 1,
    height: '100%',
    backgroundColor: Colors.borderGray,
  },
  earningAmount: {
    fontSize: 26,
    fontFamily: 'Inter-Bold',
    color: Colors.electricBlue,
    marginBottom: 4,
  },
  earningLabel: {
    ...Typography.caption,
    color: Colors.slateGray,
    textAlign: 'center',
    lineHeight: 16,
  },
  sectionHeading: {
    ...Typography.label,
    color: Colors.mediumGray,
    letterSpacing: 1,
    marginBottom: 10,
    marginLeft: 4,
  },
  levelCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    overflow: 'hidden',
  },
  insiderCard: {
    borderWidth: 1.5,
    borderColor: '#7B61FF',
  },
  levelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  badgeCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  badgeEmoji: {
    fontSize: 26,
  },
  levelMeta: {
    flex: 1,
  },
  levelName: {
    ...Typography.h3,
    marginBottom: 2,
  },
  tokenRange: {
    ...Typography.bodySmall,
    color: Colors.mediumGray,
  },
  perksContainer: {
    gap: 6,
  },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  perkDot: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Inter-Bold',
  },
  perkText: {
    ...Typography.bodySmall,
    color: Colors.slateGray,
    lineHeight: 20,
    flex: 1,
  },
  insiderBanner: {
    marginHorizontal: -16,
    marginBottom: -16,
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  insiderBannerText: {
    ...Typography.bodySmall,
    color: Colors.white,
    fontFamily: 'Inter-SemiBold',
  },
  footerNote: {
    ...Typography.caption,
    color: Colors.mediumGray,
    textAlign: 'center',
    marginTop: 8,
  },
});
