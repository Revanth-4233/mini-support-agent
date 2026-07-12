import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, SHADOWS } from '../styles/theme';

/**
 * App header bar showing the app title, connection status, and online user count.
 *
 * @param {boolean} isConnected - Socket connection status
 * @param {number} onlineCount - Number of online users
 */
const Header = ({ isConnected = false, onlineCount = 0 }) => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* App title */}
        <View style={styles.titleRow}>
          <Text style={styles.title}>💬</Text>
          <Text style={styles.titleText}>ChatApp</Text>
        </View>

        {/* Status info */}
        <View style={styles.statusRow}>
          {/* Connection dot */}
          <View
            style={[
              styles.statusDot,
              { backgroundColor: isConnected ? COLORS.online : COLORS.error },
            ]}
          />
          <Text style={styles.statusText}>
            {isConnected ? `${onlineCount} online` : 'Reconnecting...'}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    paddingTop: 50, // account for status bar
    paddingBottom: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    ...SHADOWS.medium,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  title: {
    fontSize: FONT_SIZE.xxl,
  },
  titleText: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
    letterSpacing: 0.5,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.surfaceLight,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHT.medium,
  },
});

export default Header;
