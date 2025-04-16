"use client"

import { useState } from "react"
import { StyleSheet, View, Text, TouchableOpacity, Modal, Platform } from "react-native"
import DateTimePicker from "@react-native-community/datetimepicker"
import { Ionicons } from "@expo/vector-icons"

const TimePickerModal = ({ visible, onClose, onSelectTime, initialTime = new Date() }) => {
  const [selectedTime, setSelectedTime] = useState(initialTime)
  const [showPicker, setShowPicker] = useState(Platform.OS === "ios")

  const handleTimeChange = (event, selectedDate) => {
    const currentDate = selectedDate || selectedTime
    setSelectedTime(currentDate)

    if (Platform.OS === "android") {
      setShowPicker(false)
    }
  }

  const handleConfirm = () => {
    onSelectTime(selectedTime)
    onClose()
  }

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <View style={styles.header}>
            <Text style={styles.headerText}>Select Time</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="#6c757d" />
            </TouchableOpacity>
          </View>

          <View style={styles.timeContainer}>
            {Platform.OS === "android" && !showPicker ? (
              <TouchableOpacity style={styles.timeDisplay} onPress={() => setShowPicker(true)}>
                <Text style={styles.timeText}>{formatTime(selectedTime)}</Text>
                <Ionicons name="time-outline" size={24} color="#4a6fa5" />
              </TouchableOpacity>
            ) : (
              <DateTimePicker
                value={selectedTime}
                mode="time"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={handleTimeChange}
                style={styles.picker}
              />
            )}
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
              <Text style={styles.confirmButtonText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalView: {
    width: "80%",
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  header: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#212529",
  },
  closeButton: {
    padding: 4,
  },
  timeContainer: {
    width: "100%",
    alignItems: "center",
    marginBottom: 20,
  },
  timeDisplay: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderWidth: 1,
    borderColor: "#e9ecef",
    borderRadius: 10,
    width: "100%",
  },
  timeText: {
    fontSize: 18,
    color: "#212529",
    marginRight: 10,
  },
  picker: {
    width: 200,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  cancelButton: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#f8f9fa",
    flex: 1,
    marginRight: 8,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#6c757d",
    fontWeight: "bold",
  },
  confirmButton: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#4a6fa5",
    flex: 1,
    marginLeft: 8,
    alignItems: "center",
  },
  confirmButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
})

export default TimePickerModal
