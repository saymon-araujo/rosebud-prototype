import { StyleSheet, View, Text, TouchableOpacity } from "react-native"
import { Ionicons } from "@expo/vector-icons"

export const UserBubble = ({ message, timestamp }) => {
  return (
    <View style={styles.userBubbleContainer}>
      <View style={styles.userBubble}>
        <Text style={styles.userBubbleText}>{message}</Text>
        {timestamp && <Text style={styles.userTimestamp}>{timestamp}</Text>}
      </View>
    </View>
  )
}

export const AIBubble = ({ message, timestamp, type }) => {
  // Get icon based on suggestion type
  const getIcon = () => {
    switch (type) {
      case "sleep":
        return "moon-outline"
      case "stress":
        return "leaf-outline"
      case "hydration":
        return "water-outline"
      case "exercise":
        return "fitness-outline"
      case "nutrition":
        return "nutrition-outline"
      case "screen-time":
        return "phone-portrait-outline"
      case "social":
        return "people-outline"
      case "mindfulness":
        return "flower-outline"
      case "productivity":
        return "calendar-outline"
      default:
        return "chatbubble-ellipses-outline"
    }
  }

  return (
    <View style={styles.aiBubbleContainer}>
      <View style={styles.aiAvatarContainer}>
        <Ionicons name="sparkles" size={16} color="#fff" />
      </View>
      <View style={styles.aiBubble}>
        <View style={styles.aiBubbleHeader}>
          <Ionicons name={getIcon()} size={16} color="#4a6fa5" style={styles.icon} />
          <Text style={styles.aiBubbleHeaderText}>Journal AI</Text>
        </View>
        <Text style={styles.aiBubbleText}>{message}</Text>
        {timestamp && <Text style={styles.aiTimestamp}>{timestamp}</Text>}
      </View>
    </View>
  )
}

export const QuickReplyButton = ({ text, onPress, primary = true }) => {
  return (
    <TouchableOpacity
      style={[styles.quickReplyButton, primary ? styles.primaryButton : styles.secondaryButton]}
      onPress={onPress}
    >
      <Text style={[styles.quickReplyText, primary ? styles.primaryButtonText : styles.secondaryButtonText]}>
        {text}
      </Text>
    </TouchableOpacity>
  )
}

export const QuickReplyContainer = ({ children }) => {
  return <View style={styles.quickReplyContainer}>{children}</View>
}

export const SystemMessage = ({ message }) => {
  return (
    <View style={styles.systemMessageContainer}>
      <Text style={styles.systemMessageText}>{message}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  // User bubble styles
  userBubbleContainer: {
    alignItems: "flex-end",
    marginVertical: 4,
    marginHorizontal: 12,
  },
  userBubble: {
    backgroundColor: "#dcf8c6", // WhatsApp green
    borderRadius: 16,
    borderTopRightRadius: 4,
    maxWidth: "80%",
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 80,
  },
  userBubbleText: {
    color: "#000",
    fontSize: 16,
  },
  userTimestamp: {
    color: "#7c8b95",
    fontSize: 11,
    alignSelf: "flex-end",
    marginTop: 4,
  },

  // AI bubble styles
  aiBubbleContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginVertical: 4,
    marginHorizontal: 12,
  },
  aiAvatarContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#4a6fa5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
    marginBottom: 4,
  },
  aiBubble: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderTopLeftRadius: 4,
    maxWidth: "80%",
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 80,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  aiBubbleHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  icon: {
    marginRight: 6,
  },
  aiBubbleHeaderText: {
    color: "#4a6fa5",
    fontWeight: "bold",
    fontSize: 14,
  },
  aiBubbleText: {
    color: "#212529",
    fontSize: 16,
  },
  aiTimestamp: {
    color: "#7c8b95",
    fontSize: 11,
    alignSelf: "flex-end",
    marginTop: 4,
  },

  // Quick reply styles
  quickReplyContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginVertical: 12,
    paddingHorizontal: 12,
  },
  quickReplyButton: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    margin: 4,
    minWidth: 80,
    justifyContent: "center",
    alignItems: "center",
  },
  primaryButton: {
    backgroundColor: "#4a6fa5",
  },
  secondaryButton: {
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#4a6fa5",
  },
  quickReplyText: {
    fontSize: 14,
    fontWeight: "500",
  },
  primaryButtonText: {
    color: "#fff",
  },
  secondaryButtonText: {
    color: "#4a6fa5",
  },

  // System message styles
  systemMessageContainer: {
    alignItems: "center",
    marginVertical: 8,
  },
  systemMessageText: {
    color: "#7c8b95",
    fontSize: 12,
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
})
