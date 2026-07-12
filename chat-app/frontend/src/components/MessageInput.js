import React, { useState, useCallback } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS, SHADOWS } from '../styles/theme';

/**
 * Message input bar with text field and send button.
 * Emits typing events and clears input on send.
 *
 * @param {Function} onSend - Callback with message text
 * @param {Function} onTyping - Callback when user starts typing
 * @param {boolean} isSending - Shows loading spinner on send button
 */
const MessageInput = ({ onSend, onTyping, isSending = false }) => {
  const [text, setText] = useState('');

  const handleChangeText = useCallback(
    (value) => {
      setText(value);
      if (value.trim() && onTyping) {
        onTyping();
      }
    },
    [onTyping]
  );

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || isSending) return;

    onSend(trimmed);
    setText('');
  }, [text, isSending, onSend]);

  const isDisabled = !text.trim() || isSending;

  return (
    <View style={styles.container}>
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={handleChangeText}
          placeholder="Type a message..."
          placeholderTextColor={COLORS.placeholder}
          multiline
          maxLength={2000}
          returnKeyType="send"
          onSubmitEditing={handleSend}
          blurOnSubmit={false}
          editable={!isSending}
        />
      </View>

      <TouchableOpacity
        style={[styles.sendButton, isDisabled && styles.sendButtonDisabled]}
        onPress={handleSend}
        disabled={isDisabled}
        activeOpacity={0.7}
      >
        {isSending ? (
          <ActivityIndicator size="small" color={COLORS.white} />
        ) : (
          <Text style={styles.sendIcon}>➤</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: SPACING.sm,
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: COLORS.inputBackground,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    maxHeight: 120,
  },
  input: {
    fontSize: FONT_SIZE.md,
    color: COLORS.inputText,
    fontWeight: FONT_WEIGHT.regular,
    lineHeight: 22,
    maxHeight: 100,
    paddingVertical: SPACING.xs,
  },
  sendButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.small,
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.surfaceLight,
    opacity: 0.6,
  },
  sendIcon: {
    fontSize: FONT_SIZE.xl,
    color: COLORS.white,
    marginLeft: 2, // optical centering
  },
});

export default MessageInput;
