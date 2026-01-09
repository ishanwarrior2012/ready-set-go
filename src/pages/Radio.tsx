import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Radio as RadioIcon, Globe, Heart, Search, Play, Pause, Volume2 } from "lucide-react";
import { Input } from "@/components/ui/input";

const featuredStations = [
  { name: "BBC Radio 1", location: "London, UK", genre: "Pop", playing: "Now Playing: Top Hits" },
  { name: "NPR", location: "Washington, USA", genre: "Talk", playing: "Morning Edition" },
  { name: "NHK Radio", location: "Tokyo, Japan", genre: "News", playing: "World News" },
  { name: "Radio France", location: "Paris, France", genre: "Classical", playing: "Evening Concert" },
];

export default function RadioPage() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStation] = useState(featuredStations[0]);

  return (
    <Layout>
      <div className="flex flex-col h-[calc(100vh-8rem)]">
        {/* Globe Placeholder */}
        <div className="flex-1 relative bg-muted">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <Globe className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="font-heading text-xl font-semibold mb-2">
                Global Radio
              </h2>
              <p className="text-muted-foreground">
                Interactive globe will be displayed here
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="absolute top-4 left-4 right-4">
            <Card className="flex items-center gap-2 px-3 py-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search stations, genres, countries..."
                className="flex-1 border-0 bg-transparent p-0 focus-visible:ring-0"
              />
            </Card>
          </div>
        </div>

        {/* Mini Player */}
        <Card className="mx-4 -mt-4 relative z-10">
          <div className="flex items-center gap-3 p-3">
            <Button
              size="icon"
              variant={isPlaying ? "default" : "secondary"}
              className="shrink-0"
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{currentStation.name}</p>
              <p className="text-xs text-muted-foreground truncate">
                {currentStation.playing}
              </p>
            </div>
            <Button size="icon" variant="ghost">
              <Heart className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost">
              <Volume2 className="h-4 w-4" />
            </Button>
          </div>
        </Card>

        {/* Station List */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading text-lg font-semibold">
              Featured Stations
            </h2>
            <Button variant="ghost" size="sm">
              View All
            </Button>
          </div>
          <Card className="divide-y">
            {featuredStations.map((station, index) => (
              <div key={index} className="flex items-center gap-3 p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <RadioIcon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{station.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {station.location} • {station.genre}
                  </p>
                </div>
                <Button size="icon" variant="ghost">
                  <Play className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </Layout>
  );
}
