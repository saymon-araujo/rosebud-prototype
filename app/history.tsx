import { useContext, useEffect, useState } from "react"
import { StyleSheet, View, Text, FlatList, ActivityIndicator, TouchableOpacity } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { AuthContext } from "@/context/AuthContext"
import { SupabaseContext } from "@/context/SupabaseContext"
import JournalEntryItem from "@/components/JournalEntryItem"
import { useRouter } from "expo-router"

export default function HistoryScreen() {
  const { user } = useContext(AuthContext)
  const { supabase } = useContext(SupabaseContext)
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchEntries()
  }, [])

  const fetchEntries = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("journal_entries")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      setEntries(data || [])
    } catch (error) {
      console.error("Error fetching entries:", error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    fetchEntries()
  }

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="journal-outline" size={64} color="#adb5bd" />
      <Text style={styles.emptyText}>No journal entries yet</Text>
      <Text style={styles.emptySubText}>Your journal entries will appear here</Text>
      <TouchableOpacity style={styles.newEntryButton} onPress={() => router.push("/journal-entry")}>
        <Text style={styles.newEntryButtonText}>Create New Entry</Text>
      </TouchableOpacity>
    </View>
  )

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color="#4a6fa5" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Journal History</Text>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4a6fa5" />
          <Text style={styles.loadingText}>Loading entries...</Text>
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item: any) => item.id}
          renderItem={({ item }: any) => (
            <JournalEntryItem entry={item} onPress={() => router.push(`/journal-entry/${item.id}`)} />
          )}
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
