import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Orbit,
  Users,
  Clock,
  MapPin,
  Rocket,
  RefreshCw,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchWithTimeout } from "@/lib/fetchWithTimeout";

interface ISSCrewMember {
  name: string;
  craft: string;
}

async function fetchISSCrew(): Promise<ISSCrewMember[]> {
  const res = await fetchWithTimeout("http://api.open-notify.org/astros.json", { timeoutMs: 10000 });
  if (!res.ok) throw new Error("Failed to fetch ISS crew");
  const data = await res.json();
  return (data.people || []).filter((p: ISSCrewMember) => p.craft === "ISS");
}

interface ISSPosition {
  latitude: string;
  longitude: string;
  timestamp: number;
}

async function fetchISSPosition(): Promise<ISSPosition> {
  const res = await fetchWithTimeout("http://api.open-notify.org/iss-now.json", { timeoutMs: 10000 });
  if (!res.ok) throw new Error("Failed to fetch ISS position");
  const data = await res.json();
  return {
    latitude: data.iss_position.latitude,
    longitude: data.iss_position.longitude,
    timestamp: data.timestamp,
  };
}

const issStats = [
  { label: "Orbital Speed", value: "28,000 km/h", icon: Rocket },
  { label: "Altitude", value: "~408 km", icon: MapPin },
  { label: "Orbits/Day", value: "15.5", icon: Orbit },
];

export default function ISS() {
  const {
    data: crew,
    isLoading: crewLoading,
    refetch: refetchCrew,
  } = useQuery({
    queryKey: ["iss-crew"],
    queryFn: fetchISSCrew,
    refetchInterval: 300000,
    staleTime: 120000,
  });

  const {
    data: position,
    isLoading: posLoading,
  } = useQuery({
    queryKey: ["iss-position"],
    queryFn: fetchISSPosition,
    refetchInterval: 10000,
    staleTime: 5000,
  });

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 space-y-6 pb-24">
        {/* Header */}
        <section className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Orbit className="h-8 w-8 text-primary" />
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              ISS Tracker
            </h1>
          </div>
          <p className="text-muted-foreground text-sm sm:text-base">
            Track the International Space Station in real-time
          </p>
        </section>

        {/* NASA Live Stream */}
        <section className="w-full space-y-3">
          <div className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">NASA Live Stream</h2>
          </div>
          <div className="relative w-full aspect-video bg-muted rounded-lg overflow-hidden">
            <iframe
              src="https://www.youtube.com/embed/fO9e9jnhYK8"
              className="w-full h-full border-0"
              title="NASA Live Stream"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              sandbox="allow-scripts allow-same-origin allow-popups allow-presentation"
            />
          </div>
        </section>

        {/* Live Position */}
        <section>
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Live Position</h2>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
                Live
              </div>
            </div>
            {posLoading ? (
              <div className="flex gap-4">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-6 w-32" />
              </div>
            ) : position ? (
              <div className="flex flex-wrap gap-4 text-sm">
                <span className="text-muted-foreground">
                  Lat: <span className="text-foreground font-mono">{parseFloat(position.latitude).toFixed(4)}°</span>
                </span>
                <span className="text-muted-foreground">
                  Lon: <span className="text-foreground font-mono">{parseFloat(position.longitude).toFixed(4)}°</span>
                </span>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Position unavailable</p>
            )}
          </Card>
        </section>

        {/* Quick Actions */}
        <section className="flex flex-wrap gap-2 justify-center">
          <Button
            variant="outline"
            className="gap-2 tv-focus"
            onClick={() => window.open("https://spotthestation.nasa.gov/", "_blank", "noopener,noreferrer")}
          >
            <Clock className="h-4 w-4" />
            Spot the Station
          </Button>
        </section>

        {/* ISS Stats */}
        <section className="grid grid-cols-3 gap-3">
          {issStats.map((stat) => (
            <Card key={stat.label} className="p-4 text-center">
              <stat.icon className="h-6 w-6 mx-auto mb-2 text-primary" />
              <p className="text-lg font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </Card>
          ))}
        </section>

        {/* Current Crew - LIVE */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Current Crew</h2>
              {crew && (
                <Badge variant="secondary" className="text-xs">
                  {crew.length} aboard
                </Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => refetchCrew()}
              className="tv-focus"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          {crewLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="p-4">
                  <Skeleton className="h-5 w-32 mb-2" />
                  <Skeleton className="h-4 w-20" />
                </Card>
              ))}
            </div>
          ) : crew && crew.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {crew.map((member) => (
                <Card key={member.name} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">{member.name}</p>
                      <p className="text-sm text-muted-foreground">{member.craft}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      <span className="h-1.5 w-1.5 rounded-full bg-success mr-1.5" />
                      In Space
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-6 text-center text-muted-foreground">
              <p>Unable to fetch crew data. Try refreshing.</p>
            </Card>
          )}
        </section>

        {/* About */}
        <section>
          <Card className="p-4 bg-muted/30">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Orbit className="h-4 w-4 text-primary" />
              About the ISS
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The International Space Station is the largest modular space station in low Earth orbit.
              It serves as a microgravity and space environment research laboratory. The ISS orbits
              Earth approximately every 90 minutes, traveling at about 28,000 km/h at an altitude of ~408 km.
            </p>
          </Card>
        </section>
      </div>
    </Layout>
  );
}
