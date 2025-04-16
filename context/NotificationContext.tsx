import React, { createContext, useState, useEffect, useRef, useContext, ReactNode } from "react";
import * as Notifications from "expo-notifications";
import { Alert, Linking } from "react-native";
import { registerForPushNotificationsAsync } from "../lib/notifications";
import { SupabaseContext } from "./SupabaseContext";
import { isNotificationHandled, markNotificationAsHandled } from "../lib/notificationHelpers";
import { NotificationData } from "../types";

interface NotificationContextType {
  expoPushToken: string;
  notification: Notifications.Notification | false;
  requestPermissions: () => Promise<boolean>;
}

export const NotificationContext = createContext<NotificationContextType>({
  expoPushToken: "",
  notification: false,
  requestPermissions: async () => false,
});

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [expoPushToken, setExpoPushToken] = useState<string>("");
  const [notification, setNotification] = useState<Notifications.Notification | false>(false);
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);
  const { supabase } = useContext(SupabaseContext) || { supabase: null };

  useEffect(() => {
    if (!supabase) return;

    // Register for push notifications
    registerForPushNotificationsAsync().then((token) => {
      setExpoPushToken(token || "");
    });

    // Set up notification categories
    setupNotificationCategories();

    // Listen for incoming notifications when the app is in the foreground
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      setNotification(notification);
    });

    // Listen for user interaction with notifications
    responseListener.current = Notifications.addNotificationResponseReceivedListener(handleNotificationResponse);

    return () => {
      // Clean up listeners
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [supabase]);

  // Set up notification categories with actions
  const setupNotificationCategories = async (): Promise<void> => {
    try {
      await Notifications.setNotificationCategoryAsync("reminder", [
        {
          identifier: "complete",
          buttonTitle: "Complete",
          options: {
            isDestructive: false,
            isAuthenticationRequired: false,
          },
        },
        {
          identifier: "snooze",
          buttonTitle: "Snooze 30m",
          options: {
            isDestructive: false,
            isAuthenticationRequired: false,
          },
        },
      ]);
    } catch (error) {
      console.error("Error setting up notification categories:", error);
    }
  };

  // Handle notification responses (when user taps on a notification or action button)
  const handleNotificationResponse = async (response: Notifications.NotificationResponse): Promise<void> => {
    if (!supabase) return;

    const {
      notification: {
        request: { content, identifier: notificationId },
      },
      actionIdentifier,
    } = response;

    // Get the reminder ID from the notification data
    const notificationData = content.data as NotificationData | undefined;
    const reminderId = notificationData?.reminderId;

    if (!reminderId) {
      console.log("No reminder ID found in notification");
      return;
    }

    // Check if this notification has already been handled to prevent duplicates
    const alreadyHandled = await isNotificationHandled(notificationId);
    if (alreadyHandled) {
      console.log(`Notification ${notificationId} already handled, skipping`);
      return;
    }

    try {
      // Handle different actions
      if (actionIdentifier === "complete" || actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER) {
        // Mark reminder as completed in the database
        await supabase.from("reminders").update({ status: "completed" }).eq("id", reminderId);
        console.log(`Reminder ${reminderId} marked as completed`);
      } else if (actionIdentifier === "snooze") {
        // Get the reminder details
        const { data: reminderData, error: reminderError } = await supabase
          .from("reminders")
          .select("*")
          .eq("id", reminderId)
          .single();

        if (reminderError) throw reminderError;

        if (reminderData) {
          // Schedule a new notification for 30 minutes later
          const snoozeTime = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes from now

          // Cancel the old notification if it exists
          if (reminderData.notification_id) {
            await Notifications.cancelScheduledNotificationAsync(reminderData.notification_id);
          }

          // Schedule a new notification
          const newNotificationId = await Notifications.scheduleNotificationAsync({
            content: {
              title: reminderData.title,
              body: `[Snoozed] ${reminderData.body}`,
              sound: true,
              priority: Notifications.AndroidNotificationPriority.HIGH,
              data: { reminderId } as NotificationData,
              categoryIdentifier: "reminder",
            },
            trigger: { date: snoozeTime },
          });

          // Update the reminder with the new notification ID and time
          await supabase
            .from("reminders")
            .update({
              notification_id: newNotificationId,
              time: snoozeTime.toISOString(),
            })
            .eq("id", reminderId);

          console.log(`Reminder ${reminderId} snoozed for 30 minutes`);
        }
      }

      // Mark this notification as handled
      await markNotificationAsHandled(notificationId);
    } catch (error) {
      console.error("Error handling notification action:", error);
    }
  };

  // Request permissions with improved handling
  const requestPermissions = async (): Promise<boolean> => {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Notifications are required for reminders to work. Would you like to enable them in settings?",
          [
            {
              text: "No",
              style: "cancel",
            },
            {
              text: "Yes",
              onPress: () => Linking.openSettings(),
            },
          ],
        );
        return false;
      }
    }

    return true;
  };

  return (
    <NotificationContext.Provider
      value={{
        expoPushToken,
        notification,
        requestPermissions,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = (): NotificationContextType => useContext(NotificationContext); 