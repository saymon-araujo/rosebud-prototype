import { StyleSheet, View, Text } from "react-native"
import { Ionicons } from "@expo/vector-icons"

type SuggestionType =
  | "sleep"
  | "stress"
  | "hydration"
  | "exercise"
  | "nutrition"
  | "screen-time"
  | "social"
  | "mindfulness"
  | "productivity"
  | string;

interface AIResponseBubbleProps {
  response: string;
  type?: SuggestionType;
}

export default function AIResponseBubble({ response, type }: AIResponseBubbleProps): JSX.Element {
  // Get icon based on suggestion type
  const getIcon = (): string => {
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
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Ionicons name="sparkles" size={20} color="#fff" />
        </View>
        <Text style={styles.headerText}>Journal AI</Text>
      </View>
      <View style={styles.messageContainer}>
        <Ionicons name={getIcon()} size={20} color="#4a6fa5" style={styles.icon} />
        <Text style={styles.messageText}>{response}</Text>
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
    marginTop: 20,
  },
  header: {
    backgroundColor: "#4a6fa5",
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  headerText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  messageContainer: {
    padding: 15,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  icon: {
    marginRight: 10,
    marginTop: 2,
  },
  messageText: {
    flex: 1,
    fontSize: 16,
    color: "#212529",
    lineHeight: 22,
  },
}) 