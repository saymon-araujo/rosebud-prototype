export const analyzeJournalEntry = async (content: string, userId: string) => {
  try {
       
    const res = await fetch(`https://jjavrmtjyzdetuahjkhp.supabase.co/functions/v1/analyze-journal`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqYXZybXRqeXpkZXR1YWhqa2hwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3NTMzOTAsImV4cCI6MjA2MDMyOTM5MH0.izch3eZZAOQEgUTpBuwPVq9jMsje5dnUEGtbBhxAq7g",
        Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqYXZybXRqeXpkZXR1YWhqa2hwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3NTMzOTAsImV4cCI6MjA2MDMyOTM5MH0.izch3eZZAOQEgUTpBuwPVq9jMsje5dnUEGtbBhxAq7g`,
      },
      body: JSON.stringify({ content, userId }),
    })

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`)
    }

    const data = await res.json()
    return data
  } catch (error) {
    console.error("Failed to analyze journal entry:", error)
    throw error
  }
}

export const getFallbackAnalysis = (content: string) => {
  // A simple fallback analysis with a more conversational tone
  return {
    type: "general",
    response:
      "Thanks for sharing your thoughts! 😊 Would you like me to remind you to take a moment for yourself later today?",
    suggestedTimes: ["4:00 PM", "7:00 PM", "9:00 PM"],
  }
}

// Helper function to get suggested times based on suggestion type
export const getSuggestedTimes = (type: string) => {
  const now = new Date()
  const currentHour = now.getHours()

  switch (type) {
    case "sleep":
      return ["9:30 PM", "10:00 PM", "10:30 PM", "11:00 PM"]
    case "hydration":
      return ["In 1 hour", "In 2 hours", "Every 2 hours"]
    case "exercise":
      if (currentHour < 12) {
        return ["12:00 PM", "3:00 PM", "5:00 PM"]
      } else {
        return ["5:00 PM", "Tomorrow 8:00 AM", "Tomorrow 12:00 PM"]
      }
    case "stress":
    case "mindfulness":
      if (currentHour < 12) {
        return ["12:00 PM", "3:00 PM", "7:00 PM"]
      } else {
        return ["7:00 PM", "9:00 PM", "Tomorrow 8:00 AM"]
      }
    case "nutrition":
      if (currentHour < 10) {
        return ["12:00 PM", "3:00 PM", "6:00 PM"]
      } else if (currentHour < 15) {
        return ["6:00 PM", "Tomorrow 8:00 AM", "Tomorrow 12:00 PM"]
      } else {
        return ["Tomorrow 8:00 AM", "Tomorrow 12:00 PM", "Tomorrow 6:00 PM"]
      }
    case "screen-time":
      return ["9:00 PM", "10:00 PM", "11:00 PM"]
    case "social":
      return ["5:00 PM", "7:00 PM", "Tomorrow 12:00 PM"]
    case "productivity":
      if (currentHour < 12) {
        return ["12:00 PM", "3:00 PM", "5:00 PM"]
      } else {
        return ["Tomorrow 9:00 AM", "Tomorrow 12:00 PM", "Tomorrow 3:00 PM"]
      }
    default:
      // General suggestion times
      if (currentHour < 12) {
        return ["12:00 PM", "3:00 PM", "7:00 PM"]
      } else if (currentHour < 17) {
        return ["5:00 PM", "7:00 PM", "9:00 PM"]
      } else {
        return ["9:00 PM", "Tomorrow 9:00 AM", "Tomorrow 12:00 PM"]
      }
  }
}

// Helper function to parse time string into Date object
export const parseTimeString = (timeString: string): Date => {
  const now = new Date()

  if (timeString.includes("Tomorrow")) {
    // Handle "Tomorrow X:XX AM/PM" format
    const timePart = timeString.replace("Tomorrow ", "")
    const [time, period] = timePart.split(" ")
    const [hours, minutes] = time.split(":")

    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(
      period === "PM" && Number.parseInt(hours) !== 12 ? Number.parseInt(hours) + 12 : Number.parseInt(hours),
      Number.parseInt(minutes) || 0,
      0,
      0,
    )

    return tomorrow
  } else if (timeString.includes("In")) {
    // Handle "In X hours" format
    const hours = Number.parseInt(timeString.match(/\d+/)?.[0] || "1")
    const futureTime = new Date(now)
    futureTime.setHours(futureTime.getHours() + hours)
    return futureTime
  } else if (timeString.includes("Every")) {
    // Handle "Every X hours" format - just return 2 hours from now for the first reminder
    const futureTime = new Date(now)
    futureTime.setHours(futureTime.getHours() + 2)
    return futureTime
  } else {
    // Handle "X:XX AM/PM" format
    const [time, period] = timeString.split(" ")
    const [hours, minutes] = time.split(":")

    const reminderTime = new Date(now)
    reminderTime.setHours(
      period === "PM" && Number.parseInt(hours) !== 12 ? Number.parseInt(hours) + 12 : Number.parseInt(hours),
      Number.parseInt(minutes) || 0,
      0,
      0,
    )

    // If the time is already past for today, schedule for tomorrow
    if (reminderTime < now) {
      reminderTime.setDate(reminderTime.getDate() + 1)
    }

    return reminderTime
  }
}
