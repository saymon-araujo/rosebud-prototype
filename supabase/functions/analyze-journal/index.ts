import OpenAI from "https://deno.land/x/openai@v4.24.0/mod.ts";

const SUGGESTION_TYPES = [
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

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

const tools = [
  {
    type: "function",
    function: {
      name: "suggestHabit",
      description: "Generate an empathetic response and habit suggestion",
      parameters: {
        type: "object",
        properties: {
          content: {
            type: "string",
            description: "User's journal entry text"
          },
          userId: {
            type: "string",
            description: "User ID"
          }
        },
        required: [
          "content",
          "userId"
        ]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "getWeeklyMoodTrend",
      description: "Fetch average mood trend from past week",
      parameters: {
        type: "object",
        properties: {
          userId: {
            type: "string"
          }
        },
        required: [
          "userId"
        ]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "getWeeklySleepStats",
      description: "Fetch average sleep hours from past week",
      parameters: {
        type: "object",
        properties: {
          userId: {
            type: "string"
          }
        },
        required: [
          "userId"
        ]
      }
    }
  }
];

const analysisPrompt = (entry: string) => `
Analyze the following journal entry and identify the main emotional themes or areas where the user might benefit from support.
Journal entry: "${entry}"

Based on the entry, provide:
1. A brief, empathetic response acknowledging their feelings
2. One specific, actionable suggestion that could help them
3. Frame the suggestion as a question about whether they'd like a reminder
4. Categorize your suggestion into one of these types: ${SUGGESTION_TYPES.join(", ")}
5. Use emoji to make your response friendly and conversational
6. Keep your response concise and chat‑like, as if you're messaging in WhatsApp

Example: "That sounds like a rough night 😴. Would you like me to remind you to wind down at 10:30 pm?"
`;

const makeBaseMessages = (content: string) => [
  {
    role: "system",
    content: "You are an empathetic AI journaling assistant: concise and action‑oriented. " + "If you are not calling a tool, respond only with a valid JSON object with keys `type` and `response`."
  },
  {
    role: "user",
    content: analysisPrompt(content)
  }
];

Deno.serve(async (req: Request) => {

  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: CORS_HEADERS
    });
  }

  try {
    const { content, userId } = await req.json();

    if (!content || !userId) {
      return new Response(JSON.stringify({
        error: "Both content and userId are required"
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          ...CORS_HEADERS
        }
      });
    }

    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) throw new Error("Missing OPENAI_API_KEY");

    const openai = new OpenAI({
      apiKey
    });

    const baseMessages = makeBaseMessages(content);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: baseMessages,
      tools,
      tool_choice: "auto",
      response_format: {
        type: "json_object"
      },
      temperature: 0.4
    });

    const msg = completion.choices[0].message;

    if (msg.tool_calls?.length) {
      const [toolCall] = msg.tool_calls;
      const { function: fn, id: callId } = toolCall;
      const args = JSON.parse(fn.arguments);
      const toolResult = {
        type: args.type ?? "general",
        response: args.response ?? "Here’s a suggestion based on your entry—let me know if you’d like more details!"
      };

      const followUp = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          ...baseMessages,
          msg,
          {
            role: "tool",
            name: fn.name,
            tool_call_id: callId,
            content: JSON.stringify(toolResult)
          }
        ],
        response_format: {
          type: "json_object"
        },
        temperature: 0.4
      });

      const final = JSON.parse(followUp.choices[0].message.content);

      return new Response(JSON.stringify(final), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...CORS_HEADERS
        }
      });
    }

    let data;

    try {
      data = JSON.parse(msg.content);
      if (!SUGGESTION_TYPES.includes(data.type)) data.type = "general";
    } catch {
      data = {
        type: "general",
        response: msg.content.trim()
      };
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...CORS_HEADERS
      }
    });
  } catch (err: unknown) {

    return new Response(JSON.stringify({
      error: err instanceof Error ? err.message : "Internal server error"
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        ...CORS_HEADERS
      }
    });
  }
});
