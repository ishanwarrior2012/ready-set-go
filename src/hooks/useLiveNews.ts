import { useQuery } from "@tanstack/react-query";
import { fetchWithTimeout } from "@/lib/fetchWithTimeout";
import { logger } from "@/lib/logger";

export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  source: string;
  domain: string;
  category: string;
  severity: "low" | "medium" | "high" | "critical";
  publishedAt: string;
  publishedTimestamp: number;
  url: string;
  location?: string;
  image?: string;
}

export type NewsCategory =
  | "All"
  | "Geopolitics"
  | "Sports"
  | "Natural Disasters"
  | "Weather"
  | "Technology"
  | "Health"
  | "Environment"
  | "Economy"
  | "Science"
  | "Conflict";

interface GDELTArticle {
  url?: string;
  title?: string;
  seendate?: string;
  domain?: string;
  sourcecountry?: string;
  language?: string;
  socialimage?: string;
}

const CATEGORY_QUERIES: Record<Exclude<NewsCategory, "All">, string> = {
  Geopolitics:
    "(geopolitics OR diplomacy OR \"foreign policy\" OR \"United Nations\" OR \"international relations\" OR summit OR treaty OR sanctions OR NATO OR G20)",
  Sports:
    "(cricket OR football OR soccer OR \"world cup\" OR tennis OR Olympics OR basketball OR baseball OR rugby OR championship OR tournament OR \"India cricket\" OR IPL OR FIFA)",
  "Natural Disasters":
    "(earthquake OR tsunami OR volcano OR hurricane OR typhoon OR cyclone OR flood OR wildfire OR tornado OR eruption OR landslide)",
  Weather:
    "(heatwave OR blizzard OR \"storm warning\" OR drought OR \"climate change\" OR monsoon OR \"extreme weather\" OR \"temperature record\")",
  Technology:
    "(\"artificial intelligence\" OR AI OR cybersecurity OR \"data breach\" OR cryptocurrency OR tech OR software OR \"social media\" OR startup OR innovation)",
  Health:
    "(pandemic OR outbreak OR virus OR vaccine OR \"public health\" OR WHO OR epidemic OR disease OR medicine OR hospital)",
  Environment:
    "(\"climate change\" OR deforestation OR pollution OR \"carbon emissions\" OR \"renewable energy\" OR biodiversity OR sustainability OR plastic)",
  Economy:
    "(inflation OR recession OR \"stock market\" OR GDP OR \"interest rates\" OR unemployment OR trade OR \"federal reserve\" OR IMF OR \"World Bank\")",
  Science:
    "(NASA OR \"space exploration\" OR discovery OR research OR Mars OR moon OR astronomy OR quantum OR physics OR biology)",
  Conflict:
    "(war OR conflict OR military OR ceasefire OR troops OR bombing OR attack OR missile OR rebel OR protest OR coup)",
};

function parseSeen(seendate?: string): number {
  if (!seendate) return Date.now();
  // Format: 20240315T120000Z
  const m = seendate.match(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z/);
  if (m) {
    return new Date(`${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}Z`).getTime();
  }
  return Date.now();
}

function classifySeverity(title: string, category: string): NewsArticle["severity"] {
  const t = title.toLowerCase();
  if (
    t.includes("critical") ||
    t.includes("emergency") ||
    t.includes("catastrophic") ||
    t.includes("kills") ||
    t.includes("dead") ||
    t.includes("war") ||
    t.includes("nuclear") ||
    t.includes("attack") ||
    t.includes("tsunami warning")
  )
    return "critical";
  if (
    t.includes("major") ||
    t.includes("severe") ||
    t.includes("crisis") ||
    t.includes("threat") ||
    t.includes("warning") ||
    t.includes("disaster") ||
    category === "Conflict"
  )
    return "high";
  if (
    t.includes("alert") ||
    t.includes("concern") ||
    t.includes("risk") ||
    t.includes("tension") ||
    category === "Natural Disasters"
  )
    return "medium";
  return "low";
}

async function fetchCategoryNews(
  category: Exclude<NewsCategory, "All">,
  maxRecords = 15
): Promise<NewsArticle[]> {
  const query = CATEGORY_QUERIES[category];
  const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(
    query
  )}&mode=ArtList&format=json&maxrecords=${maxRecords}&sort=DateDesc&sourcelang=english&timespan=18h`;

  try {
    const res = await fetchWithTimeout(url, { timeoutMs: 12000 });
    if (!res.ok) return [];
    const text = await res.text();
    // GDELT sometimes returns error strings instead of JSON
    if (!text.trim().startsWith("{")) {
      logger.warn(`GDELT non-JSON response for ${category}:`, text.slice(0, 100));
      return [];
    }
    let data: { articles?: GDELTArticle[] };
    try {
      data = JSON.parse(text);
    } catch {
      return [];
    }
    const articles: GDELTArticle[] = data?.articles || [];

    return articles
      .filter((a) => a.url && a.title)
      .map((a, i): NewsArticle => {
        const ts = parseSeen(a.seendate);
        const title = (a.title || "Breaking News").slice(0, 160);
        return {
          id: `${category}-${a.url || i}-${ts}`,
          title,
          summary: `Latest updates from ${a.domain || "global sources"} on ${category.toLowerCase()} developments.`,
          source: a.domain || "World News",
          domain: a.domain || "",
          category,
          severity: classifySeverity(title, category),
          publishedAt: new Date(ts).toISOString(),
          publishedTimestamp: ts,
          url: a.url || "#",
          location: a.sourcecountry || undefined,
          image: a.socialimage || undefined,
        };
      });
  } catch (err) {
    logger.error(`Failed to fetch ${category} news:`, err);
    return [];
  }
}

async function fetchAllNews(): Promise<NewsArticle[]> {
  const categories: Exclude<NewsCategory, "All">[] = [
    "Geopolitics",
    "Sports",
    "Natural Disasters",
    "Conflict",
    "Technology",
    "Economy",
    "Weather",
    "Health",
    "Environment",
    "Science",
  ];

  // Fetch all categories in parallel
  const results = await Promise.all(
    categories.map((cat) => fetchCategoryNews(cat, 10))
  );

  const all: NewsArticle[] = [];
  const seen = new Set<string>();
  for (const articles of results) {
    for (const a of articles) {
      if (!seen.has(a.title)) {
        seen.add(a.title);
        all.push(a);
      }
    }
  }

  // Sort by timestamp desc
  all.sort((a, b) => b.publishedTimestamp - a.publishedTimestamp);
  return all;
}

export function useLiveNews() {
  return useQuery({
    queryKey: ["live-news"],
    queryFn: fetchAllNews,
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
    staleTime: 3 * 60 * 1000,
    retry: 2,
  });
}
