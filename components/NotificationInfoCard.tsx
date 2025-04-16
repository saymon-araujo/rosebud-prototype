import { StyleSheet, View, Text } from "react-native"
import { Ionicons } from "@expo/vector-icons"

export default function NotificationInfoCard(): JSX.Element {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="information-circle" size={24} color="#fff" />
        <Text style={styles.headerText}>Notification Actions</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>New Notification Features</Text>
        <Text style={styles.description}>You can now interact with reminders directly from notifications:</Text>

        <View style={styles.actionItem}>
          <Ionicons name="checkmark-circle-outline" size={20} color="#28a745" style={styles.actionIcon} />
          <Text style={styles.actionText}>
            <Text style={styles.bold}>Complete:</Text> Mark the reminder as completed
          </Text>
        </View>

        <View style={styles.actionItem}>
          <Ionicons name="time-outline" size={20} color="#ffc107" style={styles.actionIcon} />
          <Text style={styles.actionText}>
            <Text style={styles.bold}>Snooze:</Text> Postpone the reminder for 30 minutes
          </Text>
        </View>

        <Text style={styles.note}>
          Note: Notification actions may appear differently depending on your device and OS version.
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e9ecef",
    marginVertical: 15,
  },
  header: {
    backgroundColor: "#4a6fa5",
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  headerText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    marginLeft: 8,
  },
  content: {
    padding: 15,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#212529",
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: "#495057",
    marginBottom: 12,
  },
  actionItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  actionIcon: {
    marginRight: 10,
  },
  actionText: {
    fontSize: 14,
    color: "#495057",
  },
  bold: {
    fontWeight: "bold",
  },
  note: {
    fontSize: 12,
    color: "#6c757d",
    fontStyle: "italic",
    marginTop: 10,
  },
}) 