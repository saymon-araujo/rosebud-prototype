import { useContext, useEffect, useState } from "react"
import { StyleSheet, View, Text, TouchableOpacity, FlatList, ActivityIndicator } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { SafeAreaView } from "react-native-safe-area-context"
import { AuthContext } from "@/context/AuthContext"
import { SupabaseContext } from "@/context/SupabaseContext"
import JournalEntryItem from "@/components/JournalEntryItem"
import NotificationInfoCard from "@/components/NotificationInfoCard"
import { useRouter } from "expo-router"

// Define interface for journal entry
interface JournalEntry {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  processed: boolean;
}

export default function HomeScreen() {
  const { user, signOut } = useContext(AuthContext)
  const { supabase } = useContext(SupabaseContext)
  const [recentEntries, setRecentEntries] = useState<JournalEntry[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    if (user) {
      fetchRecentEntries()
    }
  }, [user])

  const fetchRecentEntries = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("journal_entries")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5)

      if (error) throw error
      setRecentEntries(data || [])
    } catch (error) {
      console.error("Error fetching recent entries:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Journal AI</Text>
        <TouchableOpacity onPress={() => router.push("/settings")}>
          <Ionicons name="settings-outline" size={24} color="#4a6fa5" />
        </TouchableOpacity>
      </View>

      <View style={styles.welcomeContainer}>
        <Text style={styles.welcomeText}>Welcome back, {user?.email?.split("@")[0] || "User"}</Text>
        <Text style={styles.promptText}>How are you feeling today?</Text>
      </View>

      <TouchableOpacity style={styles.newEntryButton} onPress={() => router.push("/journal-entry")}>
        <Ionicons name="create-outline" size={24} color="#fff" />
        <Text style={styles.newEntryButtonText}>New Journal Entry</Text>
      </TouchableOpacity>

      <View style={styles.recentContainer}>
        <View style={styles.recentHeader}>
          <Text style={styles.recentTitle}>Recent Entries</Text>
          <TouchableOpacity onPress={() => router.push("/history")}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#4a6fa5" style={styles.loader} />
        ) : recentEntries.length > 0 ? (
          <FlatList
            data={recentEntries}
            keyExtractor={(item: JournalEntry) => item.id}
            renderItem={({ item }: { item: JournalEntry }) => (
              <JournalEntryItem
                entry={item}
                onPress={() => router.push(`/journal-entry/${item.id}`)}
              />
            )}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No journal entries yet</Text>
            <Text style={styles.emptySubText}>Start journaling to receive AI-powered insights</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#4a6fa5",
  },
  welcomeContainer: {
    padding: 20,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#212529",
  },
  promptText: {
    fontSize: 16,
    color: "#6c757d",
    marginTop: 5,
  },
  notificationInfoContainer: {
    paddingHorizontal: 20,
  },
  dismissButton: {
    alignSelf: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#e9ecef",
    borderRadius: 20,
    marginTop: -5,
    marginBottom: 10,
  },
  dismissText: {
    color: "#495057",
    fontSize: 14,
  },
  newEntryButton: {
    flexDirection: "row",
    backgroundColor: "#4a6fa5",
    borderRadius: 10,
    padding: 15,
    marginHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  newEntryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 10,
  },
  recentContainer: {
    flex: 1,
    padding: 20,
  },
  recentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  recentTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#212529",
  },
  viewAllText: {
    color: "#4a6fa5",
    fontWeight: "600",
  },
  loader: {
    marginTop: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#6c757d",
    textAlign: "center",
  },
  emptySubText: {
    fontSize: 14,
    color: "#adb5bd",
    textAlign: "center",
    marginTop: 10,
  },
})
