import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Flame, Wind, Droplets, Thermometer, RefreshCw, MapPin, AlertTriangle, Clock, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface Wildfire {
  id: string;
  name: string;
  location: string;
  country: string;
  containment: number;
  acres: number;
  status: "active" | "contained" | "monitored";
  windSpeed: number;
  humidity: number;
  temperature: number;
  startDate: string;
  cause: string;
  threat: "extreme" | "high" | "medium" | "low";
  lat: number;
  lon: number;
}

const MOCK_FIRES: Wildfire[] = [
  { id: "f1", name: "Sierra Blaze", location: "Sierra Nevada, CA", country: "USA", containment: 12, acres: 45200, status: "active", windSpeed: 28, humidity: 8, temperature: 38, startDate: "2024-07-15", cause: "Lightning", threat: "extreme", lat: 37.5, lon: -119.5 },
  { id: "f2", name: "Outback Fire #7", location: "Northern Territory", country: "Australia", containment: 0, acres: 120000, status: "active", windSpeed: 35, humidity: 5, temperature: 42, startDate: "2024-07-12", cause: "Unknown", threat: "extreme", lat: -20.0, lon: 134.0 },
  { id: "f3", name: "Mediterranean Coast Fire", location: "Attica Region", country: "Greece", containment: 45, acres: 8500, status: "active", windSpeed: 20, humidity: 12, temperature: 36, startDate: "2024-07-16", cause: "Human activity", threat: "high", lat: 38.0, lon: 23.7 },
  { id: "f4", name: "Amazon Sector 12", location: "Pará State", country: "Brazil", containment: 0, acres: 95000, status: "active", windSpeed: 15, humidity: 35, temperature: 33, startDate: "2024-07-10", cause: "Deforestation", threat: "high", lat: -3.5, lon: -52.0 },
  { id: "f5", name: "Rocky Mountain Fire", location: "Colorado", country: "USA", containment: 68, acres: 12300, status: "active", windSpeed: 18, humidity: 20, temperature: 31, startDate: "2024-07-08", cause: "Campfire", threat: "medium", lat: 39.5, lon: -106.0 },
  { id: "f6", name: "Siberian Taiga Blaze", location: "Yakutia Region", country: "Russia", containment: 10, acres: 680000, status: "monitored", windSpeed: 12, humidity: 18, temperature: 28, startDate: "2024-07-01", cause: "Lightning", threat: "medium", lat: 63.0, lon: 130.0 },
  { id: "f7", name: "Cape Fire 2024", location: "Western Cape", country: "South Africa", containment: 89, acres: 3200, status: "contained", windSpeed: 10, humidity: 45, temperature: 22, startDate: "2024-07-14", cause: "Arson", threat: "low", lat: -34.0, lon: 18.5 },
];

const STATUS_COLORS = {
  active: "text-red-500 bg-red-500/10 border-red-500/20",
  contained: "text-green-500 bg-green-500/10 border-green-500/20",
  monitored: "text-yellow-500 bg-yellow-500/10 border-yellow-500/20",
};

const THREAT_BAR = {
  extreme: "bg-red-500 w-full",
  high: "bg-orange-500 w-3/4",
  medium: "bg-yellow-500 w-1/2",
  low: "bg-green-500 w-1/4",
};

const FILTERS = ["All", "Active", "Contained", "Monitored", "Extreme Threat"];

export default function FireMap() {
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { setTimeout(() => setLoading(false), 800); }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 700);
  };

  const filtered = MOCK_FIRES.filter(f => {
    if (filter === "All") return true;
    if (filter === "Active") return f.status === "active";
    if (filter === "Contained") return f.status === "contained";
    if (filter === "Monitored") return f.status === "monitored";
    if (filter === "Extreme Threat") return f.threat === "extreme";
    return true;
  });

  const totalAcres = MOCK_FIRES.filter(f => f.status === "active").reduce((s, f) => s + f.acres, 0);

  return (
    <Layout>
      <div className="page-container space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="p-3 text-center">
            <div className="text-2xl font-bold text-red-500">{MOCK_FIRES.filter(f => f.status === "active").length}</div>
            <div className="text-xs text-muted-foreground">Active Fires</div>
          </Card>
          <Card className="p-3 text-center">
            <div className="text-2xl font-bold text-orange-500">{MOCK_FIRES.filter(f => f.threat === "extreme").length}</div>
            <div className="text-xs text-muted-foreground">Extreme Threat</div>
          </Card>
          <Card className="p-3 text-center">
            <div className="text-2xl font-bold text-amber-500">{(totalAcres / 1000).toFixed(0)}k</div>
            <div className="text-xs text-muted-foreground">Acres Burning</div>
          </Card>
          <Card className="p-3 text-center">
            <div className="text-2xl font-bold text-green-500">{MOCK_FIRES.filter(f => f.status === "contained").length}</div>
            <div className="text-xs text-muted-foreground">Contained</div>
          </Card>
        </div>

        {/* Global Alert Banner */}
        <Card className="p-3 border-red-500/30 bg-red-500/5 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-500">Elevated Global Fire Risk</p>
            <p className="text-xs text-muted-foreground">Dry conditions and high winds are escalating fire spread across multiple continents</p>
          </div>
        </Card>

        {/* Filter + Refresh */}
        <div className="flex items-center gap-2">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide flex-1">
            {FILTERS.map(f => (
              <button key={f} onClick={() => setFilter(f)} className={cn(
                "shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                filter === f ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-muted"
              )}>{f}</button>
            ))}
          </div>
          <Button variant="outline" size="icon" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
          </Button>
        </div>

        {/* Fire List */}
        {loading ? (
          <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
        ) : (
          <div className="space-y-3">
            {filtered.map(fire => (
              <Card key={fire.id} className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-orange-600 shrink-0">
                      <Flame className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">{fire.name}</h3>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />{fire.location}, {fire.country}
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline" className={cn("text-xs border shrink-0", STATUS_COLORS[fire.status])}>
                    {fire.status.toUpperCase()}
                  </Badge>
                </div>

                {/* Containment bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Containment</span>
                    <span className="font-medium">{fire.containment}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${fire.containment}%` }} />
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  <div>
                    <div className="flex items-center justify-center gap-1 text-muted-foreground mb-0.5"><TrendingUp className="h-3 w-3" /></div>
                    <div className="font-medium">{fire.acres.toLocaleString()}</div>
                    <div className="text-muted-foreground">acres</div>
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-1 text-muted-foreground mb-0.5"><Wind className="h-3 w-3" /></div>
                    <div className="font-medium">{fire.windSpeed} mph</div>
                    <div className="text-muted-foreground">wind</div>
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-1 text-muted-foreground mb-0.5"><Droplets className="h-3 w-3" /></div>
                    <div className="font-medium">{fire.humidity}%</div>
                    <div className="text-muted-foreground">humidity</div>
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-1 text-muted-foreground mb-0.5"><Thermometer className="h-3 w-3" /></div>
                    <div className="font-medium">{fire.temperature}°C</div>
                    <div className="text-muted-foreground">temp</div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />Started {fire.startDate}</span>
                  <span>Cause: {fire.cause}</span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
