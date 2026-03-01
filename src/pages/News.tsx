import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Newspaper, ExternalLink, Search, RefreshCw, Globe, AlertTriangle, TrendingUp, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  source: string;
  category: string;
  severity: "low" | "medium" | "high" | "critical";
  publishedAt: string;
  url: string;
  location?: string;
}

const CATEGORIES = ["All", "Natural Disasters", "Weather", "Geopolitical", "Health", "Technology", "Environment"];

const SEVERITY_COLORS = {
  low: "bg-green-500/10 text-green-600 border-green-500/20",
  medium: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  high: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  critical: "bg-red-500/10 text-red-600 border-red-500/20",
};

function generateMockNews(): NewsArticle[] {
  return [
    {
      id: "1",
      title: "Major Earthquake Strikes Pacific Ring of Fire Region",
      summary: "A 6.8 magnitude earthquake was recorded off the coast, triggering tsunami warnings for coastal communities. Authorities have issued evacuation orders for low-lying areas.",
      source: "USGS Alert",
      category: "Natural Disasters",
      severity: "critical",
      publishedAt: new Date(Date.now() - 15 * 60000).toISOString(),
      url: "#",
      location: "Pacific Ocean",
    },
    {
      id: "2",
      title: "Tropical Storm Intensifies to Category 3 Hurricane",
      summary: "Meteorologists warn that the storm is rapidly strengthening as it moves toward populated coastal areas. Residents are urged to prepare emergency kits.",
      source: "NOAA Weather",
      category: "Weather",
      severity: "high",
      publishedAt: new Date(Date.now() - 45 * 60000).toISOString(),
      url: "#",
      location: "Gulf of Mexico",
    },
    {
      id: "3",
      title: "Volcanic Activity Increases at Krakatau",
      summary: "Scientists monitoring Krakatau volcano report increased seismic activity and ash emissions. Aviation authorities have extended no-fly zones.",
      source: "Volcanic Monitor",
      category: "Natural Disasters",
      severity: "high",
      publishedAt: new Date(Date.now() - 2 * 3600000).toISOString(),
      url: "#",
      location: "Indonesia",
    },
    {
      id: "4",
      title: "Global CO₂ Levels Reach New Monthly Record",
      summary: "Atmospheric carbon dioxide concentrations have reached a new monthly high according to monitoring stations worldwide, signaling continued climate pressure.",
      source: "Climate Monitor",
      category: "Environment",
      severity: "medium",
      publishedAt: new Date(Date.now() - 4 * 3600000).toISOString(),
      url: "#",
      location: "Global",
    },
    {
      id: "5",
      title: "Wildfire Smoke Causes Air Quality Alerts Across Three States",
      summary: "Smoke from ongoing wildfires has drifted hundreds of miles, prompting health warnings and school closures in affected regions.",
      source: "EPA Alert",
      category: "Environment",
      severity: "medium",
      publishedAt: new Date(Date.now() - 5 * 3600000).toISOString(),
      url: "#",
      location: "Western USA",
    },
    {
      id: "6",
      title: "New Early Warning System Deployed for Tsunami Detection",
      summary: "International collaboration has resulted in deployment of advanced deep-sea sensors improving tsunami detection time by 40%. The system covers the entire Pacific basin.",
      source: "Tech News",
      category: "Technology",
      severity: "low",
      publishedAt: new Date(Date.now() - 8 * 3600000).toISOString(),
      url: "#",
      location: "Pacific Basin",
    },
    {
      id: "7",
      title: "Magnitude 4.2 Earthquake Felt in Urban Area",
      summary: "A moderate earthquake was felt across the metropolitan area. No major damage has been reported but aftershocks are expected over the coming days.",
      source: "USGS",
      category: "Natural Disasters",
      severity: "medium",
      publishedAt: new Date(Date.now() - 10 * 3600000).toISOString(),
      url: "#",
      location: "California, USA",
    },
    {
      id: "8",
      title: "Record-Breaking Heatwave Predicted for Next Week",
      summary: "Forecasters predict temperatures exceeding historical records across multiple countries. Health authorities are urging vulnerable populations to take precautions.",
      source: "World Weather",
      category: "Weather",
      severity: "high",
      publishedAt: new Date(Date.now() - 12 * 3600000).toISOString(),
      url: "#",
    },
  ];
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function News() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const loadNews = () => {
    setLoading(true);
    setTimeout(() => {
      setArticles(generateMockNews());
      setLoading(false);
    }, 800);
  };

  useEffect(() => { loadNews(); }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setArticles(generateMockNews());
      setRefreshing(false);
    }, 600);
  };

  const filtered = articles.filter(a => {
    const matchCat = selectedCategory === "All" || a.category === selectedCategory;
    const matchSearch = !searchQuery || a.title.toLowerCase().includes(searchQuery.toLowerCase()) || a.summary.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const criticalCount = articles.filter(a => a.severity === "critical" || a.severity === "high").length;

  return (
    <Layout>
      <div className="page-container space-y-4">
        {/* Header Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-3 text-center">
            <div className="text-2xl font-bold text-primary">{articles.length}</div>
            <div className="text-xs text-muted-foreground">Total Articles</div>
          </Card>
          <Card className="p-3 text-center">
            <div className="text-2xl font-bold text-destructive">{criticalCount}</div>
            <div className="text-xs text-muted-foreground">High Priority</div>
          </Card>
          <Card className="p-3 text-center">
            <div className="text-2xl font-bold text-green-500">Live</div>
            <div className="text-xs text-muted-foreground">Status</div>
          </Card>
        </div>

        {/* Search & Refresh */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search news..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
          </Button>
        </div>

        {/* Category Filters */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                selectedCategory === cat
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:bg-muted"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Articles */}
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.length === 0 ? (
              <Card className="p-8 text-center text-muted-foreground">
                <Newspaper className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p>No articles found</p>
              </Card>
            ) : (
              filtered.map(article => (
                <Card key={article.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className={cn("text-xs border", SEVERITY_COLORS[article.severity])}>
                        {article.severity === "critical" && <AlertTriangle className="h-3 w-3 mr-1" />}
                        {article.severity.toUpperCase()}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">{article.category}</Badge>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                      <Clock className="h-3 w-3" />
                      {timeAgo(article.publishedAt)}
                    </div>
                  </div>
                  <h3 className="font-semibold text-sm leading-snug mb-1">{article.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-3">{article.summary}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Globe className="h-3 w-3" />
                      <span>{article.source}</span>
                      {article.location && <><span>·</span><span>{article.location}</span></>}
                    </div>
                    <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                      Read <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
