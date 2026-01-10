import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Processing chat request with", messages?.length, "messages");

    // System prompt for SafeTrack assistant
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

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Usage limit reached. Please add credits to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log("AI response received successfully");

    const generatedText = data.choices?.[0]?.message?.content || 
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
