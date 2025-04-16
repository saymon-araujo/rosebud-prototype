import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Configure notifications to show alerts and badges when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Register the device for push notifications
export async function registerForPushNotificationsAsync(): Promise<string | undefined> {
  let token;

  // Only proceed if the app is running on a physical device (not simulator/emulator)
  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // If we don't have permission yet, ask the user for it
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    // If we still don't have permission, return undefined
    if (finalStatus !== 'granted') {
      return undefined;
    }

    // Get the Expo push token
    try {
      token = (await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      })).data;
    } catch (error) {
      // Error getting push token
    }
  } else {
    // Must use physical device for Push Notifications
  }

  // Additional setup for Android
  if (Platform.OS === 'android') {
    try {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    } catch (error) {
      console.error("Error setting up Android notification channel:", error);
      // Error setting up Android notification channel
    }
  }

  return token;
} 