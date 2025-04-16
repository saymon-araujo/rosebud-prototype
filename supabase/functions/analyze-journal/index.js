import { Configuration, OpenAIApi } from "https://esm.sh/openai@3.2.1"

// Initialize OpenAI
const configuration = new Configuration({
  apiKey: Deno.env.get("OPENAI_API_KEY"),
})
const openai = new OpenAIApi(configuration)

// Define the types of suggestions we can provide
const suggestionTypes = [
  "sleep",
  "stress",
  "hydration",
  "exercise",
  "nutrition",
  "screen-time",
  "social",
  "mindfulness",
  "productivity",
  "general",
]

// Define CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    // Get the request body
    const { content, userId } = await req.json()

    if (!content) {
      return new Response(JSON.stringify({ error: "Journal content is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Create the prompt for OpenAI
    const prompt = `
      You are an AI journaling assistant that helps users reflect on their entries and provides supportive suggestions.
      
      Analyze the following journal entry and identify the main emotional themes or areas where the user might benefit from support.
      
      Journal entry: "${content}"
      
      Based on the entry, provide:
      1. A brief, empathetic response acknowledging their feelings
      2. One specific, actionable suggestion that could help them
      3. Frame the suggestion as a question about whether they'd like a reminder
      4. Categorize your suggestion into one of these types: ${suggestionTypes.join(", ")}
      
      Format your response as a JSON object with these fields:
      {
        "type": "one of the suggestion types",
        "response": "your empathetic response and suggestion"
      }
      
      Make sure your response is supportive, not judgmental, and focuses on small, achievable actions.
    `

    // Call OpenAI API
    const completion = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: prompt,
      max_tokens: 500,
      temperature: 0.7,
    })

    // Parse the response
    let responseData
    try {
      responseData = JSON.parse(completion.data.choices[0].text.trim())

      // Validate the response format
      if (!responseData.type || !responseData.response) {
        throw new Error("Invalid response format")
      }

      // Ensure the type is valid
      if (!suggestionTypes.includes(responseData.type)) {
        responseData.type = "general"
      }
    } catch (error) {
      // Fallback if parsing fails
      responseData = {
        type: "general",
        response:
          completion.data.choices[0].text.trim() ||
          "Thanks for sharing your thoughts. Would you like me to remind you to journal again tomorrow?",
      }
    }

    return new Response(JSON.stringify(responseData), { status: 200, headers: { "Content-Type": "application/json" } })
  } catch (error) {
    console.error("Error:", error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
})
