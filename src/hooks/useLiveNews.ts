import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
  | "Conflict"
  | "India"
  | "Business"
  | "Entertainment"
  | "Crime";

interface GDELTArticle {
  url?: string;
  title?: string;
  seendate?: string;
  domain?: string;
  sourcecountry?: string;
  language?: string;
  socialimage?: string;
}

// Comprehensive category queries
const CATEGORY_QUERIES: Record<Exclude<NewsCategory, "All">, string> = {
  Geopolitics:
    "(geopolitics OR diplomacy OR \"United Nations\" OR summit OR treaty OR sanctions OR NATO OR G20 OR \"foreign policy\" OR \"international relations\" OR election OR president OR \"prime minister\" OR parliament OR coup OR referendum OR \"state department\")",
  Sports:
    "(cricket OR football OR soccer OR tennis OR Olympics OR basketball OR baseball OR rugby OR championship OR tournament OR \"world cup\" OR IPL OR FIFA OR ICC OR \"Premier League\" OR \"Grand Prix\" OR \"Formula 1\" OR golf OR boxing OR T20 OR wicket OR \"hat trick\" OR \"Champions League\" OR NBA OR NFL OR cricket score OR match result)",
  "Natural Disasters":
    "(earthquake OR tsunami OR volcano OR hurricane OR typhoon OR cyclone OR flood OR wildfire OR tornado OR eruption OR landslide OR avalanche OR drought OR \"natural disaster\" OR seismic OR \"storm surge\" OR \"flash flood\" OR magnitude OR tremor)",
  Weather:
    "(heatwave OR blizzard OR snowstorm OR drought OR monsoon OR \"extreme weather\" OR \"record temperature\" OR \"cold snap\" OR \"heat dome\" OR \"weather warning\" OR \"storm warning\" OR climate OR \"weather alert\" OR cyclone OR \"El Nino\" OR \"La Nina\")",
  Technology:
    "(\"artificial intelligence\" OR AI OR chatbot OR cybersecurity OR \"data breach\" OR cryptocurrency OR bitcoin OR blockchain OR \"social media\" OR startup OR Apple OR Google OR Microsoft OR Meta OR Tesla OR OpenAI OR Samsung OR iPhone OR Android OR \"quantum computing\" OR hack OR ChatGPT OR Gemini)",
  Health:
    "(pandemic OR outbreak OR virus OR vaccine OR \"public health\" OR WHO OR epidemic OR disease OR medicine OR hospital OR cancer OR surgery OR \"mental health\" OR pharmaceutical OR FDA OR \"clinical trial\" OR \"drug approval\" OR mpox OR dengue OR malaria)",
  Environment:
    "(\"climate change\" OR deforestation OR pollution OR \"carbon emissions\" OR \"renewable energy\" OR biodiversity OR sustainability OR \"global warming\" OR \"greenhouse gas\" OR \"net zero\" OR \"coral reef\" OR \"sea level\" OR \"plastic pollution\" OR wildfire OR glacier)",
  Economy:
    "(inflation OR recession OR \"stock market\" OR GDP OR \"interest rates\" OR unemployment OR trade OR \"federal reserve\" OR IMF OR \"World Bank\" OR \"economic growth\" OR tariff OR \"bond market\" OR cryptocurrency OR \"oil price\" OR \"cost of living\" OR deficit OR budget)",
  Science:
    "(NASA OR \"space exploration\" OR discovery OR research OR Mars OR moon OR astronomy OR quantum OR physics OR biology OR \"James Webb\" OR SpaceX OR \"black hole\" OR genome OR \"stem cell\" OR \"scientific study\" OR laboratory OR experiment OR asteroid OR exoplanet)",
  Conflict:
    "(war OR conflict OR military OR ceasefire OR troops OR bombing OR airstrike OR missile OR rebel OR protest OR coup OR \"armed forces\" OR \"peace talks\" OR casualties OR hostage OR \"civil war\" OR insurgency OR terrorism OR Gaza OR Ukraine OR Sudan)",
  India:
    "(India OR Indian OR Delhi OR Mumbai OR Bangalore OR Chennai OR Modi OR BJP OR Congress OR Rupee OR Sensex OR ISRO OR \"Indian Army\" OR Maharashtra OR UP OR cricket India OR Bollywood OR IPL)",
  Business:
    "(merger OR acquisition OR IPO OR startup OR \"venture capital\" OR \"private equity\" OR earnings OR revenue OR profit OR quarterly OR \"stock price\" OR \"market cap\" OR layoffs OR \"funding round\" OR unicorn OR nasdaq OR NYSE)",
  Entertainment:
    "(movie OR film OR Netflix OR Hollywood OR Bollywood OR Grammy OR Oscar OR Emmy OR music OR celebrity OR album OR box office OR streaming OR Disney OR Marvel OR concert OR award)",
  Crime:
    "(murder OR arrest OR robbery OR fraud OR scam OR trafficking OR corruption OR verdict OR trial OR prison OR police OR investigation OR drug bust OR kidnap OR cybercrime OR embezzlement)",
};

// General world news covering all major regions
const GENERAL_QUERY = "(breaking OR \"world news\" OR \"latest news\" OR India OR China OR US OR UK OR Russia OR Europe OR Africa OR \"Middle East\" OR Australia OR Brazil OR Canada OR Japan OR Korea OR Pakistan OR Bangladesh OR Nigeria OR Indonesia OR Mexico OR \"Saudi Arabia\" OR Iran OR Israel OR Turkey OR Ukraine OR Syria)";

// Regional queries for comprehensive coverage
const REGIONAL_QUERIES = {
  Asia: "(India OR China OR Japan OR Korea OR Pakistan OR Bangladesh OR Indonesia OR Philippines OR Vietnam OR Thailand OR Malaysia OR Myanmar OR Sri Lanka OR Nepal)",
  MiddleEast: "(Israel OR Palestine OR Gaza OR Iran OR Saudi OR UAE OR Qatar OR Iraq OR Syria OR Lebanon OR Yemen OR Turkey OR Egypt OR Jordan)",
  Americas: "(United States OR Canada OR Mexico OR Brazil OR Argentina OR Colombia OR Venezuela OR Cuba OR Chile OR Peru)",
  Europe: "(Germany OR France OR UK OR Italy OR Spain OR Poland OR Ukraine OR Russia OR Netherlands OR Sweden OR Norway OR Switzerland)",
  Africa: "(Nigeria OR South Africa OR Kenya OR Ethiopia OR Ghana OR Egypt OR Morocco OR Tanzania OR Uganda OR Zimbabwe OR Sudan)",
};

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
    t.includes("tsunami warning") || t.includes("eruption") || t.includes("explosion") ||
    t.includes("massacre") || t.includes("genocide") || t.includes("coup")
  ) return "critical";
  if (
    t.includes("major") || t.includes("severe") || t.includes("crisis") ||
    t.includes("threat") || t.includes("warning") || t.includes("disaster") ||
    t.includes("strike") || t.includes("protest") || category === "Conflict" ||
    t.includes("arrest") || t.includes("sanctions") || t.includes("collapse") ||
    t.includes("earthquake") || t.includes("hurricane") || t.includes("typhoon")
  ) return "high";
  if (
    t.includes("alert") || t.includes("concern") || t.includes("risk") ||
    t.includes("tension") || category === "Natural Disasters" ||
    t.includes("breaking") || t.includes("urgent") || t.includes("flood")
  ) return "medium";
  return "low";
}

function guessCategory(title: string): Exclude<NewsCategory, "All"> {
  const t = title.toLowerCase();
  if (/(cricket|football|soccer|tennis|olympics|basketball|ipl|world cup|fifa|sport|match|tournament|innings|wicket|goal|score|league|championship|nba|nfl|grand prix)/i.test(t)) return "Sports";
  if (/(earthquake|tsunami|volcano|hurricane|typhoon|cyclone|flood|wildfire|tornado|eruption|landslide)/i.test(t)) return "Natural Disasters";
  if (/(war|conflict|military|ceasefire|troops|bombing|airstrike|missile|rebel|coup|terrorism|hostage)/i.test(t)) return "Conflict";
  if (/(ai|artificial intelligence|tech|cyber|crypto|bitcoin|apple|google|microsoft|meta|tesla|startup|software|hack)/i.test(t)) return "Technology";
  if (/(economy|inflation|recession|gdp|stock|trade|bank|interest rate|unemployment|tariff|rupee|dollar|euro)/i.test(t)) return "Economy";
  if (/(climate|environment|pollution|carbon|renewable|sustainability|deforest)/i.test(t)) return "Environment";
  if (/(health|virus|vaccine|pandemic|epidemic|disease|hospital|medicine|fda|cancer|outbreak)/i.test(t)) return "Health";
  if (/(weather|heatwave|storm|blizzard|drought|monsoon|temperature)/i.test(t)) return "Weather";
  if (/(nasa|space|mars|moon|astronomy|quantum|physics|research|discovery|science|spacex)/i.test(t)) return "Science";
  if (/(india|delhi|mumbai|bangalore|modi|bjp|isro|bollywood|ipl|rupee|sensex)/i.test(t)) return "India";
  if (/(merger|acquisition|ipo|earnings|revenue|profit|layoffs|funding|unicorn)/i.test(t)) return "Business";
  if (/(movie|film|netflix|grammy|oscar|celebrity|music|concert|entertainment|award)/i.test(t)) return "Entertainment";
  if (/(murder|arrest|robbery|fraud|scam|corruption|verdict|trial|prison|crime)/i.test(t)) return "Crime";
  return "Geopolitics";
}

// Fetch via edge function proxy (bypasses CORS)
async function fetchGDELTViaProxy(query: string, maxRecords: number): Promise<GDELTArticle[]> {
  try {
    const { data, error } = await supabase.functions.invoke('news-proxy', {
      body: { query, maxRecords },
    });
    if (error) throw error;
    return (data?.articles || []).filter((a: GDELTArticle) => a.url && a.title);
  } catch (err) {
    logger.error("news-proxy failed:", err);
    return [];
  }
}

function toArticle(a: GDELTArticle, category: string, index: number): NewsArticle {
  const ts = parseSeen(a.seendate);
  const title = (a.title || "Breaking News").slice(0, 200);
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
  maxRecords = 20
): Promise<NewsArticle[]> {
  const raw = await fetchGDELTViaProxy(CATEGORY_QUERIES[category], maxRecords);
  return raw.map((a, i) => toArticle(a, category, i));
}

async function fetchAllNews(): Promise<NewsArticle[]> {
  const primaryCategories: Exclude<NewsCategory, "All">[] = [
    "Geopolitics", "Sports", "Natural Disasters", "Conflict",
    "Technology", "Economy", "Weather", "Health", "India", "Business",
  ];

  const secondaryCategories: Exclude<NewsCategory, "All">[] = [
    "Environment", "Science", "Entertainment", "Crime",
  ];

  // Fetch primary + general + regional in parallel
  const [primaryResults, secondaryResults, generalRaw, asiaRaw, middleEastRaw] = await Promise.all([
    Promise.all(primaryCategories.map((cat) => fetchCategoryNews(cat, 15))),
    Promise.all(secondaryCategories.map((cat) => fetchCategoryNews(cat, 10))),
    fetchGDELTViaProxy(GENERAL_QUERY, 25),
    fetchGDELTViaProxy(REGIONAL_QUERIES.Asia, 15),
    fetchGDELTViaProxy(REGIONAL_QUERIES.MiddleEast, 10),
  ]);

  const seen = new Set<string>();
  const all: NewsArticle[] = [];

  // Add all category articles
  for (const articles of [...primaryResults, ...secondaryResults]) {
    for (const a of articles) {
      const key = a.title.slice(0, 60).toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        all.push(a);
      }
    }
  }

  // Add general + regional articles with auto-classified categories
  const extraRaw = [...generalRaw, ...asiaRaw, ...middleEastRaw];
  for (let i = 0; i < extraRaw.length; i++) {
    const raw = extraRaw[i];
    const title = (raw.title || "").slice(0, 200);
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
    queryFn: () => category ? fetchCategoryNews(category, 25) : fetchAllNews(),
    refetchInterval: 5 * 60 * 1000,
    staleTime: 3 * 60 * 1000,
    retry: 2,
  });
}
