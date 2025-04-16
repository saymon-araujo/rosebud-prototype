import React, { useState, useContext, useEffect } from "react"
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { AuthContext } from "@/context/AuthContext"
import { SupabaseContext } from "@/context/SupabaseContext"
import { NotificationContext } from "@/context/NotificationContext"
import AIResponseBubble from "@/components/AIResponseBubble"
import { analyzeJournalEntry, getFallbackAnalysis } from "@/lib/openai"
import { scheduleNotification } from "@/lib/notifications"
import { useLocalSearchParams, useRouter } from "expo-router"

export default function JournalEntryScreen() {
  const router = useRouter()
  const { user } = useContext(AuthContext)
  const { supabase } = useContext(SupabaseContext)
  const { requestPermissions } = useContext(NotificationContext)
  const [content, setContent] = useState("")
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [aiResponse, setAiResponse] = useState(null)
  const [showReminderOptions, setShowReminderOptions] = useState(false)
  const { entryId } = useLocalSearchParams();

  useEffect(() => {
    if (entryId) {
      fetchEntryDetails()
    }
  }, [entryId])

  const fetchEntryDetails = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("journal_entries")
        .select(`
          *,
          suggestions!suggestions_entry_id_fkey(*)
        `)
        .eq("id", entryId)
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

  const handleSubmit = async () => {
    if (!content.trim()) {
      Alert.alert("Error", "Please enter some content for your journal entry")
      return
    }

    try {
      setLoading(true)

      // Save journal entry to Supabase
      const { data: entryData, error: entryError } = await supabase
        .from("journal_entries")
        .insert([{ user_id: user.id, content, processed: false }])
        .select()
        .single()

      if (entryError) throw entryError

      // Analyze the entry with OpenAI
      setAnalyzing(true)
      try {
        const analysis = await analyzeJournalEntry(content, user.id)
        setAiResponse(analysis)

        // Save the suggestion to Supabase
        const { error: suggestionError } = await supabase.from("suggestions").insert([
          {
            entry_id: entryData.id,
            type: analysis.type,
            response_text: analysis.response,
          },
        ])

        if (suggestionError) throw suggestionError

        // Update the journal entry as processed
        const { error: updateError } = await supabase
          .from("journal_entries")
          .update({ processed: true })
          .eq("id", entryData.id)

        if (updateError) throw updateError
      } catch (error) {
        console.error("Error analyzing journal entry:", error)

        // Use fallback analysis if OpenAI fails
        const fallbackAnalysis = getFallbackAnalysis(content)
        setAiResponse(fallbackAnalysis)

        // Save the fallback suggestion to Supabase
        try {
          await supabase.from("suggestions").insert([
            {
              entry_id: entryData.id,
              type: fallbackAnalysis.type,
              response_text: fallbackAnalysis.response,
            },
          ])

          await supabase.from("journal_entries").update({ processed: true }).eq("id", entryData.id)
        } catch (fallbackError) {
          console.error("Error saving fallback analysis:", fallbackError)
          Alert.alert("Error", "Failed to analyze your journal entry")
        }
      } finally {
        setAnalyzing(false)
      }
    } catch (error) {
      console.error("Error saving journal entry:", error)
      Alert.alert("Error", "Failed to save your journal entry")
      setLoading(false)
      setAnalyzing(false)
    }
  }

  const handleSetReminder = async () => {
    // Request notification permissions
    const hasPermission = await requestPermissions()
    if (!hasPermission) {
      return
    }

    setShowReminderOptions(true)
  }

  const scheduleReminder = async (timeOption) => {
    try {
      // Get default time based on reminder type
      const reminderTime = new Date()
      let notificationId = null

      switch (timeOption) {
        case "evening":
          reminderTime.setHours(21, 0, 0, 0) // 9:00 PM
          break
        case "morning":
          reminderTime.setHours(8, 0, 0, 0) // 8:00 AM
          if (reminderTime < new Date()) {
            // If it's already past 8 AM, schedule for tomorrow
            reminderTime.setDate(reminderTime.getDate() + 1)
          }
          break
        case "afternoon":
          reminderTime.setHours(15, 0, 0, 0) // 3:00 PM
          if (reminderTime < new Date()) {
            // If it's already past 3 PM, schedule for tomorrow
            reminderTime.setDate(reminderTime.getDate() + 1)
          }
          break
        default:
          // Default to 1 hour from now
          reminderTime.setHours(reminderTime.getHours() + 1)
      }

      // First create the reminder in the database to get an ID
      const { data: reminderData, error: reminderError } = await supabase
        .from("reminders")
        .insert([
          {
            user_id: user.id,
            type: aiResponse.type,
            title: `${aiResponse.type.charAt(0).toUpperCase() + aiResponse.type.slice(1)} Reminder`,
            body: aiResponse.response.split("?")[0] + ".",
            time: reminderTime.toISOString(),
            status: "active",
          },
        ])
        .select()
        .single()

      if (reminderError) throw reminderError

      // Format the reminder message
      const title = `${aiResponse.type.charAt(0).toUpperCase() + aiResponse.type.slice(1)} Reminder`
      const body = aiResponse.response.split("?")[0] + "."

      // Schedule the local notification with actions
      notificationId = await scheduleNotification(title, body, { date: reminderTime }, reminderData.id, false)

      // Update the reminder with the notification ID
      const { error: updateError } = await supabase
        .from("reminders")
        .update({ notification_id: notificationId })
        .eq("id", reminderData.id)

      if (updateError) throw updateError

      Alert.alert(
        "Reminder Set",
        `Your reminder has been scheduled for ${reminderTime.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}`,
        [{ text: "OK", onPress: () => router.push("/") }],
      )
    } catch (error) {
      console.error("Error setting reminder:", error)
      Alert.alert("Error", "Failed to set reminder")
    } finally {
      setShowReminderOptions(false)
    }
  }

  if (loading && !analyzing && !aiResponse) {
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
          {!aiResponse ? (
            <>
              <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
                  <Ionicons name="arrow-back" size={24} color="#4a6fa5" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>How are you feeling today?</Text>
              </View>

              <TextInput
                style={styles.input}
                placeholder="Start writing your journal entry..."
                value={content}
                onChangeText={setContent}
                multiline
                textAlignVertical="top"
                autoFocus={!entryId}
                editable={!analyzing && !entryId}
              />
              {!analyzing && !entryId && (
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={handleSubmit}
                  disabled={!content.trim() || analyzing}
                >
                  <Text style={styles.submitButtonText}>Submit</Text>
                </TouchableOpacity>
              )}
              {analyzing && (
                <View style={styles.analyzingContainer}>
                  <ActivityIndicator size="small" color="#4a6fa5" />
                  <Text style={styles.analyzingText}>Analyzing your entry...</Text>
                </View>
              )}
            </>
          ) : (
            <>
              <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
                  <Ionicons name="arrow-back" size={24} color="#4a6fa5" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Your Journal Entry</Text>
              </View>

              <View style={styles.entryContainer}>
                <Text style={styles.entryText}>{content}</Text>
              </View>

              <AIResponseBubble response={aiResponse.response} type={aiResponse.type} />

              {!showReminderOptions ? (
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
              ) : (
                <View style={styles.reminderOptionsContainer}>
                  <Text style={styles.reminderOptionsTitle}>When would you like to be reminded?</Text>
                  <TouchableOpacity style={styles.timeOptionButton} onPress={() => scheduleReminder("morning")}>
                    <Ionicons name="sunny-outline" size={20} color="#4a6fa5" />
                    <Text style={styles.timeOptionText}>Morning (8:00 AM)</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.timeOptionButton} onPress={() => scheduleReminder("afternoon")}>
                    <Ionicons name="partly-sunny-outline" size={20} color="#4a6fa5" />
                    <Text style={styles.timeOptionText}>Afternoon (3:00 PM)</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.timeOptionButton} onPress={() => scheduleReminder("evening")}>
                    <Ionicons name="moon-outline" size={20} color="#4a6fa5" />
                    <Text style={styles.timeOptionText}>Evening (9:00 PM)</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.timeOptionButton, styles.cancelButton]}
                    onPress={() => setShowReminderOptions(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
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
  headerText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#212529",
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
  input: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    minHeight: 200,
    borderWidth: 1,
    borderColor: "#e9ecef",
    fontSize: 16,
    color: "#212529",
  },
  submitButton: {
    backgroundColor: "#4a6fa5",
    borderRadius: 10,
    padding: 15,
    alignItems: "center",
    marginTop: 20,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
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
  analyzingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  analyzingText: {
    marginLeft: 10,
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
    fontSize: 16,
    fontWeight: "bold",
  },
  reminderOptionsContainer: {
    marginTop: 20,
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  reminderOptionsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#212529",
    marginBottom: 15,
    textAlign: "center",
  },
  timeOptionButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  timeOptionText: {
    fontSize: 16,
    color: "#212529",
    marginLeft: 10,
  },
  cancelButton: {
    justifyContent: "center",
    borderBottomWidth: 0,
  },
  cancelButtonText: {
    fontSize: 16,
    color: "#dc3545",
    textAlign: "center",
  },
})
