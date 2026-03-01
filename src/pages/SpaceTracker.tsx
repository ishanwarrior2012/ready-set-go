import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Orbit, Satellite, Star, Zap, RefreshCw, Globe, AlertTriangle, Telescope, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface SpaceObject {
  id: string;
  name: string;
  type: "satellite" | "asteroid" | "iss" | "debris";
  altitude?: number;
  speed?: number;
  distance?: number;
  threat?: "none" | "low" | "medium" | "high";
  status: string;
  details: string;
}

interface SpaceWeather {
  kpIndex: number;
  solarFlareClass: string;
  geomagneticStorm: string;
  solarWind: number;
  updated: string;
}

const MOCK_OBJECTS: SpaceObject[] = [
  { id: "iss", name: "ISS (ZARYA)", type: "iss", altitude: 408, speed: 27600, threat: "none", status: "Operational", details: "International Space Station – currently orbiting Earth" },
  { id: "s1", name: "STARLINK-5023", type: "satellite", altitude: 550, speed: 27400, threat: "none", status: "Active", details: "SpaceX Starlink broadband constellation satellite" },
  { id: "s2", name: "TERRA", type: "satellite", altitude: 705, speed: 26900, threat: "none", status: "Active", details: "NASA Earth Observing System flagship satellite" },
  { id: "a1", name: "2024 BX1", type: "asteroid", distance: 384400, threat: "low", status: "Monitoring", details: "Near-Earth asteroid, close approach in 3 weeks" },
  { id: "a2", name: "99942 APOPHIS", type: "asteroid", distance: 38500000, threat: "medium", status: "Tracked", details: "Potentially hazardous asteroid under close observation" },
  { id: "d1", name: "COSMOS 1408 DEB", type: "debris", altitude: 485, speed: 27200, threat: "low", status: "Tracked", details: "Debris from 2021 ASAT test, collision risk monitored" },
  { id: "d2", name: "FENGYUN 1C DEB", type: "debris", altitude: 850, speed: 26500, threat: "none", status: "Tracked", details: "Legacy debris fragment, stable orbit" },
  { id: "s3", name: "GOES-18", type: "satellite", altitude: 35786, speed: 11000, threat: "none", status: "Active", details: "NOAA geostationary weather satellite – Western USA" },
];

const TYPE_ICON = {
  iss: Orbit,
  satellite: Satellite,
  asteroid: Star,
  debris: Zap,
};

const TYPE_COLOR = {
  iss: "from-blue-500 to-cyan-600",
  satellite: "from-indigo-500 to-blue-600",
  asteroid: "from-amber-500 to-orange-600",
  debris: "from-red-500 to-rose-600",
};

const THREAT_COLORS = {
  none: "text-green-500 bg-green-500/10 border-green-500/20",
  low: "text-yellow-500 bg-yellow-500/10 border-yellow-500/20",
  medium: "text-orange-500 bg-orange-500/10 border-orange-500/20",
  high: "text-red-500 bg-red-500/10 border-red-500/20",
};

const FILTERS = ["All", "Satellites", "Asteroids", "ISS", "Debris"];

export default function SpaceTracker() {
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [weather, setWeather] = useState<SpaceWeather | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setWeather({ kpIndex: 3.2, solarFlareClass: "M1.4", geomagneticStorm: "Minor", solarWind: 420, updated: new Date().toLocaleTimeString() });
      setLoading(false);
    }, 800);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => { setRefreshing(false); }, 700);
  };

  const filtered = MOCK_OBJECTS.filter(o => {
    if (filter === "All") return true;
    if (filter === "Satellites") return o.type === "satellite";
    if (filter === "Asteroids") return o.type === "asteroid";
    if (filter === "ISS") return o.type === "iss";
    if (filter === "Debris") return o.type === "debris";
    return true;
  });

  const getKpColor = (kp: number) => kp >= 7 ? "text-red-500" : kp >= 5 ? "text-orange-500" : kp >= 3 ? "text-yellow-500" : "text-green-500";

  return (
    <Layout>
      <div className="page-container space-y-4">
        {/* Space Weather Card */}
        {loading ? (
          <Card className="p-4 flex justify-center"><LoadingSpinner /></Card>
        ) : weather && (
          <Card className="p-4 bg-gradient-to-br from-indigo-950/50 to-blue-950/50 border-indigo-500/20">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="h-5 w-5 text-indigo-400" />
              <h3 className="font-semibold">Space Weather</h3>
              <Badge variant="outline" className="ml-auto text-xs">Updated {weather.updated}</Badge>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="text-center">
                <div className={cn("text-2xl font-bold", getKpColor(weather.kpIndex))}>{weather.kpIndex}</div>
                <div className="text-xs text-muted-foreground">Kp Index</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-400">{weather.solarFlareClass}</div>
                <div className="text-xs text-muted-foreground">Solar Flare</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">{weather.geomagneticStorm}</div>
                <div className="text-xs text-muted-foreground">Geo Storm</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">{weather.solarWind}</div>
                <div className="text-xs text-muted-foreground">Solar Wind km/s</div>
              </div>
            </div>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "Satellites", count: MOCK_OBJECTS.filter(o => o.type === "satellite").length, color: "text-blue-500" },
            { label: "Asteroids", count: MOCK_OBJECTS.filter(o => o.type === "asteroid").length, color: "text-amber-500" },
            { label: "Debris", count: MOCK_OBJECTS.filter(o => o.type === "debris").length, color: "text-red-500" },
            { label: "Threats", count: MOCK_OBJECTS.filter(o => o.threat && o.threat !== "none").length, color: "text-orange-500" },
          ].map(s => (
            <Card key={s.label} className="p-2 text-center">
              <div className={cn("text-xl font-bold", s.color)}>{s.count}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </Card>
          ))}
        </div>

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

        {/* Objects List */}
        <div className="space-y-3">
          {filtered.map(obj => {
            const Icon = TYPE_ICON[obj.type];
            return (
              <Card key={obj.id} className="p-4">
                <div className="flex items-start gap-3">
                  <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br shrink-0", TYPE_COLOR[obj.type])}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-semibold text-sm">{obj.name}</h3>
                      {obj.threat && obj.threat !== "none" && (
                        <Badge variant="outline" className={cn("text-xs border", THREAT_COLORS[obj.threat])}>
                          <AlertTriangle className="h-3 w-3 mr-1" />{obj.threat} threat
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{obj.details}</p>
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      {obj.altitude && <span className="flex items-center gap-1"><Globe className="h-3 w-3" />{obj.altitude.toLocaleString()} km alt</span>}
                      {obj.speed && <span className="flex items-center gap-1"><Zap className="h-3 w-3" />{obj.speed.toLocaleString()} km/h</span>}
                      {obj.distance && <span className="flex items-center gap-1"><Telescope className="h-3 w-3" />{obj.distance.toLocaleString()} km away</span>}
                      <Badge variant="secondary" className="text-xs">{obj.status}</Badge>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}
