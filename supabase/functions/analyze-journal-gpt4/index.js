import OpenAI from "https://esm.sh/openai@4.0.0"

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: Deno.env.get("OPENAI_API_KEY"),
})

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

    // Call OpenAI API with structured output
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `
            You are an AI journaling assistant that helps users reflect on their entries and provides supportive suggestions.
            Analyze the journal entry and identify the main emotional themes or areas where the user might benefit from support.
            Provide a brief, empathetic response acknowledging their feelings and one specific, actionable suggestion that could help them.
            Frame the suggestion as a question about whether they'd like a reminder.
            Categorize your suggestion into one of these types: ${suggestionTypes.join(", ")}
            Make sure your response is supportive, not judgmental, and focuses on small, achievable actions.
          `,
        },
        {
          role: "user",
          content: content,
        },
      ],
      functions: [
        {
          name: "provide_journal_feedback",
          description: "Provides feedback and suggestions based on a journal entry",
          parameters: {
            type: "object",
            properties: {
              type: {
                type: "string",
                enum: suggestionTypes,
                description: "The category of the suggestion",
              },
              response: {
                type: "string",
                description:
                  "An empathetic response with an actionable suggestion framed as a question about a reminder",
              },
            },
            required: ["type", "response"],
          },
        },
      ],
      function_call: { name: "provide_journal_feedback" },
    })

    // Parse the function call response
    const functionCall = response.choices[0].message.function_call
    const responseData = JSON.parse(functionCall.arguments)

    return new Response(JSON.stringify(responseData), { status: 200, headers: { "Content-Type": "application/json" } })
  } catch (error) {
    console.error("Error:", error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
})
