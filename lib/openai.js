export const analyzeJournalEntry = async (content, userId) => {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/analyze-journal`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
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
    throw error // Re-throw the error so the calling function knows it failed
  }
}

export const getFallbackAnalysis = (content) => {
  // A simple fallback analysis
  return {
    type: "general",
    response:
      "It sounds like you have a lot on your mind. Would you like me to remind you to take a break and stretch?",
  }
}
