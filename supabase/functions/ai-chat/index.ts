import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, stream = false } = await req.json();

    if (!GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY is not configured");
      throw new Error("GEMINI_API_KEY is not configured");
    }

    console.log("Processing chat request with", messages?.length, "messages");

    // Build conversation context for SafeTrack assistant
    const systemPrompt = `You are SafeTrack AI Assistant, a helpful and knowledgeable assistant for the SafeTrack app - a comprehensive tracking and monitoring platform. You can help users with:

1. **Flight Tracking**: Information about flights, airports, airlines, and aviation data
2. **Marine Traffic**: Vessel tracking, shipping routes, ports, and maritime information  
3. **Earthquake Monitoring**: Seismic activity, earthquake data, safety information
4. **Volcanic Activity**: Volcano status, eruption alerts, and geological data
5. **Weather**: Weather forecasts, conditions, and meteorological data
6. **Global Radio**: Radio stations worldwide, streaming, and broadcast information

When responding:
- Be helpful, concise, and accurate
- Suggest relevant pages in the app when appropriate (e.g., "Check the Earthquakes page for live data")
- Provide actionable information when possible
- If asked about real-time data, explain that users should check the respective tracking page for live information
- Be conversational but professional

Current app features:
- Flight Radar with Flightradar24 integration
- Marine Traffic with AIS vessel tracking
- USGS Earthquake monitoring
- Smithsonian Volcano tracking
- Weather maps with Windy integration
- Radio Garden for global radio streaming`;

    // Convert messages to Gemini format
    const geminiMessages = messages.map((msg: { role: string; content: string }) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    }));

    // Add system prompt as first user message if needed
    const contents = [
      { role: "user", parts: [{ text: systemPrompt }] },
      { role: "model", parts: [{ text: "I understand. I'm SafeTrack AI Assistant, ready to help with flight tracking, marine traffic, earthquake monitoring, volcanic activity, weather, and global radio. How can I assist you today?" }] },
      ...geminiMessages,
    ];

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
          safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    console.log("Gemini response received successfully");

    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || 
      "I apologize, but I couldn't generate a response. Please try again.";

    return new Response(
      JSON.stringify({ content: generatedText }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in ai-chat function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
