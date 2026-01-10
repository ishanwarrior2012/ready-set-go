import { Layout } from "@/components/layout/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Mountain, 
  Filter, 
  Clock, 
  AlertCircle, 
  ExternalLink,
  MapPin,
  Activity,
  TrendingUp
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { useState } from "react";

const recentQuakes = [
  { magnitude: 5.2, location: "Near Tokyo, Japan", time: "12 min ago", depth: "32 km", coords: "35.6762,139.6503" },
  { magnitude: 4.8, location: "Sumatra, Indonesia", time: "1 hour ago", depth: "45 km", coords: "-0.7893,113.9213" },
  { magnitude: 4.5, location: "California, USA", time: "2 hours ago", depth: "12 km", coords: "36.7783,-119.4179" },
  { magnitude: 6.1, location: "Chile", time: "4 hours ago", depth: "78 km", coords: "-35.6751,-71.5430" },
  { magnitude: 3.8, location: "Alaska, USA", time: "5 hours ago", depth: "18 km", coords: "64.2008,-149.4937" },
];

const significantQuakes = [
  { magnitude: 7.2, location: "Papua New Guinea", time: "2 days ago", depth: "120 km", coords: "-6.0000,145.0000" },
  { magnitude: 6.8, location: "Philippines", time: "5 days ago", depth: "95 km", coords: "12.8797,121.7740" },
];

function getMagnitudeColor(mag: number) {
  if (mag >= 7) return "bg-purple-600";
  if (mag >= 6) return "bg-red-500";
  if (mag >= 5) return "bg-orange-500";
  if (mag >= 4) return "bg-amber-500";
  return "bg-yellow-500";
}

export default function Earthquakes() {
  const [searchQuery, setSearchQuery] = useState("");

  const openFullMap = () => {
    window.open("https://www.volcanodiscovery.com/earthquakes/today.html", "_blank", "noopener,noreferrer");
  };

  const searchLocation = () => {
    if (searchQuery.trim()) {
      window.open(
        `https://www.volcanodiscovery.com/earthquakes/today.html#${encodeURIComponent(searchQuery)}`,
        "_blank",
        "noopener,noreferrer"
      );
    }
  };

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <section className="px-4 pt-4">
          <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
            <Mountain className="h-6 w-6 text-orange-500" />
            Earthquake Monitor
          </h1>
          <p className="text-muted-foreground">
            Real-time seismic activity worldwide
          </p>
        </section>

        {/* Embedded USGS Map */}
        <section className="w-full">
          <div className="relative w-full h-[400px] sm:h-[500px] bg-muted rounded-lg overflow-hidden">
            <iframe
              src="https://www.volcanodiscovery.com/earthquakes/today.html"
              className="w-full h-full border-0"
              title="VolcanoDiscovery Earthquake Map"
            />
            <Button 
              onClick={openFullMap}
              className="absolute top-3 right-3 gap-2 bg-orange-500 hover:bg-orange-600 shadow-lg"
              size="sm"
            >
              <ExternalLink className="h-4 w-4" />
              Open Full Screen
            </Button>
            
            {/* Legend Overlay */}
            <Card className="absolute bottom-3 left-3 p-3 bg-background/95 backdrop-blur">
              <p className="text-xs font-medium mb-2">Magnitude Scale</p>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="flex items-center gap-1">
                  <div className="h-3 w-3 rounded-full bg-yellow-500" /> 3-4
                </span>
                <span className="flex items-center gap-1">
                  <div className="h-3 w-3 rounded-full bg-amber-500" /> 4-5
                </span>
                <span className="flex items-center gap-1">
                  <div className="h-3 w-3 rounded-full bg-orange-500" /> 5-6
                </span>
                <span className="flex items-center gap-1">
                  <div className="h-3 w-3 rounded-full bg-red-500" /> 6-7
                </span>
                <span className="flex items-center gap-1">
                  <div className="h-3 w-3 rounded-full bg-purple-600" /> 7+
                </span>
              </div>
            </Card>
          </div>
        </section>

        {/* Search */}
        <section className="px-4">
          <h2 className="font-heading text-lg font-semibold mb-3 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Search by Location
          </h2>
          <Card className="p-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter location (e.g., California, Japan)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchLocation()}
                className="flex-1"
              />
              <Button onClick={searchLocation} disabled={!searchQuery.trim()}>
                Search
              </Button>
            </div>
          </Card>
        </section>

        {/* Stats Cards */}
        <section className="px-4">
          <div className="grid grid-cols-3 gap-3">
            <Card className="p-3 text-center">
              <Activity className="h-5 w-5 mx-auto mb-1 text-orange-500" />
              <p className="text-2xl font-bold">{recentQuakes.length}</p>
              <p className="text-xs text-muted-foreground">Last 24h</p>
            </Card>
            <Card className="p-3 text-center">
              <TrendingUp className="h-5 w-5 mx-auto mb-1 text-red-500" />
              <p className="text-2xl font-bold">6.1</p>
              <p className="text-xs text-muted-foreground">Max Mag</p>
            </Card>
            <Card className="p-3 text-center">
              <AlertCircle className="h-5 w-5 mx-auto mb-1 text-amber-500" />
              <p className="text-2xl font-bold">{significantQuakes.length}</p>
              <p className="text-xs text-muted-foreground">Significant</p>
            </Card>
          </div>
        </section>

        {/* Earthquake List */}
        <section className="px-4 pb-4">
          <Tabs defaultValue="recent">
            <TabsList className="w-full">
              <TabsTrigger value="recent" className="flex-1">Recent</TabsTrigger>
              <TabsTrigger value="significant" className="flex-1">Significant</TabsTrigger>
            </TabsList>
            <TabsContent value="recent" className="mt-3">
              <Card className="divide-y">
                {recentQuakes.map((quake, index) => (
                  <div 
                    key={index} 
                    className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => window.open(`https://earthquake.usgs.gov/earthquakes/map/?extent=${quake.coords}`, "_blank")}
                  >
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${getMagnitudeColor(quake.magnitude)}`}
                    >
                      <span className="text-sm font-bold text-white">
                        {quake.magnitude}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{quake.location}</p>
                      <p className="text-xs text-muted-foreground">
                        Depth: {quake.depth}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-muted-foreground whitespace-nowrap flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {quake.time}
                      </span>
                    </div>
                  </div>
                ))}
              </Card>
            </TabsContent>
            <TabsContent value="significant" className="mt-3">
              <Card className="divide-y">
                {significantQuakes.map((quake, index) => (
                  <div 
                    key={index} 
                    className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => window.open(`https://earthquake.usgs.gov/earthquakes/map/?extent=${quake.coords}`, "_blank")}
                  >
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${getMagnitudeColor(quake.magnitude)}`}
                    >
                      <span className="text-sm font-bold text-white">
                        {quake.magnitude}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{quake.location}</p>
                      <p className="text-xs text-muted-foreground">
                        Depth: {quake.depth}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-muted-foreground whitespace-nowrap flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {quake.time}
                      </span>
                    </div>
                  </div>
                ))}
              </Card>
            </TabsContent>
          </Tabs>
        </section>
      </div>
    </Layout>
  );
}
