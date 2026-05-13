import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  if (!Device.isDevice) {
    console.log('Notifications require a physical device');
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Notification permissions not granted');
    return false;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('workout-reminders', {
      name: 'Workout Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#F97316',
    });
  }

  return true;
}

export async function scheduleWorkoutReminder(
  hour: number,
  minute: number,
  days: number[] // 0 = Sunday, 1 = Monday, etc.
): Promise<string | null> {
  try {
    // Cancel existing reminders first
    await cancelAllReminders();

    const trigger: Notifications.DailyTriggerInput = {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    };

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Time to Workout! 💪',
        body: 'Your scheduled workout is waiting. Let\'s crush it!',
        data: { type: 'workout_reminder' },
      },
      trigger,
    });

    return id;
  } catch (error) {
    console.log('Error scheduling notification:', error);
    return null;
  }
}

export async function scheduleWeeklySummary(): Promise<string | null> {
  try {
    const trigger: Notifications.WeeklyTriggerInput = {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      hour: 10,
      minute: 0,
      weekday: 1, // Monday
    };

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Weekly Summary 📊',
        body: 'Check out your workout progress for this week!',
        data: { type: 'weekly_summary' },
      },
      trigger,
    });

    return id;
  } catch (error) {
    console.log('Error scheduling weekly summary:', error);
    return null;
  }
}

export async function cancelAllReminders(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
  return await Notifications.getAllScheduledNotificationsAsync();
}