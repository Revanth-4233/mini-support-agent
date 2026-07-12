import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import {
  COLORS,
  SPACING,
  FONT_SIZE,
  FONT_WEIGHT,
  BORDER_RADIUS,
  SHADOWS,
} from '../styles/theme';

/**
 * Login screen — simple dummy username entry.
 * No authentication, just captures a display name for the chat.
 *
 * @param {Function} onLogin - Callback with the entered username
 */
const LoginScreen = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  const handleLogin = () => {
    const trimmed = username.trim();
    if (!trimmed) {
      setError('Please enter your name');
      return;
    }
    if (trimmed.length < 2) {
      setError('Name must be at least 2 characters');
      return;
    }
    if (trimmed.length > 30) {
      setError('Name must be 30 characters or less');
      return;
    }
    setError('');
    onLogin(trimmed);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      <View style={styles.content}>
        {/* Logo / branding */}
        <View style={styles.logoContainer}>
          <Text style={styles.logoEmoji}>💬</Text>
          <Text style={styles.logoTitle}>ChatApp</Text>
          <Text style={styles.logoSubtitle}>Connect instantly with anyone</Text>
        </View>

        {/* Input card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>What's your name?</Text>
          <Text style={styles.cardSubtitle}>
            Enter a display name to start chatting
          </Text>

          <TextInput
            style={[styles.input, error ? styles.inputError : null]}
            value={username}
            onChangeText={(text) => {
              setUsername(text);
              if (error) setError('');
            }}
            placeholder="e.g., Mukesh"
            placeholderTextColor={COLORS.placeholder}
            maxLength={30}
            returnKeyType="go"
            onSubmitEditing={handleLogin}
            autoFocus
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            style={[
              styles.button,
              !username.trim() && styles.buttonDisabled,
            ]}
            onPress={handleLogin}
            activeOpacity={0.8}
            disabled={!username.trim()}
          >
            <Text style={styles.buttonText}>Start Chatting →</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>Real-time messaging powered by Socket.io</Text>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xxl,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xxxl + 8,
  },
  logoEmoji: {
    fontSize: 64,
    marginBottom: SPACING.md,
  },
  logoTitle: {
    fontSize: FONT_SIZE.title,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
    letterSpacing: 1,
    marginBottom: SPACING.sm,
  },
  logoSubtitle: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xxl,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.large,
  },
  cardTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  cardSubtitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
  },
  input: {
    backgroundColor: COLORS.inputBackground,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md + 2,
    fontSize: FONT_SIZE.lg,
    color: COLORS.inputText,
    marginBottom: SPACING.lg,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  errorText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.error,
    marginBottom: SPACING.md,
    marginTop: -SPACING.sm,
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md + 2,
    alignItems: 'center',
    ...SHADOWS.small,
  },
  buttonDisabled: {
    backgroundColor: COLORS.surfaceLight,
    opacity: 0.6,
  },
  buttonText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.semiBold,
    color: COLORS.textOnPrimary,
    letterSpacing: 0.5,
  },
  footer: {
    marginTop: SPACING.xxxl,
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
});

export default LoginScreen;
