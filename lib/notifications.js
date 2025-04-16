import * as Notifications from "expo-notifications"
import * as Device from "expo-device"
import { Platform } from "react-native"

// Configure how notifications appear when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

// Request permission for notifications
export async function registerForPushNotificationsAsync() {
  let token

  if (Platform.OS === "android") {
    // Set notification channel for Android
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#4a6fa5",
    })
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync()
    let finalStatus = existingStatus

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync()
      finalStatus = status
    }

    if (finalStatus !== "granted") {
      console.log("Failed to get push token for push notification!")
      return null
    }

    // Only get the token if we're using remote notifications
    // For local notifications, we don't need a token
    // token = (await Notifications.getExpoPushTokenAsync()).data;
  } else {
    console.log("Must use physical device for push notifications")
  }

  return token
}

// Schedule a local notification with actions
export async function scheduleNotification(title, body, trigger, reminderId, isSnooze = false) {
  try {
    // Schedule the notification with category identifier for actions
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        data: { reminderId },
        categoryIdentifier: "reminder", // This links to the category with actions
      },
      trigger,
    })

    return id
  } catch (error) {
    console.error("Error scheduling notification:", error)
    throw error
  }
}

// Cancel a scheduled notification
export async function cancelNotification(notificationId) {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId)
  } catch (error) {
    console.error("Error canceling notification:", error)
    throw error
  }
}

// Cancel all scheduled notifications
export async function cancelAllNotifications() {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync()
  } catch (error) {
    console.error("Error canceling all notifications:", error)
    throw error
  }
}

// Get all scheduled notifications
export async function getAllScheduledNotifications() {
  try {
    return await Notifications.getAllScheduledNotificationsAsync()
  } catch (error) {
    console.error("Error getting scheduled notifications:", error)
    throw error
  }
}
