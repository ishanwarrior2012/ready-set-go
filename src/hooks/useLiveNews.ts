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

// GDELT v2 requires OR-joined terms to be wrapped in ()
// Each query is already parenthesized. Phrases use double quotes.
const CATEGORY_QUERIES: Record<Exclude<NewsCategory, "All">, string> = {
  Geopolitics:
    "(geopolitics OR diplomacy OR \"United Nations\" OR summit OR treaty OR sanctions OR NATO OR G20 OR \"foreign policy\" OR \"international relations\" OR election OR government OR president OR prime minister OR parliament OR congress OR senate OR referendum OR coup)",
  Sports:
    "(cricket OR football OR soccer OR tennis OR Olympics OR basketball OR baseball OR rugby OR championship OR tournament OR \"world cup\" OR \"IPL\" OR \"FIFA\" OR \"ICC\" OR \"Premier League\" OR \"Grand Prix\" OR \"Formula 1\" OR golf OR boxing OR athletics OR \"T20\" OR wicket OR \"home run\" OR touchdown OR \"hat trick\")",
  "Natural Disasters":
    "(earthquake OR tsunami OR volcano OR hurricane OR typhoon OR cyclone OR flood OR wildfire OR tornado OR eruption OR landslide OR avalanche OR drought OR \"natural disaster\" OR \"seismic\" OR \"storm surge\" OR \"flash flood\")",
  Weather:
    "(heatwave OR blizzard OR snowstorm OR drought OR monsoon OR \"extreme weather\" OR \"record temperature\" OR \"temperature record\" OR \"cold snap\" OR \"heat dome\" OR \"weather warning\" OR \"storm warning\" OR \"climate\" OR \"weather alert\")",
  Technology:
    "(\"artificial intelligence\" OR AI OR chatbot OR cybersecurity OR \"data breach\" OR cryptocurrency OR bitcoin OR blockchain OR \"social media\" OR startup OR \"tech company\" OR Apple OR Google OR Microsoft OR Meta OR Tesla OR OpenAI OR Samsung OR iPhone OR Android OR \"quantum computing\")",
  Health:
    "(pandemic OR outbreak OR virus OR vaccine OR \"public health\" OR WHO OR epidemic OR disease OR medicine OR hospital OR cancer OR surgery OR \"mental health\" OR pharmaceutical OR FDA OR \"clinical trial\" OR \"drug approval\")",
  Environment:
    "(\"climate change\" OR deforestation OR pollution OR \"carbon emissions\" OR \"renewable energy\" OR biodiversity OR sustainability OR \"global warming\" OR \"greenhouse gas\" OR \"net zero\" OR \"coral reef\" OR \"sea level\" OR \"plastic pollution\")",
  Economy:
    "(inflation OR recession OR \"stock market\" OR GDP OR \"interest rates\" OR unemployment OR trade OR \"federal reserve\" OR IMF OR \"World Bank\" OR \"economic growth\" OR tariff OR \"bond market\" OR cryptocurrency OR \"oil price\" OR \"cost of living\")",
  Science:
    "(NASA OR \"space exploration\" OR discovery OR research OR Mars OR moon OR astronomy OR quantum OR physics OR biology OR \"James Webb\" OR SpaceX OR \"black hole\" OR genome OR \"stem cell\" OR \"scientific study\" OR laboratory OR experiment)",
  Conflict:
    "(war OR conflict OR military OR ceasefire OR troops OR bombing OR airstrike OR missile OR rebel OR protest OR coup OR \"armed forces\" OR \"peace talks\" OR casualties OR hostage OR \"civil war\" OR insurgency OR terrorism)",
};

// General "everything" query to catch breaking news not covered by categories
const GENERAL_QUERY = "(breaking OR \"world news\" OR \"latest news\" OR \"top story\" OR India OR China OR US OR UK OR Russia OR Europe OR Africa OR \"Middle East\" OR Australia OR Brazil OR Canada OR Japan OR Korea OR Pakistan OR Bangladesh OR Nigeria)";

function parseSeen(seendate?: string): number {
  if (!seendate) return Date.now();
  const m = seendate.match(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z/);
  if (m) {
    return new Date(`${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}Z`).getTime();
  }
  return Date.now();
}

function classifySeverity(title: string, category: string): NewsArticle["severity"] {
  const t = title.toLowerCase();
  if (
    t.includes("kill") || t.includes("dead") || t.includes("death") ||
    t.includes("war") || t.includes("nuclear") || t.includes("attack") ||
    t.includes("catastrophic") || t.includes("emergency") || t.includes("critical") ||
    t.includes("tsunami warning") || t.includes("eruption") || t.includes("explosion")
  ) return "critical";
  if (
    t.includes("major") || t.includes("severe") || t.includes("crisis") ||
    t.includes("threat") || t.includes("warning") || t.includes("disaster") ||
    t.includes("strike") || t.includes("protest") || category === "Conflict" ||
    t.includes("arrest") || t.includes("sanctions") || t.includes("collapse")
  ) return "high";
  if (
    t.includes("alert") || t.includes("concern") || t.includes("risk") ||
    t.includes("tension") || category === "Natural Disasters" ||
    t.includes("breaking") || t.includes("urgent")
  ) return "medium";
  return "low";
}

// Guess category from article title when fetching general news
function guessCategory(title: string): Exclude<NewsCategory, "All"> {
  const t = title.toLowerCase();
  if (/(cricket|football|soccer|tennis|olympics|basketball|ipl|world cup|fifa|sport|match|tournament|innings|wicket|goal|score|league|championship)/i.test(t)) return "Sports";
  if (/(earthquake|tsunami|volcano|hurricane|typhoon|cyclone|flood|wildfire|tornado|eruption|landslide)/i.test(t)) return "Natural Disasters";
  if (/(war|conflict|military|ceasefire|troops|bombing|airstrike|missile|rebel|coup|terrorism)/i.test(t)) return "Conflict";
  if (/(ai|artificial intelligence|tech|cyber|crypto|bitcoin|apple|google|microsoft|meta|tesla|startup|software)/i.test(t)) return "Technology";
  if (/(economy|inflation|recession|gdp|stock|trade|bank|interest rate|unemployment|tariff)/i.test(t)) return "Economy";
  if (/(climate|environment|pollution|carbon|renewable|sustainability|deforest)/i.test(t)) return "Environment";
  if (/(health|virus|vaccine|pandemic|epidemic|disease|hospital|medicine|fda|cancer)/i.test(t)) return "Health";
  if (/(weather|heatwave|storm|blizzard|drought|monsoon|temperature)/i.test(t)) return "Weather";
  if (/(nasa|space|mars|moon|astronomy|quantum|physics|research|discovery|science)/i.test(t)) return "Science";
  return "Geopolitics";
}

async function fetchGDELT(query: string, maxRecords: number): Promise<GDELTArticle[]> {
  const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(query)}&mode=ArtList&format=json&maxrecords=${maxRecords}&sort=DateDesc&sourcelang=english&timespan=18h`;
  try {
    const res = await fetchWithTimeout(url, { timeoutMs: 14000 });
    if (!res.ok) return [];
    const text = await res.text();
    if (!text.trim().startsWith("{")) {
      logger.warn(`GDELT error for query "${query.slice(0, 40)}":`, text.slice(0, 120));
      return [];
    }
    const data = JSON.parse(text);
    return (data?.articles || []).filter((a: GDELTArticle) => a.url && a.title);
  } catch (err) {
    logger.error("GDELT fetch failed:", err);
    return [];
  }
}

function toArticle(a: GDELTArticle, category: string, index: number): NewsArticle {
  const ts = parseSeen(a.seendate);
  const title = (a.title || "Breaking News").slice(0, 180);
  return {
    id: `${category}-${a.url || index}-${ts}`,
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
}

async function fetchCategoryNews(
  category: Exclude<NewsCategory, "All">,
  maxRecords = 15
): Promise<NewsArticle[]> {
  const raw = await fetchGDELT(CATEGORY_QUERIES[category], maxRecords);
  return raw.map((a, i) => toArticle(a, category, i));
}

async function fetchAllNews(): Promise<NewsArticle[]> {
  const categories: Exclude<NewsCategory, "All">[] = [
    "Geopolitics", "Sports", "Natural Disasters", "Conflict",
    "Technology", "Economy", "Weather", "Health", "Environment", "Science",
  ];

  // Fetch all categories + a general "everything" feed in parallel
  const [categoryResults, generalRaw] = await Promise.all([
    Promise.all(categories.map((cat) => fetchCategoryNews(cat, 15))),
    fetchGDELT(GENERAL_QUERY, 20),
  ]);

  const seen = new Set<string>();
  const all: NewsArticle[] = [];

  // Add category articles first
  for (const articles of categoryResults) {
    for (const a of articles) {
      const key = a.title.slice(0, 60).toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        all.push(a);
      }
    }
  }

  // Add general articles with auto-classified categories
  for (let i = 0; i < generalRaw.length; i++) {
    const raw = generalRaw[i];
    const title = (raw.title || "").slice(0, 180);
    const key = title.slice(0, 60).toLowerCase();
    if (!seen.has(key) && key.length > 10) {
      seen.add(key);
      const category = guessCategory(title);
      all.push(toArticle(raw, category, i + 10000));
    }
  }

  // Sort by timestamp desc — newest first
  all.sort((a, b) => b.publishedTimestamp - a.publishedTimestamp);
  return all;
}

export function useLiveNews(category?: Exclude<NewsCategory, "All">) {
  return useQuery({
    queryKey: category ? ["live-news", category] : ["live-news"],
    queryFn: () => category ? fetchCategoryNews(category, 20) : fetchAllNews(),
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
    staleTime: 3 * 60 * 1000,
    retry: 2,
  });
}
