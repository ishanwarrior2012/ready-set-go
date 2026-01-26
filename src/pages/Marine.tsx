import { Layout } from "@/components/layout/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Ship, 
  Filter, 
  Anchor, 
  Search, 
  ExternalLink,
  MapPin,
  Clock,
  Navigation,
  Waves
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

const popularPorts = [
  { code: "USLAX", name: "Los Angeles", country: "USA" },
  { code: "SGSIN", name: "Singapore", country: "Singapore" },
  { code: "CNSHA", name: "Shanghai", country: "China" },
  { code: "NLRTM", name: "Rotterdam", country: "Netherlands" },
  { code: "AEDXB", name: "Dubai", country: "UAE" },
  { code: "HKHKG", name: "Hong Kong", country: "China" },
];

const recentVessels = [
  { name: "MSC Oscar", type: "Container Ship", flag: "🇵🇦", status: "Underway", speed: "18.5 kn" },
  { name: "Ever Given", type: "Container Ship", flag: "🇵🇦", status: "At Anchor", speed: "0 kn" },
  { name: "Carnival Vista", type: "Cruise Ship", flag: "🇮🇹", status: "Underway", speed: "21.2 kn" },
  { name: "Seawise Giant", type: "Tanker", flag: "🇳🇴", status: "Moored", speed: "0 kn" },
];

function getStatusColor(status: string) {
  switch (status) {
    case "Underway":
      return "bg-green-500 text-white";
    case "At Anchor":
      return "bg-amber-500 text-white";
    case "Moored":
      return "bg-blue-500 text-white";
    default:
      return "bg-gray-500 text-white";
  }
}

function getVesselIcon(type: string) {
  switch (type) {
    case "Container Ship":
      return "🚢";
    case "Cruise Ship":
      return "🛳️";
    case "Tanker":
      return "⛽";
    default:
      return "🚢";
  }
}

export default function Marine() {
  const [searchQuery, setSearchQuery] = useState("");

  const openMarineTraffic = () => {
    window.open("https://www.marinetraffic.com/en/ais/home/centerx:-12.0/centery:25.0/zoom:2", "_blank", "noopener,noreferrer");
  };

  const searchVessel = () => {
    if (searchQuery.trim()) {
      window.open(
        `https://www.marinetraffic.com/en/ais/index/search/all/keyword:${encodeURIComponent(searchQuery)}`,
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
            <Ship className="h-6 w-6 text-blue-500" />
            Marine Traffic
          </h1>
          <p className="text-muted-foreground">
            Track vessels and ships worldwide
          </p>
        </section>

        {/* Embedded MarineTraffic Map */}
        <section className="w-full">
          <div className="relative w-full h-[400px] sm:h-[500px] bg-muted rounded-lg overflow-hidden">
            <iframe
              src="https://www.marinetraffic.com/en/ais/embed/zoom:2/centery:25/centerx:-12/maptype:4/shownames:false/mmsi:0/shipid:0/fleet:/fleet_id:/vtypes:/showmenu:/remember:false"
              className="w-full h-full border-0"
              title="MarineTraffic Live Map"
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
            />
            <Button 
              onClick={openMarineTraffic}
              className="absolute top-3 right-3 gap-2 bg-blue-500 hover:bg-blue-600 shadow-lg"
              size="sm"
            >
              <ExternalLink className="h-4 w-4" />
              Open Full Screen
            </Button>
          </div>
        </section>

        {/* Search */}
        <section className="px-4">
          <h2 className="font-heading text-lg font-semibold mb-3 flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            Search Vessel
          </h2>
          <Card className="p-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter vessel name or MMSI"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchVessel()}
                className="flex-1"
              />
              <Button onClick={searchVessel} disabled={!searchQuery.trim()}>
                Track
              </Button>
            </div>
          </Card>
        </section>

        {/* Stats */}
        <section className="px-4">
          <div className="grid grid-cols-3 gap-3">
            <Card className="p-3 text-center">
              <Ship className="h-5 w-5 mx-auto mb-1 text-blue-500" />
              <p className="text-2xl font-bold">8,432</p>
              <p className="text-xs text-muted-foreground">Active</p>
            </Card>
            <Card className="p-3 text-center">
              <Anchor className="h-5 w-5 mx-auto mb-1 text-amber-500" />
              <p className="text-2xl font-bold">2,156</p>
              <p className="text-xs text-muted-foreground">At Port</p>
            </Card>
            <Card className="p-3 text-center">
              <Waves className="h-5 w-5 mx-auto mb-1 text-green-500" />
              <p className="text-2xl font-bold">6,276</p>
              <p className="text-xs text-muted-foreground">Underway</p>
            </Card>
          </div>
        </section>

        {/* Popular Ports */}
        <section className="px-4">
          <h2 className="font-heading text-lg font-semibold mb-3 flex items-center gap-2">
            <Anchor className="h-5 w-5 text-primary" />
            Major Ports
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {popularPorts.map((port) => (
              <Card
                key={port.code}
                className="p-4 cursor-pointer hover:bg-accent/50 transition-colors group"
                onClick={() => window.open(`https://www.marinetraffic.com/en/ais/details/ports/${port.code}`, "_blank", "noopener,noreferrer")}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold">{port.name}</p>
                    <p className="text-xs text-muted-foreground">{port.country}</p>
                  </div>
                  <Navigation className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Recent Vessels */}
        <section className="px-4 pb-4">
          <h2 className="font-heading text-lg font-semibold mb-3 flex items-center gap-2">
            <Ship className="h-5 w-5 text-primary" />
            Sample Vessels
          </h2>
          <Card className="divide-y">
            {recentVessels.map((vessel, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => window.open(`https://www.marinetraffic.com/en/ais/index/search/all/keyword:${encodeURIComponent(vessel.name)}`, "_blank", "noopener,noreferrer")}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                    <span className="text-xl">{getVesselIcon(vessel.type)}</span>
                  </div>
                  <div>
                    <p className="font-medium">{vessel.name} {vessel.flag}</p>
                    <p className="text-sm text-muted-foreground">{vessel.type}</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge className={getStatusColor(vessel.status)}>
                    {vessel.status}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">
                    {vessel.speed}
                  </p>
                </div>
              </div>
            ))}
          </Card>
        </section>
      </div>
    </Layout>
  );
}
