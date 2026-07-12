import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import dayjs from 'dayjs';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS } from '../styles/theme';

/**
 * Returns status indicator for own messages.
 * ✓  = sent
 * ✓✓ = delivered (grey)
 * ✓✓ = read (blue)
 */
const StatusIndicator = ({ status }) => {
  if (!status) return null;

  let icon;
  let color;

  switch (status) {
    case 'read':
      icon = '✓✓';
      color = '#74B9FF'; // blue — read
      break;
    case 'delivered':
      icon = '✓✓';
      color = 'rgba(255, 255, 255, 0.5)'; // grey — delivered
      break;
    case 'sent':
    default:
      icon = '✓';
      color = 'rgba(255, 255, 255, 0.4)'; // faded — sent
      break;
  }

  return <Text style={[statusStyles.indicator, { color }]}>{icon}</Text>;
};

const statusStyles = StyleSheet.create({
  indicator: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.bold,
    marginLeft: 4,
  },
});

/**
 * Single chat message bubble.
 * Aligns right for own messages, left for others.
 * Shows read/delivered status ticks for own messages.
 *
 * @param {Object} message - Message object { _id, name, message, createdAt, status }
 * @param {boolean} isOwn - Whether this message belongs to the current user
 */
const ChatBubble = ({ message, isOwn }) => {
  const formattedTime = dayjs(message.createdAt).format('h:mm A');
  const formattedDate = dayjs(message.createdAt).format('MMM D');

  return (
    <View
      style={[
        styles.container,
        isOwn ? styles.containerOwn : styles.containerOther,
      ]}
    >
      {/* Sender name (only for other users' messages) */}
      {!isOwn && <Text style={styles.senderName}>{message.name}</Text>}

      {/* Message bubble */}
      <View
        style={[
          styles.bubble,
          isOwn ? styles.bubbleOwn : styles.bubbleOther,
        ]}
      >
        <Text
          style={[
            styles.messageText,
            isOwn ? styles.messageTextOwn : styles.messageTextOther,
          ]}
        >
          {message.message}
        </Text>

        {/* Timestamp + Status */}
        <View style={styles.metaRow}>
          <Text
            style={[
              styles.timestamp,
              isOwn ? styles.timestampOwn : styles.timestampOther,
            ]}
          >
            {formattedDate} · {formattedTime}
          </Text>

          {/* Show status ticks only on own messages */}
          {isOwn && <StatusIndicator status={message.status} />}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: SPACING.xs,
    marginHorizontal: SPACING.lg,
    maxWidth: '80%',
  },
  containerOwn: {
    alignSelf: 'flex-end',
  },
  containerOther: {
    alignSelf: 'flex-start',
  },
  senderName: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.primaryLight,
    fontWeight: FONT_WEIGHT.semiBold,
    marginBottom: SPACING.xs - 2,
    marginLeft: SPACING.sm,
    letterSpacing: 0.3,
  },
  bubble: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
  },
  bubbleOwn: {
    backgroundColor: COLORS.bubbleOwn,
    borderBottomRightRadius: SPACING.xs,
  },
  bubbleOther: {
    backgroundColor: COLORS.bubbleOther,
    borderBottomLeftRadius: SPACING.xs,
  },
  messageText: {
    fontSize: FONT_SIZE.md + 1,
    lineHeight: 22,
  },
  messageTextOwn: {
    color: COLORS.bubbleOwnText,
  },
  messageTextOther: {
    color: COLORS.bubbleOtherText,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: SPACING.xs,
  },
  timestamp: {
    fontSize: FONT_SIZE.xs,
  },
  timestampOwn: {
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'right',
  },
  timestampOther: {
    color: COLORS.textMuted,
    textAlign: 'left',
  },
});

// Memo to avoid re-rendering unchanged messages in the FlatList
export default memo(ChatBubble);
