import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error("Missing or invalid Authorization header");
      return new Response(
        JSON.stringify({ error: "Unauthorized: Missing authentication token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client and verify the JWT via getUser
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify user by fetching their data - this validates the JWT
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError || !userData?.user) {
      console.error("JWT verification failed:", userError?.message || "Invalid user");
      return new Response(
        JSON.stringify({ error: "Unauthorized: Invalid authentication token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = userData.user.id;
    console.log("Authenticated user:", userId);

    const body = await req.json();
    const { messages } = body;

    // Input validation
    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "Invalid request: messages array required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Limit message count to prevent abuse
    if (messages.length > 50) {
      return new Response(
        JSON.stringify({ error: "Too many messages in conversation" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate each message
    for (const msg of messages) {
      if (!msg.role || !msg.content || typeof msg.content !== "string") {
        return new Response(
          JSON.stringify({ error: "Invalid message format" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      // Limit message content length
      if (msg.content.length > 10000) {
        return new Response(
          JSON.stringify({ error: "Message content too long" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("AI service is not configured");
    }

    console.log("Processing chat request for user", userId, "with", messages.length, "messages");

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
    console.log("AI response received successfully for user:", userId);

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
