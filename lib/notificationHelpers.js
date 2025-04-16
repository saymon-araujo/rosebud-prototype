import AsyncStorage from "@react-native-async-storage/async-storage"

// Store handled notification IDs to prevent duplicate processing
export const markNotificationAsHandled = async (notificationId) => {
  try {
    const handledNotifications = await getHandledNotifications()
    handledNotifications.push(notificationId)

    // Only keep the last 100 handled notifications to prevent storage bloat
    const trimmedList = handledNotifications.slice(-100)

    await AsyncStorage.setItem("handled_notifications", JSON.stringify(trimmedList))
    return true
  } catch (error) {
    console.error("Error marking notification as handled:", error)
    return false
  }
}

// Check if a notification has already been handled
export const isNotificationHandled = async (notificationId) => {
  try {
    const handledNotifications = await getHandledNotifications()
    return handledNotifications.includes(notificationId)
  } catch (error) {
    console.error("Error checking if notification is handled:", error)
    return false
  }
}

// Get the list of handled notification IDs
export const getHandledNotifications = async () => {
  try {
    const handledNotificationsJson = await AsyncStorage.getItem("handled_notifications")
    return handledNotificationsJson ? JSON.parse(handledNotificationsJson) : []
  } catch (error) {
    console.error("Error getting handled notifications:", error)
    return []
  }
}

// Clear the list of handled notification IDs
export const clearHandledNotifications = async () => {
  try {
    await AsyncStorage.setItem("handled_notifications", JSON.stringify([]))
    return true
  } catch (error) {
    console.error("Error clearing handled notifications:", error)
    return false
  }
}
