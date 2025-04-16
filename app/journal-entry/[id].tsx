import React, { useState, useContext, useEffect, useRef } from "react"
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  Keyboard,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { AuthContext } from "@/context/AuthContext"
import { SupabaseContext } from "@/context/SupabaseContext"
import { NotificationContext } from "@/context/NotificationContext"
import { analyzeJournalEntry, getFallbackAnalysis, getSuggestedTimes, parseTimeString } from "@/lib/openai"
import { scheduleNotification } from "@/lib/notifications"
import { UserBubble, AIBubble, QuickReplyButton, QuickReplyContainer, SystemMessage } from "@/components/ChatBubble"
import TimePickerModal from "@/components/TimePickerModal"
import { router, useLocalSearchParams, useRouter } from "expo-router"

// Message types
const MESSAGE_TYPE = {
  USER: "user",
  AI: "ai",
  SYSTEM: "system",
}

// Chat states
const CHAT_STATE = {
  INITIAL: "initial",
  WAITING_FOR_ENTRY: "waiting_for_entry",
  ANALYZING: "analyzing",
  WAITING_FOR_REMINDER_CONFIRMATION: "waiting_for_reminder_confirmation",
  WAITING_FOR_TIME_SELECTION: "waiting_for_time_selection",
  REMINDER_SET: "reminder_set",
}

export default function JournalEntryScreen() {
  const { user } = useContext(AuthContext)
  const { supabase } = useContext(SupabaseContext)
  const { requestPermissions } = useContext(NotificationContext)
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState("")
  const [chatState, setChatState] = useState(CHAT_STATE.INITIAL)
  const [loading, setLoading] = useState(false)
  const [aiResponse, setAiResponse] = useState<{ type: string, response: string } | null>(null)
  const [suggestedTimes, setSuggestedTimes] = useState([])
  const [showReminderOptions, setShowReminderOptions] = useState(false)
  const params = useLocalSearchParams()
  const flatListRef = useRef(null)
  const entryId = typeof params.id === 'string' ? params.id : '';
  const [showTimePicker, setShowTimePicker] = useState(false)

  const getCurrentTime = () => {
    const now = new Date();
    return now.toISOString();
  }
  // Add a message to the chat
  const addMessage = (content: string, type: string, additionalData = {}) => {
    const newMessage = {
      id: Date.now().toString(),
      content,
      type,
      timestamp: getCurrentTime(),
      ...additionalData,
    }

    setMessages((prevMessages: any) => [...prevMessages, newMessage])

    // Scroll to the bottom
    setTimeout(() => {
      if (flatListRef.current) {
        flatListRef.current.scrollToEnd({ animated: true })
      }
    }, 100)

    return newMessage
  }

  useEffect(() => {
    if (entryId) {
      fetchEntryDetails()
    } else {
      // Start a new chat
      addMessage("Hi there! 👋 How are you feeling today?", MESSAGE_TYPE.AI)
      setChatState(CHAT_STATE.WAITING_FOR_ENTRY)
    }
  }, [entryId])

  // Fetch entry details if editing an existing entry
  const fetchEntryDetails = async () => {
    try {
      setLoading(true)

      // First, fetch the journal entry
      const { data: entryData, error: entryError } = await supabase
        .from("journal_entries")
        .select("*")
        .eq("id", entryId)
        .single()

      if (entryError) throw entryError

      if (entryData) {
        // Add the user's journal entry as a message
        addMessage(entryData.content, MESSAGE_TYPE.USER)

        // Then, fetch the associated suggestion separately
        const { data: suggestionData, error: suggestionError } = await supabase
          .from("suggestions")
          .select("*")
          .eq("entry_id", entryId)

        if (suggestionError) throw suggestionError

        if (suggestionData && suggestionData.length > 0) {
          const suggestion = suggestionData[0]

          // Add the AI response as a message
          const aiMessage = addMessage(suggestion.response_text, MESSAGE_TYPE.AI, {
            suggestionType: suggestion.type,
          })

          setAiResponse({
            type: suggestion.type,
            response: suggestion.response_text,
          })

          // Set the chat state to waiting for reminder confirmation
          setChatState(CHAT_STATE.WAITING_FOR_REMINDER_CONFIRMATION)

          // Get suggested times based on the suggestion type
          const times = getSuggestedTimes(suggestion.type)
          setSuggestedTimes(times)
        }
      }
    } catch (error) {

      console.error("Error fetching entry details:", error)
      addMessage("Sorry, I couldn't load your previous entry. Let's start a new conversation.", MESSAGE_TYPE.SYSTEM)
      setChatState(CHAT_STATE.WAITING_FOR_ENTRY)
    } finally {
      setLoading(false)
    }
  }

  // Handle sending a journal entry
  const handleSendEntry = async () => {
    if (!inputText.trim()) return

    // Add the user's message to the chat
    addMessage(inputText, MESSAGE_TYPE.USER)

    // Clear the input field
    setInputText("")

    // Dismiss the keyboard
    Keyboard.dismiss()

    // Set the chat state to analyzing
    setChatState(CHAT_STATE.ANALYZING)

    try {
      setLoading(true)

      // Add a "thinking" message
      addMessage("Thinking...", MESSAGE_TYPE.SYSTEM)

      // Save journal entry to Supabase
      const { data: entryData, error: entryError } = await supabase
        .from("journal_entries")
        .insert([{ user_id: user.id, content: inputText, processed: false }])
        .select()
        .single()

      if (entryError) throw entryError

      // Analyze the entry with OpenAI
      try {
        const analysis = await analyzeJournalEntry(inputText, user.id)
        setAiResponse(analysis)

        // Remove the "thinking" message
        setMessages((prevMessages) => prevMessages.filter((msg) => msg.content !== "Thinking..."))

        // Add the AI response as a message
        const aiMessage = addMessage(analysis.response, MESSAGE_TYPE.AI, {
          suggestionType: analysis.type,
        })

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

        // Set the chat state to waiting for reminder confirmation
        setChatState(CHAT_STATE.WAITING_FOR_REMINDER_CONFIRMATION)

        // Get suggested times based on the suggestion type
        const times = getSuggestedTimes(analysis.type)
        setSuggestedTimes(times)
      } catch (error) {
        console.error("Error analyzing journal entry:", error)

        // Remove the "thinking" message
        setMessages((prevMessages) => prevMessages.filter((msg) => msg.content !== "Thinking..."))

        // Use fallback analysis if OpenAI fails
        const fallbackAnalysis = getFallbackAnalysis(inputText)
        setAiResponse(fallbackAnalysis)

        // Add the fallback AI response as a message
        const aiMessage = addMessage(fallbackAnalysis.response, MESSAGE_TYPE.AI, {
          suggestionType: fallbackAnalysis.type,
        })

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
        }

        // Set the chat state to waiting for reminder confirmation
        setChatState(CHAT_STATE.WAITING_FOR_REMINDER_CONFIRMATION)

        // Get suggested times based on the suggestion type
        const times = getSuggestedTimes(fallbackAnalysis.type)
        setSuggestedTimes(times)
      }
    } catch (error) {
      console.error("Error saving journal entry:", error)
      addMessage("Sorry, I couldn't save your entry. Please try again.", MESSAGE_TYPE.SYSTEM)
      setChatState(CHAT_STATE.WAITING_FOR_ENTRY)
    } finally {
      setLoading(false)
    }
  }

  // Handle reminder confirmation
  const handleReminderConfirmation = async (confirmed) => {
    if (confirmed) {
      // User wants a reminder
      addMessage("Great! When would you like to be reminded?", MESSAGE_TYPE.AI)
      setChatState(CHAT_STATE.WAITING_FOR_TIME_SELECTION)
    } else {
      // User doesn't want a reminder
      addMessage("No problem! I'm here whenever you need me.", MESSAGE_TYPE.AI)
      setChatState(CHAT_STATE.WAITING_FOR_ENTRY)
    }
  }

  // Handle time selection
  const handleTimeSelection = async (timeOption) => {
    if (timeOption === "custom") {
      // Show time picker for custom time
      setShowTimePicker(true)
    } else {
      // Schedule reminder for selected time
      await scheduleReminderForTime(timeOption)
    }
  }

  // Handle custom time selection from time picker
  const handleCustomTimeSelection = async (selectedTime) => {
    // Format the selected time
    const formattedTime = selectedTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

    // Schedule reminder for the custom time
    await scheduleReminderForTime(formattedTime, selectedTime)
  }

  // Schedule a reminder for the selected time
  const scheduleReminderForTime = async (timeOption, customTime = null) => {
    try {
      // Request notification permissions
      const hasPermission = await requestPermissions()
      if (!hasPermission) {
        addMessage("I need permission to send notifications for reminders.", MESSAGE_TYPE.SYSTEM)
        return
      }

      // Parse the time option to get a Date object
      let reminderTime

      if (customTime) {
        reminderTime = customTime
      } else {
        reminderTime = parseTimeString(timeOption)
      }

      // Add a message confirming the time
      const formattedTime = reminderTime.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        weekday: reminderTime.getDate() !== new Date().getDate() ? "short" : undefined,
      })

      addMessage(`I'll remind you at ${formattedTime} 👍`, MESSAGE_TYPE.AI)

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
      const notificationId = await scheduleNotification(title, body, { date: reminderTime }, reminderData.id, false)

      // Update the reminder with the notification ID
      const { error: updateError } = await supabase
        .from("reminders")
        .update({ notification_id: notificationId })
        .eq("id", reminderData.id)

      if (updateError) throw updateError

      // Set the chat state to reminder set
      setChatState(CHAT_STATE.REMINDER_SET)

      // Add a final message
      setTimeout(() => {
        addMessage("Is there anything else you'd like to talk about today?", MESSAGE_TYPE.AI)
        setChatState(CHAT_STATE.WAITING_FOR_ENTRY)
      }, 1000)
    } catch (error) {
      console.error("Error setting reminder:", error)
      addMessage("Sorry, I couldn't set the reminder. Please try again.", MESSAGE_TYPE.SYSTEM)
      setChatState(CHAT_STATE.WAITING_FOR_ENTRY)
    }
  }

  // Render a message item
  const renderMessageItem = ({ item }) => {
    switch (item.type) {
      case MESSAGE_TYPE.USER:
        return <UserBubble message={item.content} timestamp={item.timestamp} />
      case MESSAGE_TYPE.AI:
        return <AIBubble message={item.content} timestamp={item.timestamp} type={item.suggestionType} />
      case MESSAGE_TYPE.SYSTEM:
        return <SystemMessage message={item.content} />
      default:
        return null
    }
  }

  // Render quick reply buttons based on chat state
  const renderQuickReplyButtons = () => {
    if (loading) return null

    switch (chatState) {
      case CHAT_STATE.WAITING_FOR_REMINDER_CONFIRMATION:
        return (
          <QuickReplyContainer>
            <QuickReplyButton text="Yes, please" onPress={() => handleReminderConfirmation(true)} primary={true} />
            <QuickReplyButton text="No, thanks" onPress={() => handleReminderConfirmation(false)} primary={false} />
          </QuickReplyContainer>
        )
      case CHAT_STATE.WAITING_FOR_TIME_SELECTION:
        return (
          <QuickReplyContainer>
            {suggestedTimes.map((time, index) => (
              <QuickReplyButton key={index} text={time} onPress={() => handleTimeSelection(time)} primary={true} />
            ))}
            <QuickReplyButton text="Custom time" onPress={() => handleTimeSelection("custom")} primary={false} />
          </QuickReplyContainer>
        )
      default:
        return null
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidView}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#4a6fa5" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Journal AI</Text>
        </View>

        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessageItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        {renderQuickReplyButtons()}

        {chatState === CHAT_STATE.WAITING_FOR_ENTRY && (
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Type your message..."
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxHeight={100}
            />
            <TouchableOpacity
              style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
              onPress={handleSendEntry}
              disabled={!inputText.trim() || loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="send" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        )}

        <TimePickerModal
          visible={showTimePicker}
          onClose={() => setShowTimePicker(false)}
          onSelectTime={handleCustomTimeSelection}
          initialTime={new Date()}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  keyboardAvoidView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
    backgroundColor: "#fff",
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#212529",
  },
  messageList: {
    paddingVertical: 16,
    flexGrow: 1,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
  },
  input: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingRight: 40,
    fontSize: 16,
    maxHeight: 100,
    minHeight: 40,
  },
  sendButton: {
    backgroundColor: "#4a6fa5",
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: "#adb5bd",
  },
})
