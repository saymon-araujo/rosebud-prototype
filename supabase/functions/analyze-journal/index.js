import OpenAI from "https://deno.land/x/openai@v4.24.0/mod.ts";
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
  "general"
];
// Define CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};
Deno.serve(async (req)=>{
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders
    });
  }
  try {
    // Get the request body
    const { content, userId } = await req.json();
    if (!content) {
      return new Response(JSON.stringify({
        error: "Journal content is required"
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
    // Build the messages for the OpenAI chat completion
    const messages = [
      {
        role: "system",
        content: "You are an AI journaling assistant that helps users reflect on their entries and provides supportive suggestions. Make sure your response is supportive, not judgmental, and focuses on small, achievable actions."
      },
      {
        role: "user",
        content: `Analyze the following journal entry and identify the main emotional themes or areas where the user might benefit from support.
Journal entry: "${content}"
Based on the entry, provide:
1. A brief, empathetic response acknowledging their feelings
2. One specific, actionable suggestion that could help them
3. Frame the suggestion as a question about whether they'd like a reminder
4. Categorize your suggestion into one of these types: ${suggestionTypes.join(", ")}
5. Use emoji to make your response friendly and conversational
6. Keep your response concise and chat-like, as if you're messaging in WhatsApp

Format your response as a JSON object with these fields:
{
  "type": "one of the suggestion types",
  "response": "your empathetic response and suggestion with emoji"
}

Example: "That sounds like a rough night 😴. Would you like me to remind you to wind down at 10:30pm?"`
      }
    ];
    // Initialize OpenAI using the Deno module
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({
        error: "OPENAI_API_KEY not set"
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
    const openai = new OpenAI({
      apiKey
    });
    // Call the chat completions API
    const chatCompletion = await openai.chat.completions.create({
      messages: messages,
      model: "gpt-3.5-turbo",
      stream: false,
      max_tokens: 500,
      temperature: 0.7
    });
    // Extract and parse the response from the assistant's message
    const reply = chatCompletion.choices[0].message.content;
    let responseData;
    try {
      responseData = JSON.parse(reply.trim());
      // Validate the response format
      if (!responseData.type || !responseData.response) {
        throw new Error("Invalid response format");
      }
      // Ensure the type is one of the suggestion types, otherwise fallback to general
      if (!suggestionTypes.includes(responseData.type)) {
        responseData.type = "general";
      }
    } catch (error) {
      // Fallback if JSON parsing fails
      responseData = {
        type: "general",
        response: reply.trim() || "Thanks for sharing your thoughts! 😊 Would you like me to remind you to journal again tomorrow?"
      };
    }
    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }
});
