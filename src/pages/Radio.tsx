import { useState, useRef, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Radio as RadioIcon, 
  Globe, 
  Heart, 
  Search, 
  Play, 
  Pause, 
  Volume2,
  VolumeX,
  ExternalLink,
  Music,
  Mic,
  Headphones,
  MapPin,
  Loader2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { logger } from "@/lib/logger";

interface RadioStation {
  name: string;
  location: string;
  genre: string;
  playing: string;
  country: string;
  streamUrl: string;
}

const featuredStations: RadioStation[] = [
  { 
    name: "BBC Radio 1", 
    location: "London, UK", 
    genre: "Pop", 
    playing: "Live Radio", 
    country: "🇬🇧",
    streamUrl: "https://stream.live.vc.bbcmedia.co.uk/bbc_radio_one"
  },
  { 
    name: "NPR News", 
    location: "Washington, USA", 
    genre: "News", 
    playing: "Live News", 
    country: "🇺🇸",
    streamUrl: "https://npr-ice.streamguys1.com/live.mp3"
  },
  { 
    name: "Classic FM", 
    location: "London, UK", 
    genre: "Classical", 
    playing: "Classical Music", 
    country: "🇬🇧",
    streamUrl: "https://media-ice.musicradio.com/ClassicFMMP3"
  },
  { 
    name: "KEXP 90.3", 
    location: "Seattle, USA", 
    genre: "Indie", 
    playing: "Alternative Music", 
    country: "🇺🇸",
    streamUrl: "https://kexp-mp3-128.streamguys1.com/kexp128.mp3"
  },
  { 
    name: "FIP Radio", 
    location: "Paris, France", 
    genre: "Eclectic", 
    playing: "World Music", 
    country: "🇫🇷",
    streamUrl: "https://icecast.radiofrance.fr/fip-midfi.mp3"
  },
  { 
    name: "SomaFM Groove Salad", 
    location: "San Francisco, USA", 
    genre: "Ambient", 
    playing: "Chill Beats", 
    country: "🇺🇸",
    streamUrl: "https://ice4.somafm.com/groovesalad-256-mp3"
  },
];

const genres = [
  { id: "pop", label: "Pop", icon: Music, count: 245 },
  { id: "rock", label: "Rock", icon: Headphones, count: 189 },
  { id: "jazz", label: "Jazz", icon: Music, count: 156 },
  { id: "classical", label: "Classical", icon: Music, count: 98 },
  { id: "news", label: "News", icon: Mic, count: 324 },
  { id: "talk", label: "Talk", icon: Mic, count: 276 },
];

export default function RadioPage() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStation, setCurrentStation] = useState<RadioStation | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState([75]);
  const [searchQuery, setSearchQuery] = useState("");
  const [favorites, setFavorites] = useState<string[]>(["BBC Radio 1", "NPR News"]);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume[0] / 100;
    }
  }, [volume]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const openRadioGarden = () => {
    window.open("https://radio.garden/", "_blank", "noopener,noreferrer");
  };

  const toggleFavorite = (stationName: string) => {
    setFavorites(prev => 
      prev.includes(stationName) 
        ? prev.filter(n => n !== stationName)
        : [...prev, stationName]
    );
  };

  const playStation = async (station: RadioStation) => {
    if (currentStation?.name === station.name && isPlaying) {
      // Pause current station
      audioRef.current?.pause();
      setIsPlaying(false);
      return;
    }

    setCurrentStation(station);
    setIsLoading(true);

    if (audioRef.current) {
      audioRef.current.src = station.streamUrl;
      try {
        await audioRef.current.play();
        setIsPlaying(true);
        toast.success(`Now playing: ${station.name}`);
      } catch (error) {
        logger.error("Error playing stream:", error);
        toast.error("Could not play this station. Try another one.");
        setIsPlaying(false);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const togglePlayPause = async () => {
    if (!currentStation) {
      playStation(featuredStations[0]);
      return;
    }

    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      try {
        await audioRef.current?.play();
        setIsPlaying(true);
      } catch (error) {
        toast.error("Could not resume playback");
      }
    }
  };

  return (
    <Layout>
      {/* Hidden Audio Element */}
      <audio ref={audioRef} preload="none" />
      
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <section className="px-4 pt-4">
          <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
            <Globe className="h-6 w-6 text-green-500" />
            Global Radio
          </h1>
          <p className="text-muted-foreground">
            Listen to radio stations from around the world
          </p>
        </section>

        {/* Embedded Radio Garden Globe */}
        <section className="w-full">
          <div className="relative w-full h-[350px] sm:h-[450px] bg-muted rounded-lg overflow-hidden">
            <iframe
              src="https://radio.garden/"
              className="w-full h-full border-0"
              title="Radio Garden"
              allow="autoplay"
              sandbox="allow-scripts allow-same-origin allow-popups"
            />
            <Button 
              onClick={openRadioGarden}
              className="absolute top-3 right-3 gap-2 bg-green-500 hover:bg-green-600 shadow-lg"
              size="sm"
            >
              <ExternalLink className="h-4 w-4" />
              Explore Globe
            </Button>
          </div>
        </section>

        {/* Mini Player */}
        <section className="px-4">
          <Card className="p-4 bg-gradient-to-r from-green-500/10 to-blue-500/10">
            <div className="flex items-center gap-4">
              <Button
                size="lg"
                variant={isPlaying ? "default" : "secondary"}
                className="shrink-0 h-14 w-14 rounded-full"
                onClick={togglePlayPause}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : isPlaying ? (
                  <Pause className="h-6 w-6" />
                ) : (
                  <Play className="h-6 w-6 ml-1" />
                )}
              </Button>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-lg truncate">
                  {currentStation ? `${currentStation.name} ${currentStation.country}` : "Select a station"}
                </p>
                <p className="text-sm text-muted-foreground truncate">
                  {currentStation?.playing || "Choose from featured stations below"}
                </p>
                {currentStation && (
                  <Badge variant="secondary" className="mt-1">{currentStation.genre}</Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                {currentStation && (
                  <Button 
                    size="icon" 
                    variant="ghost"
                    onClick={() => toggleFavorite(currentStation.name)}
                  >
                    <Heart className={`h-5 w-5 ${favorites.includes(currentStation.name) ? "fill-red-500 text-red-500" : ""}`} />
                  </Button>
                )}
                <Button 
                  size="icon" 
                  variant="ghost"
                  onClick={() => setIsMuted(!isMuted)}
                >
                  {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-4">
              <Volume2 className="h-4 w-4 text-muted-foreground" />
              <Slider 
                value={volume} 
                onValueChange={setVolume}
                max={100}
                step={1}
                className="flex-1"
              />
              <span className="text-sm text-muted-foreground w-8">{volume[0]}%</span>
            </div>
          </Card>
        </section>

        {/* Search */}
        <section className="px-4">
          <Card className="flex items-center gap-2 px-3 py-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search stations, genres, countries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 border-0 bg-transparent p-0 focus-visible:ring-0"
            />
          </Card>
        </section>

        {/* Content Tabs */}
        <section className="px-4 pb-4">
          <Tabs defaultValue="featured">
            <TabsList className="w-full">
              <TabsTrigger value="featured" className="flex-1">Featured</TabsTrigger>
              <TabsTrigger value="genres" className="flex-1">Genres</TabsTrigger>
              <TabsTrigger value="favorites" className="flex-1">Favorites</TabsTrigger>
            </TabsList>

            <TabsContent value="featured" className="mt-4 space-y-4">
              <Card className="divide-y">
                {featuredStations.map((station, index) => (
                  <div 
                    key={index} 
                    className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => playStation(station)}
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-green-500/20 to-blue-500/20">
                      <span className="text-2xl">{station.country}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{station.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {station.location} • {station.genre}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        size="icon" 
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(station.name);
                        }}
                      >
                        <Heart className={`h-4 w-4 ${favorites.includes(station.name) ? "fill-red-500 text-red-500" : ""}`} />
                      </Button>
                      <Button 
                        size="icon" 
                        variant={currentStation?.name === station.name && isPlaying ? "default" : "ghost"}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (currentStation?.name === station.name) {
                            setIsPlaying(!isPlaying);
                          } else {
                            playStation(station);
                          }
                        }}
                      >
                        {currentStation?.name === station.name && isPlaying ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </Card>
            </TabsContent>

            <TabsContent value="genres" className="mt-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {genres.map((genre) => (
                  <Card
                    key={genre.id}
                    className="p-4 cursor-pointer hover:bg-accent/50 transition-colors text-center"
                  >
                    <genre.icon className="h-8 w-8 mx-auto mb-2 text-green-500" />
                    <p className="font-semibold">{genre.label}</p>
                    <p className="text-xs text-muted-foreground">{genre.count} stations</p>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="favorites" className="mt-4">
              {favorites.length > 0 ? (
                <Card className="divide-y">
                  {featuredStations.filter(s => favorites.includes(s.name)).map((station, index) => (
                    <div 
                      key={index} 
                      className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => playStation(station)}
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10">
                        <Heart className="h-5 w-5 text-red-500 fill-red-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{station.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {station.location}
                        </p>
                      </div>
                      <Button size="icon" variant="ghost">
                        <Play className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </Card>
              ) : (
                <Card className="p-8 text-center">
                  <Heart className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No favorite stations yet</p>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </section>
      </div>
    </Layout>
  );
}
