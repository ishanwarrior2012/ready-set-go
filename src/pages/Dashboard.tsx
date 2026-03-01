import { Layout } from "@/components/layout/Layout";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { QuickAccessGrid } from "@/components/dashboard/QuickAccessGrid";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Maximize2, Globe, Download, LayoutGrid, X, Newspaper, Satellite, Flame, Car } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useLiveStats } from "@/hooks/useLiveStats";

const WIDGET_OPTIONS = [
  { id: "stats", label: "Live Stats", defaultVisible: true },
  { id: "map", label: "Live Map", defaultVisible: true },
  { id: "quickaccess", label: "Quick Access", defaultVisible: true },
  { id: "activity", label: "Activity Feed", defaultVisible: true },
  { id: "feeds", label: "Live Feeds Summary", defaultVisible: true },
];

export default function Dashboard() {
  const [showFullMap, setShowFullMap] = useState(false);
  const [customizing, setCustomizing] = useState(false);
  const [visibleWidgets, setVisibleWidgets] = useState<Record<string, boolean>>(
    Object.fromEntries(WIDGET_OPTIONS.map(w => [w.id, w.defaultVisible]))
  );
  const { toast } = useToast();
  const liveStats = useLiveStats();

  const toggleWidget = (id: string) => {
    setVisibleWidgets(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleExport = () => {
    const exportData = {
      exportedAt: new Date().toISOString(),
      stats: {
        activeFlights: liveStats.activeFlights,
        shipsTracked: liveStats.shipsTracked,
        recentQuakes: liveStats.recentQuakes,
      },
      note: "SafeTrack dashboard snapshot",
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `safetrack-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Export complete", description: "Dashboard data downloaded as JSON." });
  };

  return (
    <Layout>
      <div className="p-4 space-y-6 animate-fade-in">
        {/* Welcome Section */}
        <section>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-heading text-2xl font-bold">Welcome back</h1>
              <p className="text-muted-foreground">Here's what's happening around the world</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExport}>
                <Download className="h-4 w-4" />
                Export
              </Button>
              <Button
                variant={customizing ? "default" : "outline"}
                size="sm"
                className="gap-1.5"
                onClick={() => setCustomizing(!customizing)}
              >
                <LayoutGrid className="h-4 w-4" />
                {customizing ? "Done" : "Widgets"}
              </Button>
            </div>
          </div>

          {/* Widget customization panel */}
          {customizing && (
            <Card className="mt-3 p-3 border-primary/30 bg-primary/5">
              <p className="text-xs font-medium text-muted-foreground mb-2">Toggle dashboard sections:</p>
              <div className="flex flex-wrap gap-2">
                {WIDGET_OPTIONS.map(w => (
                  <button key={w.id} onClick={() => toggleWidget(w.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      visibleWidgets[w.id]
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted text-muted-foreground border-border"
                    }`}
                  >
                    {!visibleWidgets[w.id] && <X className="h-3 w-3" />}
                    {w.label}
                  </button>
                ))}
              </div>
            </Card>
          )}
        </section>

        {/* Stats Cards */}
        {visibleWidgets.stats && <StatsCards />}

        {/* Mini Map Preview */}
        {visibleWidgets.map && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-heading text-lg font-semibold flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Live Map
              </h2>
              <Button variant="ghost" size="sm" onClick={() => setShowFullMap(!showFullMap)} className="gap-1">
                <Maximize2 className="h-4 w-4" />
                {showFullMap ? "Collapse" : "Expand"}
              </Button>
            </div>
            <Card className="overflow-hidden">
              <Link
                to="/flights"
                className={`flex flex-col items-center justify-center bg-gradient-to-br from-muted to-muted/50 transition-all duration-300 hover:from-primary/10 hover:to-primary/5 ${showFullMap ? "h-80" : "h-48"}`}
              >
                <Globe className="h-12 w-12 text-muted-foreground mb-2" />
                <span className="text-muted-foreground font-medium">Open Interactive Map</span>
                <span className="text-xs text-muted-foreground/70 mt-1">Click to explore flights, ships & more</span>
              </Link>
            </Card>
          </section>
        )}

        {/* Live Feeds Summary */}
        {visibleWidgets.feeds && (
          <section>
            <h2 className="font-heading text-lg font-semibold mb-3">Live Feeds</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "News Feed", desc: "Latest global alerts", icon: Newspaper, path: "/news", badge: "Live", badgeColor: "bg-blue-500" },
                { label: "Space Tracker", desc: "Satellites & asteroids", icon: Satellite, path: "/space", badge: "Live", badgeColor: "bg-violet-500" },
                { label: "Fire Map", desc: "Active wildfires", icon: Flame, path: "/fires", badge: "Alert", badgeColor: "bg-red-500" },
                { label: "Traffic", desc: "Road incidents", icon: Car, path: "/traffic", badge: "Live", badgeColor: "bg-amber-500" },
              ].map(feed => (
                <Link key={feed.path} to={feed.path}>
                  <Card className="p-3 hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer">
                    <div className="flex items-center gap-2 mb-1.5">
                      <feed.icon className="h-4 w-4 text-primary" />
                      <span className="text-xs font-semibold">{feed.label}</span>
                      <span className={`ml-auto text-[10px] font-bold text-white px-1.5 py-0.5 rounded-full ${feed.badgeColor}`}>{feed.badge}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{feed.desc}</p>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Quick Access Grid */}
        {visibleWidgets.quickaccess && <QuickAccessGrid />}

        {/* Recent Activity */}
        {visibleWidgets.activity && <ActivityFeed />}
      </div>
    </Layout>
  );
}
