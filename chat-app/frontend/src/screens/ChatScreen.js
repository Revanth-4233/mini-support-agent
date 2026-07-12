import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  FlatList,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import Header from '../components/Header';
import ChatBubble from '../components/ChatBubble';
import MessageInput from '../components/MessageInput';
import TypingIndicator from '../components/TypingIndicator';
import { fetchMessages, sendMessage } from '../services/api';
import useSocket from '../hooks/useSocket';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS } from '../styles/theme';

/**
 * Main chat screen.
 * Loads history, listens for real-time messages, handles sending,
 * and manages read/delivered status.
 *
 * @param {string} username - Current user's display name
 * @param {Function} onLogout - Callback to return to login screen
 */
const ChatScreen = ({ username, onLogout }) => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const flatListRef = useRef(null);

  // Socket hook — handles connection, messages, typing, online users, status
  const {
    isConnected,
    onlineUsers,
    typingUsers,
    newMessage,
    statusUpdate,
    emitTyping,
    emitStopTyping,
    markAsRead,
  } = useSocket(username);

  /**
   * Load chat history on mount.
   */
  useEffect(() => {
    loadMessages();
  }, []);

  /**
   * When a new message arrives via socket, append it to the list.
   * Avoid duplicates by checking _id.
   * Auto-mark other users' messages as read (since the chat is open).
   */
  useEffect(() => {
    if (!newMessage) return;

    setMessages((prev) => {
      // Skip if we already have this message (e.g., from our own REST response)
      if (prev.some((m) => m._id === newMessage._id)) {
        return prev;
      }
      return [...prev, newMessage];
    });

    // If this message is from another user, mark it as read (chat is visible)
    if (newMessage.name !== username && newMessage._id) {
      markAsRead([newMessage._id]);
    }

    // Auto-scroll to bottom
    scrollToBottom();
  }, [newMessage, username, markAsRead]);

  /**
   * Handle message status updates (sent → delivered → read).
   * Update the status of the matching message in state.
   */
  useEffect(() => {
    if (!statusUpdate) return;

    setMessages((prev) =>
      prev.map((msg) =>
        msg._id === statusUpdate.messageId
          ? { ...msg, status: statusUpdate.status }
          : msg
      )
    );
  }, [statusUpdate]);

  /**
   * Fetch all messages from the API.
   * Mark all messages from other users as read after loading.
   */
  const loadMessages = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchMessages();
      setMessages(data);

      // Mark all unread messages from others as read
      const unreadIds = data
        .filter((m) => m.name !== username && m.status !== 'read')
        .map((m) => m._id);
      if (unreadIds.length > 0) {
        markAsRead(unreadIds);
      }

      // Scroll to bottom after messages load
      setTimeout(scrollToBottom, 100);
    } catch (err) {
      setError(err.message || 'Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Send a message via REST API.
   * The server will broadcast it via Socket.io — the useSocket hook picks it up.
   */
  const handleSend = useCallback(
    async (messageText) => {
      try {
        setIsSending(true);
        setError(null);
        emitStopTyping();
        await sendMessage(username, messageText);
        // Message will arrive via socket — no need to manually append
      } catch (err) {
        setError(err.message || 'Failed to send message');
      } finally {
        setIsSending(false);
      }
    },
    [username, emitStopTyping]
  );

  /**
   * Scroll FlatList to the bottom.
   */
  const scrollToBottom = () => {
    if (flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  };

  /**
   * Render a single message item.
   */
  const renderMessage = useCallback(
    ({ item }) => (
      <ChatBubble
        message={item}
        isOwn={item.name === username}
      />
    ),
    [username]
  );

  /**
   * Key extractor for FlatList.
   */
  const keyExtractor = useCallback(
    (item) => item._id || `${item.createdAt}-${item.name}`,
    []
  );

  /**
   * Render empty state when there are no messages.
   */
  const renderEmptyState = () => {
    if (isLoading) return null;

    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyEmoji}>👋</Text>
        <Text style={styles.emptyTitle}>No messages yet</Text>
        <Text style={styles.emptySubtitle}>Be the first to say hello!</Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <StatusBar barStyle="light-content" backgroundColor={COLORS.surface} />

      {/* Header */}
      <Header isConnected={isConnected} onlineCount={onlineUsers.length} />

      {/* Logout button */}
      <View style={styles.userBar}>
        <Text style={styles.userBarText}>
          Logged in as <Text style={styles.userBarName}>{username}</Text>
        </Text>
        <TouchableOpacity onPress={onLogout} activeOpacity={0.7}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Error banner */}
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={loadMessages} activeOpacity={0.7}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Loading state */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading messages...</Text>
        </View>
      ) : (
        /* Message list */
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={keyExtractor}
          contentContainerStyle={[
            styles.messageList,
            messages.length === 0 && styles.messageListEmpty,
          ]}
          ListEmptyComponent={renderEmptyState}
          onContentSizeChange={scrollToBottom}
          showsVerticalScrollIndicator={false}
          initialNumToRender={20}
          maxToRenderPerBatch={10}
          windowSize={10}
        />
      )}

      {/* Typing indicator */}
      <TypingIndicator typingUsers={typingUsers} currentUser={username} />

      {/* Message input */}
      <MessageInput
        onSend={handleSend}
        onTyping={emitTyping}
        isSending={isSending}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  userBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surfaceLight,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  userBarText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  userBarName: {
    color: COLORS.primaryLight,
    fontWeight: FONT_WEIGHT.semiBold,
  },
  logoutText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.error,
    fontWeight: FONT_WEIGHT.medium,
  },
  messageList: {
    paddingVertical: SPACING.md,
  },
  messageListEmpty: {
    flex: 1,
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.md,
  },
  loadingText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xxxl,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.semiBold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  emptySubtitle: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
  },
  errorBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 107, 107, 0.3)',
  },
  errorText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.error,
    flex: 1,
  },
  retryText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHT.semiBold,
    marginLeft: SPACING.md,
  },
});

export default ChatScreen;
