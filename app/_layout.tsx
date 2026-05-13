import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import { useState, useEffect } from 'react';
import { SplashView } from '../components/SplashView';
import * as SplashScreen from 'expo-splash-screen';
import { useWorkoutStore } from '../stores/workoutStore';
import { ToastProvider } from '../hooks/useToast';
import { ThemeProvider } from '../theme/themeContext';
import { useThemeColors } from '../theme/themeColors';
import { requestNotificationPermissions } from '../lib/notifications';
import { initializePerformanceMonitoring } from '../lib/performanceMonitor';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { setupGlobalErrorHandler } from '../hooks/useErrorHandler';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync().catch(() => {});

function RootLayoutContent() {
  const themeColors = useThemeColors();
  
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: themeColors.background } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="chat" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="workout" options={{ presentation: 'fullScreenModal' }} />
        <Stack.Screen name="schedule" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="workout-builder" />
        <Stack.Screen name="settings" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="analytics" options={{ presentation: 'card', animation: 'slide_from_right' }} />
        <Stack.Screen name="history" options={{ presentation: 'card', animation: 'slide_from_right' }} />
        <Stack.Screen name="badges" options={{ presentation: 'card', animation: 'slide_from_right' }} />
      </Stack>
    </View>
  );
}

export default function RootLayout() {
  const [isAppReady, setIsAppReady] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [notificationPermissionRequested, setNotificationPermissionRequested] = useState(false);
  const loadData = useWorkoutStore(state => state.loadData);
  const loadSettings = useWorkoutStore(state => state.loadSettings);

  useEffect(() => {
    // Initialize crash/error monitoring
    setupGlobalErrorHandler();

    // Initialize performance monitoring
    initializePerformanceMonitoring();

    async function prepare() {
      try {
        // Initialize database and load persisted data
        await loadData();
        await loadSettings();
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (e) {
        console.warn(e);
      } finally {
        setIsAppReady(true);
        await SplashScreen.hideAsync().catch(() => {});
      }
    }

    prepare();
  }, []);

  // Request notification permissions on first launch
  useEffect(() => {
    if (isAppReady && !notificationPermissionRequested) {
      const requestPermissions = async () => {
        try {
          const permissionGranted = await requestNotificationPermissions();
          setNotificationPermissionRequested(true);
          console.log('Notification permission granted:', permissionGranted);
        } catch (error) {
          console.error('Error requesting notification permissions:', error);
          setNotificationPermissionRequested(true);
        }
      };

      requestPermissions();
    }
  }, [isAppReady, notificationPermissionRequested]);

  if (!isAppReady || showSplash) {
    return (
      <ErrorBoundary>
        <SplashView onAnimationComplete={() => setShowSplash(false)} />
      </ErrorBoundary>
    );
  }

  return (
    <ThemeProvider>
      <ErrorBoundary>
        <ToastProvider>
          <RootLayoutContent />
        </ToastProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D' },
});