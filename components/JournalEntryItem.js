import { StyleSheet, View, Text, TouchableOpacity } from "react-native"
import { Ionicons } from "@expo/vector-icons"

export default function JournalEntryItem({ entry, onPress }) {
  // Format date to a readable format
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  // Truncate content if it's too long
  const truncateContent = (content, maxLength = 100) => {
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength) + "..."
  }

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.dateContainer}>
        <Text style={styles.date}>{formatDate(entry.created_at)}</Text>
      </View>
      <Text style={styles.content}>{truncateContent(entry.content)}</Text>
      <View style={styles.footer}>
        {entry.processed ? (
          <View style={styles.processedContainer}>
            <Ionicons name="checkmark-circle" size={16} color="#28a745" />
            <Text style={styles.processedText}>AI Analyzed</Text>
          </View>
        ) : (
          <View style={styles.processedContainer}>
            <Ionicons name="time-outline" size={16} color="#ffc107" />
            <Text style={styles.pendingText}>Pending Analysis</Text>
          </View>
        )}
        <Ionicons name="chevron-forward" size={16} color="#adb5bd" />
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  dateContainer: {
    marginBottom: 10,
  },
  date: {
    fontSize: 14,
    color: "#6c757d",
    fontWeight: "500",
  },
  content: {
    fontSize: 16,
    color: "#212529",
    marginBottom: 10,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  processedContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  processedText: {
    fontSize: 12,
    color: "#28a745",
    marginLeft: 5,
  },
  pendingText: {
    fontSize: 12,
    color: "#ffc107",
    marginLeft: 5,
  },
})
