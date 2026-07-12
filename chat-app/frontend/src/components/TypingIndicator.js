import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT } from '../styles/theme';

/**
 * Animated typing indicator.
 * Shows which users are currently typing with a pulsing dot animation.
 *
 * @param {Array<string>} typingUsers - List of usernames currently typing
 * @param {string} currentUser - Current user's name (to exclude from display)
 */
const TypingIndicator = ({ typingUsers = [], currentUser = '' }) => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  // Filter out current user from typing list
  const othersTyping = typingUsers.filter((u) => u !== currentUser);

  useEffect(() => {
    if (othersTyping.length === 0) return;

    const animateDot = (dot, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ])
      );

    const animation = Animated.parallel([
      animateDot(dot1, 0),
      animateDot(dot2, 150),
      animateDot(dot3, 300),
    ]);

    animation.start();

    return () => animation.stop();
  }, [othersTyping.length, dot1, dot2, dot3]);

  if (othersTyping.length === 0) return null;

  // Build display text
  let typingText;
  if (othersTyping.length === 1) {
    typingText = `${othersTyping[0]} is typing`;
  } else if (othersTyping.length === 2) {
    typingText = `${othersTyping[0]} and ${othersTyping[1]} are typing`;
  } else {
    typingText = 'Several people are typing';
  }

  const dotStyle = (dot) => ({
    opacity: dot.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 1],
    }),
    transform: [
      {
        translateY: dot.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -3],
        }),
      },
    ],
  });

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{typingText}</Text>
      <View style={styles.dots}>
        <Animated.View style={[styles.dot, dotStyle(dot1)]} />
        <Animated.View style={[styles.dot, dotStyle(dot2)]} />
        <Animated.View style={[styles.dot, dotStyle(dot3)]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.xs + 2,
    gap: SPACING.xs,
  },
  text: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    fontWeight: FONT_WEIGHT.medium,
    fontStyle: 'italic',
  },
  dots: {
    flexDirection: 'row',
    gap: 3,
    alignItems: 'center',
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: COLORS.primaryLight,
  },
});

export default TypingIndicator;
