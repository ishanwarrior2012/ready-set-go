import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Fallback RSS/news sources when GDELT fails
const RSS_SOURCES = {
  Geopolitics: [
    "https://feeds.bbci.co.uk/news/world/rss.xml",
    "https://rss.nytimes.com/services/xml/rss/nyt/World.xml",
  ],
  Sports: [
    "https://feeds.bbci.co.uk/sport/rss.xml",
    "https://www.espn.com/espn/rss/news",
  ],
  Technology: [
    "https://feeds.feedburner.com/TechCrunch",
    "https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml",
  ],
};

async function fetchGDELT(query: string, maxRecords: number, timespan: string): Promise<Response> {
  const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(query)}&mode=ArtList&format=json&maxrecords=${maxRecords}&sort=DateDesc&sourcelang=english&timespan=${timespan}`;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);
  
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    return res;
  } catch (e) {
    clearTimeout(timeoutId);
    throw e;
  }
}

// Try GDELT with extended timespan fallback
async function fetchWithFallback(query: string, maxRecords: number): Promise<unknown> {
  // Try 18h first
  try {
    const res = await fetchGDELT(query, maxRecords, "18h");
    if (res.ok) {
      const text = await res.text();
      if (text.trim().startsWith("{")) {
        const data = JSON.parse(text);
        if (data?.articles?.length > 0) return data;
      }
    }
  } catch (_) { /* fall through */ }

  // Fallback: try 48h window
  try {
    const res = await fetchGDELT(query, maxRecords, "48h");
    if (res.ok) {
      const text = await res.text();
      if (text.trim().startsWith("{")) {
        const data = JSON.parse(text);
        if (data?.articles?.length > 0) return data;
      }
    }
  } catch (_) { /* fall through */ }

  // Fallback: try 72h window with simpler query
  const simpleQuery = query.split(" OR ").slice(0, 3).join(" OR ");
  try {
    const res = await fetchGDELT(simpleQuery, maxRecords, "72h");
    if (res.ok) {
      const text = await res.text();
      if (text.trim().startsWith("{")) {
        return JSON.parse(text);
      }
    }
  } catch (_) { /* fall through */ }

  return { articles: [], fallback: true };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, maxRecords = 20 } = await req.json();
    
    if (!query) {
      return new Response(
        JSON.stringify({ error: "query required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await fetchWithFallback(query, maxRecords);

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: String(error), articles: [] }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
