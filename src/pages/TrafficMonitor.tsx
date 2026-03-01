import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Car, AlertTriangle, Construction, Clock, MapPin, RefreshCw, TrendingUp, Navigation, Radio } from "lucide-react";
import { cn } from "@/lib/utils";

interface TrafficIncident {
  id: string;
  title: string;
  type: "accident" | "construction" | "congestion" | "closure" | "hazard";
  location: string;
  city: string;
  country: string;
  severity: "critical" | "high" | "medium" | "low";
  delay: number; // minutes
  lane: string;
  reportedAt: string;
  estimated_clear: string;
  description: string;
}

const MOCK_INCIDENTS: TrafficIncident[] = [
  { id: "t1", title: "Multi-vehicle accident blocks 3 lanes", type: "accident", location: "I-405 Northbound near Exit 18", city: "Los Angeles", country: "USA", severity: "critical", delay: 65, lane: "3 of 4 lanes blocked", reportedAt: new Date(Date.now() - 20 * 60000).toISOString(), estimated_clear: "3:45 PM", description: "Major accident involving 5 vehicles. Emergency services on scene. Expect major delays." },
  { id: "t2", title: "Road construction – lane closure", type: "construction", location: "M25 Clockwise Junction 12-13", city: "London", country: "UK", severity: "high", delay: 40, lane: "Left lane closed", reportedAt: new Date(Date.now() - 120 * 60000).toISOString(), estimated_clear: "6:00 PM", description: "Scheduled maintenance work. Traffic management in place, expect delays during peak hours." },
  { id: "t3", title: "Heavy congestion – peak hour traffic", type: "congestion", location: "A100 Tower Bridge Road", city: "London", country: "UK", severity: "medium", delay: 22, lane: "All lanes slow", reportedAt: new Date(Date.now() - 15 * 60000).toISOString(), estimated_clear: "7:30 PM", description: "Typical peak hour congestion. Traffic moving at 8 mph average." },
  { id: "t4", title: "Full road closure – burst water main", type: "closure", location: "Rue de Rivoli near Place de la Concorde", city: "Paris", country: "France", severity: "critical", delay: 90, lane: "Full closure", reportedAt: new Date(Date.now() - 45 * 60000).toISOString(), estimated_clear: "Tomorrow 8:00 AM", description: "Emergency closure due to burst water main. Multiple diversions in place." },
  { id: "t5", title: "Debris on motorway – hazard alert", type: "hazard", location: "Autobahn A3 near Cologne", city: "Cologne", country: "Germany", severity: "medium", delay: 18, lane: "Right lane affected", reportedAt: new Date(Date.now() - 30 * 60000).toISOString(), estimated_clear: "1:00 PM", description: "Fallen cargo on road. Clearance vehicles en route. Reduce speed when approaching." },
  { id: "t6", title: "Bridge maintenance – reduced capacity", type: "construction", location: "Sydney Harbour Bridge", city: "Sydney", country: "Australia", severity: "low", delay: 10, lane: "2 lanes reduced to 1", reportedAt: new Date(Date.now() - 240 * 60000).toISOString(), estimated_clear: "End of month", description: "Ongoing structural maintenance on outer lanes. Plan alternate routes during rush hour." },
  { id: "t7", title: "Minor fender bender – shoulder only", type: "accident", location: "Highway 401 near Markham", city: "Toronto", country: "Canada", severity: "low", delay: 5, lane: "Shoulder only", reportedAt: new Date(Date.now() - 10 * 60000).toISOString(), estimated_clear: "12:30 PM", description: "Minor collision on shoulder. No lane blockage but rubbernecking causing minor slowdown." },
];

const TYPE_ICON = { accident: AlertTriangle, construction: Construction, congestion: TrendingUp, closure: Navigation, hazard: Radio };
const TYPE_COLOR = { accident: "from-red-500 to-rose-600", construction: "from-orange-500 to-amber-600", congestion: "from-yellow-500 to-orange-500", closure: "from-red-600 to-red-800", hazard: "from-amber-500 to-yellow-600" };
const SEV_COLORS = { critical: "text-red-500 bg-red-500/10 border-red-500/20", high: "text-orange-500 bg-orange-500/10 border-orange-500/20", medium: "text-yellow-500 bg-yellow-500/10 border-yellow-500/20", low: "text-green-500 bg-green-500/10 border-green-500/20" };

function timeAgo(d: string) {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  return m < 60 ? `${m}m ago` : `${Math.floor(m / 60)}h ago`;
}

const FILTERS = ["All", "Accidents", "Construction", "Congestion", "Closures", "Hazards"];

export default function TrafficMonitor() {
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { setTimeout(() => setLoading(false), 800); }, []);

  const handleRefresh = () => { setRefreshing(true); setTimeout(() => setRefreshing(false), 700); };

  const filtered = MOCK_INCIDENTS.filter(i => {
    if (filter === "All") return true;
    if (filter === "Accidents") return i.type === "accident";
    if (filter === "Construction") return i.type === "construction";
    if (filter === "Congestion") return i.type === "congestion";
    if (filter === "Closures") return i.type === "closure";
    if (filter === "Hazards") return i.type === "hazard";
    return true;
  });

  const totalDelay = MOCK_INCIDENTS.reduce((s, i) => s + i.delay, 0);
  const criticalCount = MOCK_INCIDENTS.filter(i => i.severity === "critical").length;

  return (
    <Layout>
      <div className="page-container space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="p-3 text-center">
            <div className="text-2xl font-bold text-primary">{MOCK_INCIDENTS.length}</div>
            <div className="text-xs text-muted-foreground">Active Incidents</div>
          </Card>
          <Card className="p-3 text-center">
            <div className="text-2xl font-bold text-red-500">{criticalCount}</div>
            <div className="text-xs text-muted-foreground">Critical</div>
          </Card>
          <Card className="p-3 text-center">
            <div className="text-2xl font-bold text-orange-500">{totalDelay}</div>
            <div className="text-xs text-muted-foreground">Total Delay (min)</div>
          </Card>
          <Card className="p-3 text-center">
            <div className="text-2xl font-bold text-yellow-500">6</div>
            <div className="text-xs text-muted-foreground">Countries</div>
          </Card>
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

        {/* Incident List */}
        {loading ? (
          <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
        ) : (
          <div className="space-y-3">
            {filtered.map(incident => {
              const Icon = TYPE_ICON[incident.type];
              return (
                <Card key={incident.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br shrink-0", TYPE_COLOR[incident.type])}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-semibold text-sm leading-snug">{incident.title}</h3>
                        <Badge variant="outline" className={cn("text-xs border shrink-0", SEV_COLORS[incident.severity])}>
                          {incident.severity.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate">{incident.location}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-3">{incident.description}</p>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>+{incident.delay} min delay</span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Car className="h-3 w-3" />
                          <span>{incident.lane}</span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Navigation className="h-3 w-3" />
                          <span>{incident.city}, {incident.country}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                        <span>Reported {timeAgo(incident.reportedAt)}</span>
                        <span className="text-green-600">Clears ~{incident.estimated_clear}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
