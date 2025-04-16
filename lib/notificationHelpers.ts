import AsyncStorage from '@react-native-async-storage/async-storage';

// Prefix for storing notification handling status
const NOTIFICATION_HANDLED_PREFIX = 'notification_handled_';

/**
 * Check if a notification has already been handled
 * This prevents duplicate processing of the same notification
 */
export async function isNotificationHandled(notificationId: string): Promise<boolean> {
  try {
    const key = `${NOTIFICATION_HANDLED_PREFIX}${notificationId}`;
    const value = await AsyncStorage.getItem(key);
    return value === 'true';
  } catch (error) {
    console.error('Error checking notification handling status:', error);
    return false;
  }
}

/**
 * Mark a notification as handled
 * This prevents duplicate processing of the same notification
 */
export async function markNotificationAsHandled(notificationId: string): Promise<void> {
  try {
    const key = `${NOTIFICATION_HANDLED_PREFIX}${notificationId}`;
    await AsyncStorage.setItem(key, 'true');
    
    // Clean up old notification records (optional)
    cleanupOldNotificationRecords();
  } catch (error) {
    console.error('Error marking notification as handled:', error);
  }
}

/**
 * Clean up old notification records
 * This prevents AsyncStorage from filling up with old records
 */
async function cleanupOldNotificationRecords(): Promise<void> {
  try {
    // Get all keys
    const keys = await AsyncStorage.getAllKeys();
    
    // Filter notification handling keys
    const notificationKeys = keys.filter((key: string) => key.startsWith(NOTIFICATION_HANDLED_PREFIX));
    
    // If there are more than 100 keys, remove the oldest ones
    if (notificationKeys.length > 100) {
      // Sort by key (which should include a timestamp)
      const keysToRemove = notificationKeys.slice(0, notificationKeys.length - 100);
      await AsyncStorage.multiRemove(keysToRemove);
    }
  } catch (error) {
    console.error('Error cleaning up old notification records:', error);
  }
} 