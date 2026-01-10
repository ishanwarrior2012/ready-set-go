import { Layout } from "@/components/layout/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Flame, 
  Filter, 
  Info, 
  ExternalLink, 
  MapPin,
  Activity,
  AlertTriangle,
  Clock
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const volcanoes = [
  { name: "Mount Etna", location: "Sicily, Italy", status: "active", alert: "orange", lastActivity: "Ongoing" },
  { name: "Kilauea", location: "Hawaii, USA", status: "active", alert: "yellow", lastActivity: "2 days ago" },
  { name: "Mount Fuji", location: "Honshu, Japan", status: "dormant", alert: "green", lastActivity: "1707" },
  { name: "Stromboli", location: "Italy", status: "active", alert: "orange", lastActivity: "Ongoing" },
  { name: "Popocatépetl", location: "Mexico", status: "active", alert: "yellow", lastActivity: "1 week ago" },
  { name: "Sakurajima", location: "Japan", status: "active", alert: "orange", lastActivity: "3 hours ago" },
];

const recentEruptions = [
  { name: "Fagradalsfjall", location: "Iceland", date: "2024", type: "Effusive" },
  { name: "Mauna Loa", location: "Hawaii, USA", date: "2022", type: "Effusive" },
  { name: "Hunga Tonga", location: "Tonga", date: "2022", type: "Explosive" },
];

function getAlertColor(alert: string) {
  switch (alert) {
    case "red":
      return "bg-red-500 text-white";
    case "orange":
      return "bg-orange-500 text-white";
    case "yellow":
      return "bg-yellow-500 text-black";
    default:
      return "bg-green-500 text-white";
  }
}

function getAlertBadge(alert: string) {
  switch (alert) {
    case "red":
      return <Badge className="bg-red-500 text-white">Warning</Badge>;
    case "orange":
      return <Badge className="bg-orange-500 text-white">Watch</Badge>;
    case "yellow":
      return <Badge className="bg-yellow-500 text-black">Advisory</Badge>;
    default:
      return <Badge className="bg-green-500 text-white">Normal</Badge>;
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case "active":
      return <Badge variant="destructive">Active</Badge>;
    case "dormant":
      return <Badge variant="secondary">Dormant</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export default function Volcanoes() {
  const [searchQuery, setSearchQuery] = useState("");

  const openVolcanoMap = () => {
    window.open("https://volcano.si.edu/gvp_votw.cfm", "_blank", "noopener,noreferrer");
  };

  const searchVolcano = () => {
    if (searchQuery.trim()) {
      window.open(
        `https://volcano.si.edu/search_volcano.cfm?search=${encodeURIComponent(searchQuery)}`,
        "_blank",
        "noopener,noreferrer"
      );
    }
  };

  const activeVolcanoes = volcanoes.filter(v => v.status === "active");
  const watchVolcanoes = volcanoes.filter(v => v.alert === "orange" || v.alert === "red");

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <section className="px-4 pt-4">
          <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
            <Flame className="h-6 w-6 text-orange-500" />
            Volcanic Activity
          </h1>
          <p className="text-muted-foreground">
            Monitor volcanoes and eruptions worldwide
          </p>
        </section>

        {/* Embedded Volcano Map */}
        <section className="w-full">
          <div className="relative w-full h-[400px] sm:h-[500px] bg-muted rounded-lg overflow-hidden">
            <iframe
              src="https://volcano.si.edu/E3/active_volcanoes_map.cfm"
              className="w-full h-full border-0"
              title="Smithsonian Volcano Map"
            />
            <Button 
              onClick={openVolcanoMap}
              className="absolute top-3 right-3 gap-2 bg-orange-500 hover:bg-orange-600 shadow-lg"
              size="sm"
            >
              <ExternalLink className="h-4 w-4" />
              Open Full Screen
            </Button>

            {/* Legend Overlay */}
            <Card className="absolute bottom-3 left-3 p-3 bg-background/95 backdrop-blur">
              <p className="text-xs font-medium mb-2">Alert Level</p>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="flex items-center gap-1">
                  <div className="h-3 w-3 rounded-full bg-green-500" /> Normal
                </span>
                <span className="flex items-center gap-1">
                  <div className="h-3 w-3 rounded-full bg-yellow-500" /> Advisory
                </span>
                <span className="flex items-center gap-1">
                  <div className="h-3 w-3 rounded-full bg-orange-500" /> Watch
                </span>
                <span className="flex items-center gap-1">
                  <div className="h-3 w-3 rounded-full bg-red-500" /> Warning
                </span>
              </div>
            </Card>
          </div>
        </section>

        {/* Search */}
        <section className="px-4">
          <h2 className="font-heading text-lg font-semibold mb-3 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Search Volcano
          </h2>
          <Card className="p-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter volcano name (e.g., Etna, Kilauea)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchVolcano()}
                className="flex-1"
              />
              <Button onClick={searchVolcano} disabled={!searchQuery.trim()}>
                Search
              </Button>
            </div>
          </Card>
        </section>

        {/* Stats */}
        <section className="px-4">
          <div className="grid grid-cols-3 gap-3">
            <Card className="p-3 text-center">
              <Flame className="h-5 w-5 mx-auto mb-1 text-red-500" />
              <p className="text-2xl font-bold">{activeVolcanoes.length}</p>
              <p className="text-xs text-muted-foreground">Active</p>
            </Card>
            <Card className="p-3 text-center">
              <AlertTriangle className="h-5 w-5 mx-auto mb-1 text-orange-500" />
              <p className="text-2xl font-bold">{watchVolcanoes.length}</p>
              <p className="text-xs text-muted-foreground">On Watch</p>
            </Card>
            <Card className="p-3 text-center">
              <Activity className="h-5 w-5 mx-auto mb-1 text-amber-500" />
              <p className="text-2xl font-bold">{recentEruptions.length}</p>
              <p className="text-xs text-muted-foreground">Recent</p>
            </Card>
          </div>
        </section>

        {/* Volcano List */}
        <section className="px-4 pb-4">
          <Tabs defaultValue="monitored">
            <TabsList className="w-full">
              <TabsTrigger value="monitored" className="flex-1">Monitored</TabsTrigger>
              <TabsTrigger value="eruptions" className="flex-1">Recent Eruptions</TabsTrigger>
            </TabsList>
            <TabsContent value="monitored" className="mt-3">
              <Card className="divide-y">
                {volcanoes.map((volcano, index) => (
                  <div 
                    key={index} 
                    className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => window.open(`https://volcano.si.edu/search_volcano.cfm?search=${encodeURIComponent(volcano.name)}`, "_blank")}
                  >
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${getAlertColor(volcano.alert)}`}
                    >
                      <Flame className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{volcano.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {volcano.location}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {getAlertBadge(volcano.alert)}
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {volcano.lastActivity}
                      </span>
                    </div>
                  </div>
                ))}
              </Card>
            </TabsContent>
            <TabsContent value="eruptions" className="mt-3">
              <Card className="divide-y">
                {recentEruptions.map((eruption, index) => (
                  <div 
                    key={index} 
                    className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => window.open(`https://volcano.si.edu/search_volcano.cfm?search=${encodeURIComponent(eruption.name)}`, "_blank")}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
                      <Flame className="h-5 w-5 text-red-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{eruption.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {eruption.location}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline">{eruption.type}</Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {eruption.date}
                      </p>
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
