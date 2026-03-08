import { useState, useMemo } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Newspaper,
  ExternalLink,
  Search,
  RefreshCw,
  Globe,
  AlertTriangle,
  Clock,
  Wifi,
  Trophy,
  CloudLightning,
  Cpu,
  Heart,
  Leaf,
  DollarSign,
  Telescope,
  Swords,
  FlameKindling,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLiveNews, NewsCategory, NewsArticle } from "@/hooks/useLiveNews";

// ─── Category config ─────────────────────────────────────────────────────────
const CATEGORIES: { id: NewsCategory; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: "All", label: "All", icon: Newspaper },
  { id: "Geopolitics", label: "Geopolitics", icon: Globe },
  { id: "Sports", label: "Sports", icon: Trophy },
  { id: "Conflict", label: "Conflict", icon: Swords },
  { id: "Natural Disasters", label: "Disasters", icon: FlameKindling },
  { id: "Weather", label: "Weather", icon: CloudLightning },
  { id: "Technology", label: "Tech", icon: Cpu },
  { id: "Economy", label: "Economy", icon: DollarSign },
  { id: "Health", label: "Health", icon: Heart },
  { id: "Environment", label: "Environment", icon: Leaf },
  { id: "Science", label: "Science", icon: Telescope },
];

const SEVERITY_STYLES: Record<NewsArticle["severity"], { badge: string; border: string }> = {
  low: { badge: "bg-green-500/10 text-green-600 border-green-500/20", border: "" },
  medium: { badge: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20", border: "border-l-2 border-l-yellow-500" },
  high: { badge: "bg-orange-500/10 text-orange-600 border-orange-500/20", border: "border-l-2 border-l-orange-500" },
  critical: { badge: "bg-destructive/10 text-destructive border-destructive/20", border: "border-l-2 border-l-destructive bg-destructive/5" },
};

const CATEGORY_COLORS: Partial<Record<NewsCategory, string>> = {
  Geopolitics: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  Sports: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  Conflict: "bg-red-500/10 text-red-600 border-red-500/20",
  "Natural Disasters": "bg-amber-500/10 text-amber-600 border-amber-500/20",
  Weather: "bg-sky-500/10 text-sky-600 border-sky-500/20",
  Technology: "bg-violet-500/10 text-violet-600 border-violet-500/20",
  Economy: "bg-teal-500/10 text-teal-600 border-teal-500/20",
  Health: "bg-pink-500/10 text-pink-600 border-pink-500/20",
  Environment: "bg-lime-500/10 text-lime-600 border-lime-500/20",
  Science: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return `${h}h ago`;
}

// ─── Sub-components ──────────────────────────────────────────────────────────
function ArticleSkeleton() {
  return (
    <Card className="p-4 space-y-3">
      <div className="flex gap-2">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-12 rounded-full ml-auto" />
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-4/5" />
      <div className="flex justify-between">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-7 w-16 rounded" />
      </div>
    </Card>
  );
}

interface ArticleCardProps {
  article: NewsArticle;
}

function ArticleCard({ article }: ArticleCardProps) {
  const s = SEVERITY_STYLES[article.severity];
  const catColor = CATEGORY_COLORS[article.category as NewsCategory] || "bg-muted text-muted-foreground border-border";

  return (
    <Card className={cn("p-4 hover:shadow-md transition-all group", s.border)}>
      {article.image && (
        <div className="relative w-full h-36 rounded-md overflow-hidden mb-3 bg-muted">
          <img
            src={article.image}
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = "none"; }}
            loading="lazy"
          />
        </div>
      )}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          {(article.severity === "high" || article.severity === "critical") && (
            <Badge variant="outline" className={cn("text-xs border", s.badge)}>
              {article.severity === "critical" && <AlertTriangle className="h-3 w-3 mr-1" />}
              {article.severity.toUpperCase()}
            </Badge>
          )}
          <Badge variant="outline" className={cn("text-xs border", catColor)}>
            {article.category}
          </Badge>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
          <Clock className="h-3 w-3" />
          {timeAgo(article.publishedTimestamp)}
        </div>
      </div>

      <h3 className="font-semibold text-sm leading-snug mb-1 line-clamp-2 group-hover:text-primary transition-colors">
        {article.title}
      </h3>

      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
          <Globe className="h-3 w-3 shrink-0" />
          <span className="truncate">{article.source}</span>
          {article.location && (
            <>
              <span className="shrink-0">·</span>
              <span className="truncate">{article.location}</span>
            </>
          )}
        </div>
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 hover:text-primary">
            Read <ExternalLink className="h-3 w-3" />
          </Button>
        </a>
      </div>
    </Card>
  );
}

// ─── Breaking ticker ──────────────────────────────────────────────────────────
function BreakingTicker({ articles }: { articles: NewsArticle[] }) {
  const breaking = articles.filter(
    (a) => a.severity === "critical" || a.severity === "high"
  ).slice(0, 5);
  if (!breaking.length) return null;

  return (
    <div className="flex items-center gap-3 bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2 overflow-hidden">
      <span className="shrink-0 flex items-center gap-1.5 text-xs font-bold text-destructive uppercase tracking-wider">
        <AlertTriangle className="h-3.5 w-3.5" />
        Breaking
      </span>
      <div className="overflow-hidden flex-1">
        <div className="flex gap-8 animate-[ticker_30s_linear_infinite] whitespace-nowrap">
          {[...breaking, ...breaking].map((a, i) => (
            <a
              key={i}
              href={a.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-foreground/80 hover:text-primary transition-colors"
            >
              {a.title}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Featured (top 3 critical) ────────────────────────────────────────────────
function FeaturedSection({ articles }: { articles: NewsArticle[] }) {
  const featured = articles.filter(
    (a) => a.severity === "critical" || a.severity === "high"
  ).slice(0, 3);
  if (!featured.length) return null;

  return (
    <section>
      <h2 className="font-heading text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
        <TrendingUp className="h-4 w-4" /> Top Stories
      </h2>
      <div className="grid grid-cols-1 gap-3">
        {featured.map((a) => (
          <ArticleCard key={a.id} article={a} />
        ))}
      </div>
    </section>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function News() {
  const { data: articles = [], isLoading, isFetching, refetch, dataUpdatedAt } = useLiveNews();
  const [selectedCategory, setSelectedCategory] = useState<NewsCategory>("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = useMemo(() => {
    return articles.filter((a) => {
      const matchCat = selectedCategory === "All" || a.category === selectedCategory;
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !q ||
        a.title.toLowerCase().includes(q) ||
        a.source.toLowerCase().includes(q) ||
        (a.location || "").toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [articles, selectedCategory, searchQuery]);

  const totalCount = articles.length;
  const criticalCount = articles.filter((a) => a.severity === "critical" || a.severity === "high").length;
  const lastUpdated = dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—";

  const showFeatured = selectedCategory === "All" && !searchQuery;

  return (
    <Layout>
      <div className="page-container space-y-4">
        {/* Header Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-3 text-center">
            <div className="text-2xl font-bold text-primary">{isLoading ? "…" : totalCount}</div>
            <div className="text-xs text-muted-foreground">Articles (18h)</div>
          </Card>
          <Card className="p-3 text-center">
            <div className="text-2xl font-bold text-destructive">{isLoading ? "…" : criticalCount}</div>
            <div className="text-xs text-muted-foreground">High Priority</div>
          </Card>
          <Card className="p-3 text-center">
            <div className={cn("text-2xl font-bold", isFetching ? "text-warning" : "text-success")}>
              {isFetching ? "…" : "Live"}
            </div>
            <div className="text-xs text-muted-foreground">Updated {lastUpdated}</div>
          </Card>
        </div>

        {/* Breaking ticker */}
        {!isLoading && <BreakingTicker articles={articles} />}

        {/* Search & Refresh */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search news, sources, locations…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={isFetching}
            title="Refresh"
          >
            <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
          </Button>
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {CATEGORIES.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setSelectedCategory(id)}
              className={cn(
                "shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                selectedCategory === id
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-3 w-3" />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <ArticleSkeleton key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="p-10 text-center">
            <Newspaper className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
            <p className="font-medium text-muted-foreground">No articles found</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              {searchQuery ? "Try a different search term" : "No news in the last 18 hours for this category"}
            </p>
          </Card>
        ) : (
          <div className="space-y-6">
            {showFeatured && <FeaturedSection articles={filtered} />}

            {/* All articles */}
            <section>
              {showFeatured && (
                <h2 className="font-heading text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Wifi className="h-4 w-4" /> Latest ({filtered.length})
                </h2>
              )}
              <div className="space-y-3">
                {filtered.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
            </section>

            {/* Live indicator */}
            <div className="flex items-center justify-center gap-2 py-3 text-xs text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              Live feed · Showing last 18 hours · Auto-refreshes every 5 min
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
