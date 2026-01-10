import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  ExternalLink, 
  Search, 
  Orbit,
  Users,
  Clock,
  MapPin,
  Rocket
} from "lucide-react";

// Sample ISS crew data
const currentCrew = [
  { name: "Oleg Kononenko", role: "Commander", nationality: "Russia" },
  { name: "Nikolai Chub", role: "Flight Engineer", nationality: "Russia" },
  { name: "Tracy Dyson", role: "Flight Engineer", nationality: "USA" },
  { name: "Matthew Dominick", role: "Flight Engineer", nationality: "USA" },
  { name: "Michael Barratt", role: "Flight Engineer", nationality: "USA" },
  { name: "Jeanette Epps", role: "Flight Engineer", nationality: "USA" },
];

// Key ISS facts
const issStats = [
  { label: "Orbital Speed", value: "28,000 km/h", icon: Rocket },
  { label: "Altitude", value: "~408 km", icon: MapPin },
  { label: "Orbits/Day", value: "15.5", icon: Orbit },
  { label: "Crew Size", value: "6-7", icon: Users },
];

export default function ISS() {
  const [searchQuery, setSearchQuery] = useState("");

  const openFullScreen = () => {
    window.open("https://spotthestation.nasa.gov/tracking_map.cfm", "_blank", "noopener,noreferrer");
  };

  const openNASALive = () => {
    window.open("https://www.nasa.gov/live", "_blank", "noopener,noreferrer");
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 space-y-6 pb-24">
        {/* Header */}
        <section className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Orbit className="h-8 w-8 text-electric" />
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              ISS Tracker
            </h1>
          </div>
          <p className="text-muted-foreground text-sm sm:text-base">
            Track the International Space Station in real-time as it orbits Earth
          </p>
        </section>

        {/* Embedded ISS Tracker Map */}
        <section className="w-full">
          <div className="relative w-full h-[400px] sm:h-[500px] bg-muted rounded-lg overflow-hidden">
            <iframe
              src="https://isstracker.pl/en"
              className="w-full h-full border-0"
              title="ISS Live Tracker"
              allow="geolocation"
            />
          </div>
        </section>

        {/* NASA Live Stream */}
        <section className="w-full space-y-3">
          <div className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-electric" />
            <h2 className="text-lg font-semibold">NASA Live Stream</h2>
          </div>
          <div className="relative w-full aspect-video bg-muted rounded-lg overflow-hidden">
            <iframe
              src="https://www.youtube.com/embed/fO9e9jnhYK8"
              className="w-full h-full border-0"
              title="NASA Live Stream"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </section>

        {/* Quick Actions */}
        <section className="flex flex-wrap gap-2 justify-center">
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={() => window.open("https://www.youtube.com/watch?v=fO9e9jnhYK8", "_blank")}
          >
            <Rocket className="h-4 w-4" />
            Open on YouTube
          </Button>
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={() => window.open("https://spotthestation.nasa.gov/", "_blank")}
          >
            <Clock className="h-4 w-4" />
            Spot the Station
          </Button>
        </section>

        {/* ISS Stats */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {issStats.map((stat) => (
            <Card key={stat.label} className="p-4 text-center">
              <stat.icon className="h-6 w-6 mx-auto mb-2 text-electric" />
              <p className="text-lg font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </Card>
          ))}
        </section>

        {/* Current Crew */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-electric" />
            <h2 className="text-lg font-semibold">Current Crew</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {currentCrew.map((member) => (
              <Card key={member.name} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">{member.name}</p>
                    <p className="text-sm text-muted-foreground">{member.role}</p>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {member.nationality}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Info Section */}
        <section className="space-y-3">
          <Card className="p-4 bg-muted/30">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Orbit className="h-4 w-4 text-electric" />
              About the ISS
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The International Space Station is the largest modular space station in low Earth orbit. 
              It serves as a microgravity and space environment research laboratory where scientific 
              research is conducted in astrobiology, astronomy, meteorology, physics, and other fields.
              The ISS orbits Earth approximately every 90 minutes, traveling at about 28,000 km/h.
            </p>
          </Card>
        </section>
      </div>
    </Layout>
  );
}
