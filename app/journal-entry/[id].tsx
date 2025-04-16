import { useState, useContext, useEffect } from "react"
import {
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { AuthContext } from "@/context/AuthContext"
import { SupabaseContext } from "@/context/SupabaseContext"
import { NotificationContext } from "@/context/NotificationContext"
import AIResponseBubble from "@/components/AIResponseBubble"
import { useLocalSearchParams, useRouter } from "expo-router"
import { scheduleNotification } from "@/lib/notifications"

// Define interface for journal entry
interface JournalEntry {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  processed: boolean;
  suggestions?: Array<{
    type: string;
    response_text: string;
  }>;
}

export default function JournalEntryDetailsScreen() {
  const router = useRouter()
  const { user } = useContext(AuthContext)
  const { supabase } = useContext(SupabaseContext)
  const { requestPermissions } = useContext(NotificationContext)
  const [content, setContent] = useState("")
  const [loading, setLoading] = useState(false)
  const [aiResponse, setAiResponse] = useState<{ type: string, response: string } | null>(null)
  const [showReminderOptions, setShowReminderOptions] = useState(false)
  const params = useLocalSearchParams()
  const id = typeof params.id === 'string' ? params.id : '';

  useEffect(() => {
    if (id) {
      fetchEntryDetails()
    }
  }, [id])

  const fetchEntryDetails = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("journal_entries")
        .select(`
          *,
          suggestions!suggestions_entry_id_fkey(*)
        `)
        .eq("id", id)
        .single()

      if (error) throw error

      if (data) {
        setContent(data.content)
        if (data.suggestions && data.suggestions.length > 0) {
          setAiResponse({
            type: data.suggestions[0].type,
            response: data.suggestions[0].response_text,
          })
        }
      }
    } catch (error) {
      console.error("Error fetching entry details:", error)
      Alert.alert("Error", "Failed to load journal entry")
    } finally {
      setLoading(false)
    }
  }

  const handleSetReminder = async () => {
    setShowReminderOptions(true)
    // Implementation would go here
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4a6fa5" />
        <Text style={styles.loadingText}>Loading journal entry...</Text>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardAvoidView}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#4a6fa5" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Your Journal Entry</Text>
          </View>

          <View style={styles.entryContainer}>
            <Text style={styles.entryText}>{content}</Text>
          </View>

          {aiResponse && (
            <AIResponseBubble response={aiResponse.response} type={aiResponse.type} />
          )}

          {!showReminderOptions && aiResponse && (
            <View style={styles.responseButtonsContainer}>
              <TouchableOpacity style={[styles.responseButton, styles.yesButton]} onPress={handleSetReminder}>
                <Text style={styles.responseButtonText}>Yes, remind me</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.responseButton, styles.noButton]}
                onPress={() => router.push("/")}
              >
                <Text style={styles.responseButtonText}>No, thanks</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  keyboardAvoidView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: 20,
    flexGrow: 1,
  },
  header: {
    marginBottom: 20,
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
    backgroundColor: "#f8f9fa",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#6c757d",
  },
  entryContainer: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    borderWidth: 1,
    borderColor: "#e9ecef",
    marginBottom: 20,
  },
  entryText: {
    fontSize: 16,
    color: "#212529",
  },
  responseButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  responseButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginHorizontal: 5,
  },
  yesButton: {
    backgroundColor: "#4a6fa5",
  },
  noButton: {
    backgroundColor: "#6c757d",
  },
  responseButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
}) 