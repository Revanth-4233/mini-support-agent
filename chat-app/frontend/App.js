import React, { useState } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import LoginScreen from './src/screens/LoginScreen';
import ChatScreen from './src/screens/ChatScreen';
import { COLORS } from './src/styles/theme';

/**
 * Root application component.
 * Manages simple navigation between Login and Chat screens.
 * No React Navigation needed — just conditional rendering.
 */
export default function App() {
  const [username, setUsername] = useState(null);

  /**
   * Handle successful login — store the username and navigate to chat.
   */
  const handleLogin = (name) => {
    setUsername(name);
  };

  /**
   * Handle logout — clear username and return to login screen.
   */
  const handleLogout = () => {
    setUsername(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      {username ? (
        <ChatScreen username={username} onLogout={handleLogout} />
      ) : (
        <LoginScreen onLogin={handleLogin} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});
