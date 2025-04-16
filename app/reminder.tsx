

import { useContext, useEffect, useState } from "react"
import { StyleSheet, View, Text, FlatList, ActivityIndicator, TouchableOpacity, Alert } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { AuthContext } from "../context/AuthContext"
import { SupabaseContext } from "../context/SupabaseContext"
import { cancelNotification, scheduleNotification } from "../lib/notifications"
import { useRouter } from "expo-router"

export default function ReminderScreen() {
  const { user } = useContext(AuthContext)
  const { supabase } = useContext(SupabaseContext)
  const [reminders, setReminders] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchReminders()
  }, [])

  const fetchReminders = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("reminders")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("time", { ascending: true })

      if (error) throw error
      setReminders(data || [])
    } catch (error) {
      console.error("Error fetching reminders:", error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    fetchReminders()
  }

  const handleCompleteReminder = async (id, notificationId) => {
    try {
      // Cancel the scheduled notification if it exists
      if (notificationId) {
        try {
          await cancelNotification(notificationId)
        } catch (notifError) {
          console.error("Error canceling notification:", notifError)
          // Continue even if notification cancellation fails
        }
      }

      const { error } = await supabase.from("reminders").update({ status: "completed" }).eq("id", id)

      if (error) throw error

      // Update the local state
      setReminders(reminders.filter((reminder) => reminder.id !== id))

      Alert.alert("Success", "Reminder marked as completed")
    } catch (error) {
      console.error("Error completing reminder:", error)
      Alert.alert("Error", "Failed to update reminder")
    }
  }

  const handleDeleteReminder = async (id, notificationId) => {
    try {
      // Cancel the scheduled notification if it exists
      if (notificationId) {
        try {
          await cancelNotification(notificationId)
        } catch (notifError) {
          console.error("Error canceling notification:", notifError)
          // Continue even if notification cancellation fails
        }
      }

      const { error } = await supabase.from("reminders").update({ status: "deleted" }).eq("id", id)

      if (error) throw error

      // Update the local state
      setReminders(reminders.filter((reminder) => reminder.id !== id))

      Alert.alert("Success", "Reminder deleted")
    } catch (error) {
      console.error("Error deleting reminder:", error)
      Alert.alert("Error", "Failed to delete reminder")
    }
  }

  const handleSnoozeReminder = async (id, notificationId) => {
    try {
      // Cancel the existing notification if it exists
      if (notificationId) {
        try {
          await cancelNotification(notificationId)
        } catch (notifError) {
          console.error("Error canceling notification:", notifError)
          // Continue even if notification cancellation fails
        }
      }

      // Get the reminder details
      const { data: reminderData, error: reminderError } = await supabase
        .from("reminders")
        .select("*")
        .eq("id", id)
        .single()

      if (reminderError) throw reminderError

      if (reminderData) {
        // Schedule a new notification for 30 minutes later
        const snoozeTime = new Date(Date.now() + 30 * 60 * 1000) // 30 minutes from now

        // Schedule a new notification with the snoozed time
        const newNotificationId = await scheduleNotification(
          reminderData.title,
          `[Snoozed] ${reminderData.body}`,
          { date: snoozeTime },
          reminderData.id,
          true,
        )

        // Update the reminder with the new notification ID and time
        const { error: updateError } = await supabase
          .from("reminders")
          .update({
            notification_id: newNotificationId,
            time: snoozeTime.toISOString(),
          })
          .eq("id", id)

        if (updateError) throw updateError

        // Update the local state
        setReminders(
          reminders.map((reminder) =>
            reminder.id === id
              ? { ...reminder, time: snoozeTime.toISOString(), notification_id: newNotificationId }
              : reminder,
          ),
        )

        Alert.alert("Success", "Reminder snoozed for 30 minutes")
      }
    } catch (error) {
      console.error("Error snoozing reminder:", error)
      Alert.alert("Error", "Failed to snooze reminder")
    }
  }

  const formatReminderTime = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const renderReminderItem = ({ item }) => (
    <View style={styles.reminderItem}>
      <View style={styles.reminderHeader}>
        <Text style={styles.reminderTitle}>{item.title}</Text>
        <View style={styles.reminderActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleCompleteReminder(item.id, item.notification_id)}
          >
            <Ionicons name="checkmark-circle-outline" size={24} color="#28a745" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleSnoozeReminder(item.id, item.notification_id)}
          >
            <Ionicons name="time-outline" size={24} color="#ffc107" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeleteReminder(item.id, item.notification_id)}
          >
            <Ionicons name="trash-outline" size={24} color="#dc3545" />
          </TouchableOpacity>
        </View>
      </View>
      <Text style={styles.reminderBody}>{item.body}</Text>
      <View style={styles.reminderFooter}>
        <Ionicons name="time-outline" size={16} color="#6c757d" />
        <Text style={styles.reminderTime}>{formatReminderTime(item.time)}</Text>
      </View>
    </View>
  )

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="notifications-outline" size={64} color="#adb5bd" />
      <Text style={styles.emptyText}>No active reminders</Text>
      <Text style={styles.emptySubText}>Reminders will appear here when you set them from journal entries</Text>
      <TouchableOpacity style={styles.newEntryButton} onPress={() => router.push("/journal-entry")}>
        <Text style={styles.newEntryButtonText}>Create New Journal Entry</Text>
      </TouchableOpacity>
    </View>
  )

  return (
    <SafeAreaView style={styles.container}>


      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color="#4a6fa5" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Reminders</Text>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4a6fa5" />
          <Text style={styles.loadingText}>Loading reminders...</Text>
        </View>
      ) : (
        <FlatList
          data={reminders}
          keyExtractor={(item) => item.id}
          renderItem={renderReminderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyList}
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#212529",
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#6c757d",
  },
  listContent: {
    padding: 20,
    flexGrow: 1,
  },
  reminderItem: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  reminderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  reminderTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#212529",
    flex: 1,
  },
  reminderActions: {
    flexDirection: "row",
  },
  actionButton: {
    marginLeft: 15,
  },
  reminderBody: {
    fontSize: 16,
    color: "#212529",
    marginBottom: 15,
  },
  reminderFooter: {
    flexDirection: "row",
    alignItems: "center",
  },
  reminderTime: {
    fontSize: 14,
    color: "#6c757d",
    marginLeft: 5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#6c757d",
    marginTop: 20,
  },
  emptySubText: {
    fontSize: 14,
    color: "#adb5bd",
    textAlign: "center",
    marginTop: 10,
  },
  newEntryButton: {
    backgroundColor: "#4a6fa5",
    borderRadius: 10,
    padding: 15,
    alignItems: "center",
    marginTop: 20,
    paddingHorizontal: 30,
  },
  newEntryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
})
