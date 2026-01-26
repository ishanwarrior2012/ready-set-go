import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Waves, 
  ExternalLink, 
  Search, 
  AlertTriangle, 
  Clock, 
  MapPin,
  Activity,
  Info
} from "lucide-react";
import { useState } from "react";

// Sample tsunami data
const recentTsunamis = [
  {
    id: 1,
    location: "Tonga Islands",
    date: "2024-01-15",
    magnitude: 7.2,
    status: "warning",
    waveHeight: "1.2m",
    origin: "Volcanic",
  },
  {
    id: 2,
    location: "Chile Coast",
    date: "2024-01-10",
    magnitude: 6.8,
    status: "watch",
    waveHeight: "0.5m",
    origin: "Earthquake",
  },
  {
    id: 3,
    location: "Japan, Honshu",
    date: "2024-01-05",
    magnitude: 6.5,
    status: "advisory",
    waveHeight: "0.3m",
    origin: "Earthquake",
  },
  {
    id: 4,
    location: "Alaska, Aleutian Islands",
    date: "2023-12-28",
    magnitude: 7.0,
    status: "information",
    waveHeight: "0.8m",
    origin: "Earthquake",
  },
];

const activeBuoys = [
  { id: "46001", location: "Gulf of Alaska", status: "active", lastUpdate: "2 min ago" },
  { id: "51003", location: "Western Hawaii", status: "active", lastUpdate: "5 min ago" },
  { id: "32411", location: "Eastern Pacific", status: "active", lastUpdate: "3 min ago" },
  { id: "21413", location: "Northwest Pacific", status: "maintenance", lastUpdate: "1 hour ago" },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case "warning":
      return "bg-destructive text-destructive-foreground";
    case "watch":
      return "bg-orange-500 text-white";
    case "advisory":
      return "bg-yellow-500 text-black";
    case "information":
      return "bg-blue-500 text-white";
    default:
      return "bg-muted text-muted-foreground";
  }
};

const getStatusBadge = (status: string) => {
  return (
    <Badge className={getStatusColor(status)}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
};

const Tsunami = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const openTsunamiMap = () => {
    window.open("https://www.tsunami.gov/", "_blank", "noopener,noreferrer");
  };

  const searchTsunami = () => {
    if (searchQuery.trim()) {
      window.open(
        `https://www.ngdc.noaa.gov/hazel/view/hazards/tsunami/event-search?searchText=${encodeURIComponent(searchQuery)}`,
        "_blank",
        "noopener,noreferrer"
      );
    }
  };

  return (
    <Layout>
      <div className="flex flex-col gap-4 sm:gap-6 p-4 sm:p-6 pb-24">
        {/* Header */}
        <section className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Waves className="h-5 w-5 text-primary" />
            </div>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold">
              Tsunami Monitor
            </h1>
          </div>
          <p className="text-muted-foreground text-sm sm:text-base">
            Track tsunami warnings, watches, and ocean buoy data in real-time
          </p>
        </section>

        {/* Embedded NOAA Tsunami Map */}
        <section className="w-full">
          <div className="relative w-full h-[400px] sm:h-[500px] bg-muted rounded-lg overflow-hidden">
            <iframe
              src="https://tsunami.coast.noaa.gov/"
              className="w-full h-full border-0"
              title="NOAA Tsunami Warning Center"
              sandbox="allow-scripts allow-same-origin allow-popups"
            />
            <div className="absolute bottom-3 right-3 flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                className="gap-1.5 shadow-lg"
                onClick={openTsunamiMap}
              >
                <ExternalLink className="h-4 w-4" />
                <span className="hidden sm:inline">Full Screen</span>
              </Button>
            </div>
            {/* Map Legend */}
            <div className="absolute top-3 left-3 bg-background/90 backdrop-blur-sm rounded-lg p-2 text-xs space-y-1 shadow-lg">
              <div className="font-semibold mb-1">Alert Levels</div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-destructive" />
                <span>Warning</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-500" />
                <span>Watch</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <span>Advisory</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span>Information</span>
              </div>
            </div>
          </div>
        </section>

        {/* Search */}
        <section className="w-full">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tsunami events by location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchTsunami()}
                className="pl-9"
              />
            </div>
            <Button onClick={searchTsunami} disabled={!searchQuery.trim()}>
              Search
            </Button>
          </div>
        </section>

        {/* Quick Stats */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-4 text-center">
              <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-destructive" />
              <p className="text-2xl font-bold">1</p>
              <p className="text-xs text-muted-foreground">Active Warnings</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Activity className="h-6 w-6 mx-auto mb-2 text-orange-500" />
              <p className="text-2xl font-bold">2</p>
              <p className="text-xs text-muted-foreground">Watch Areas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Waves className="h-6 w-6 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">42</p>
              <p className="text-xs text-muted-foreground">Active Buoys</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Clock className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
              <p className="text-2xl font-bold">4</p>
              <p className="text-xs text-muted-foreground">Recent Events</p>
            </CardContent>
          </Card>
        </section>

        {/* Tabs for Events and Buoys */}
        <Tabs defaultValue="events" className="w-full">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="events" className="flex-1 sm:flex-none">
              Recent Events
            </TabsTrigger>
            <TabsTrigger value="buoys" className="flex-1 sm:flex-none">
              Ocean Buoys
            </TabsTrigger>
          </TabsList>

          <TabsContent value="events" className="mt-4 space-y-3">
            {recentTsunamis.map((tsunami) => (
              <Card 
                key={tsunami.id} 
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => window.open(`https://www.ngdc.noaa.gov/hazel/view/hazards/tsunami/event-search?searchText=${encodeURIComponent(tsunami.location)}`, "_blank", "noopener,noreferrer")}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                        <h3 className="font-semibold truncate">{tsunami.location}</h3>
                      </div>
                      <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                        <span>M{tsunami.magnitude}</span>
                        <span>•</span>
                        <span>{tsunami.waveHeight} wave</span>
                        <span>•</span>
                        <span>{tsunami.origin}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{tsunami.date}</p>
                    </div>
                    <div className="shrink-0">
                      {getStatusBadge(tsunami.status)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="buoys" className="mt-4 space-y-3">
            {activeBuoys.map((buoy) => (
              <Card key={buoy.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Activity className="h-4 w-4 text-muted-foreground shrink-0" />
                        <h3 className="font-semibold">Buoy #{buoy.id}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">{buoy.location}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Last update: {buoy.lastUpdate}
                      </p>
                    </div>
                    <Badge variant={buoy.status === "active" ? "default" : "secondary"}>
                      {buoy.status === "active" ? "Active" : "Maintenance"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>

        {/* Info Card */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold mb-1">Tsunami Safety</h4>
                <p className="text-sm text-muted-foreground">
                  If you feel a strong earthquake near the coast, move to higher ground immediately. 
                  Don't wait for an official warning. Natural warning signs include unusual ocean behavior 
                  like rapid rising or draining of water.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Tsunami;
