

import { useContext, useState } from "react"
import { StyleSheet, View, Text, TouchableOpacity, Switch, Alert, ScrollView } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { AuthContext } from "../context/AuthContext"
import { NotificationContext } from "../context/NotificationContext"
import { cancelAllNotifications } from "../lib/notifications"
import { useRouter } from "expo-router"
export default function SettingsScreen() {
  const { user, signOut } = useContext(AuthContext)
  const { requestPermissions } = useContext(NotificationContext)
  const [useAI, setUseAI] = useState(true)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const router = useRouter()

  const handleSignOut = async () => {
    try {
      await signOut()
      // Navigation will be handled by the auth state change in AuthContext
    } catch (error) {
      Alert.alert("Error", "Failed to sign out")
    }
  }

  const handleToggleNotifications = async (value) => {
    if (value) {
      // If turning on notifications, request permissions
      const hasPermission = await requestPermissions()
      if (!hasPermission) {
        return
      }
    } else {
      // If turning off notifications, cancel all scheduled notifications
      try {
        await cancelAllNotifications()
        Alert.alert("Notifications Disabled", "All scheduled notifications have been canceled.")
      } catch (error) {
        console.error("Error canceling notifications:", error)
        Alert.alert("Error", "Failed to cancel notifications")
      }
    }

    setNotificationsEnabled(value)
  }

  const renderSettingItem = (icon, title, description, value, onValueChange) => (
    <View style={styles.settingItem}>
      <View style={styles.settingIconContainer}>
        <Ionicons name={icon} size={24} color="#4a6fa5" />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingDescription}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: "#e9ecef", true: "#4a6fa5" }}
        thumbColor="#fff"
      />
    </View>
  )

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="arrow-back" size={24} color="#4a6fa5" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
        </View>

        <View style={styles.userSection}>
          <View style={styles.userAvatar}>
            <Text style={styles.userInitial}>{user?.email?.charAt(0).toUpperCase() || "U"}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.email?.split("@")[0] || "User"}</Text>
            <Text style={styles.userEmail}>{user?.email || "user@example.com"}</Text>
          </View>
        </View>

        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>App Settings</Text>

          {renderSettingItem(
            "sparkles-outline",
            "Use AI Analysis",
            "Enable AI-powered analysis of journal entries",
            useAI,
            setUseAI,
          )}

          {renderSettingItem(
            "notifications-outline",
            "Enable Notifications",
            "Receive reminder notifications",
            notificationsEnabled,
            handleToggleNotifications,
          )}

          {/* {renderSettingItem(
            "moon-outline",
            "Dark Mode",
            "Switch between light and dark themes",
            darkMode,
            setDarkMode,
          )} */}
        </View>

        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Account</Text>

          <TouchableOpacity style={styles.accountItem}>
            <View style={styles.settingIconContainer}>
              <Ionicons name="lock-closed-outline" size={24} color="#4a6fa5" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Change Password</Text>
              <Text style={styles.settingDescription}>Update your account password</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#adb5bd" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.accountItem}>
            <View style={styles.settingIconContainer}>
              <Ionicons name="cloud-download-outline" size={24} color="#4a6fa5" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Export Data</Text>
              <Text style={styles.settingDescription}>Download your journal entries</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#adb5bd" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutButtonText}>Sign Out</Text>
        </TouchableOpacity>

        <View style={styles.aboutSection}>
          <Text style={styles.aboutTitle}>About</Text>
          <Text style={styles.aboutVersion}>Journal AI v1.0.0</Text>
          <Text style={styles.aboutCopyright}>© 2023 Journal AI</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  scrollView: {
    flex: 1,
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
  userSection: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#4a6fa5",
    justifyContent: "center",
    alignItems: "center",
  },
  userInitial: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  userInfo: {
    marginLeft: 15,
  },
  userName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#212529",
  },
  userEmail: {
    fontSize: 14,
    color: "#6c757d",
  },
  settingsSection: {
    marginTop: 20,
    backgroundColor: "#fff",
    borderRadius: 10,
    overflow: "hidden",
    marginHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#6c757d",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  accountItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(74, 111, 165, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#212529",
  },
  settingDescription: {
    fontSize: 14,
    color: "#6c757d",
  },
  signOutButton: {
    backgroundColor: "#dc3545",
    borderRadius: 10,
    padding: 15,
    alignItems: "center",
    marginHorizontal: 20,
    marginTop: 30,
  },
  signOutButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  aboutSection: {
    alignItems: "center",
    padding: 20,
    marginTop: 20,
  },
  aboutTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#6c757d",
  },
  aboutVersion: {
    fontSize: 14,
    color: "#adb5bd",
    marginTop: 5,
  },
  aboutCopyright: {
    fontSize: 12,
    color: "#adb5bd",
    marginTop: 5,
  },
})
