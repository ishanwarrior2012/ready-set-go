import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Heart,
  Plane,
  Ship,
  Mountain,
  Flame,
  Radio,
  Cloud,
  Trash2,
  Search,
  ExternalLink,
  Bell,
  BellOff,
  MoreVertical,
  Star,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

interface FavoriteItem {
  id: string;
  name: string;
  details: string;
  type: string;
  notifications: boolean;
  lastUpdated?: string;
}

const initialFavorites: Record<string, FavoriteItem[]> = {
  flights: [
    { id: "AA123", name: "AA123 - LAX to JFK", details: "American Airlines • On Time", type: "flights", notifications: true, lastUpdated: "2 min ago" },
    { id: "BA456", name: "BA456 - LHR to NYC", details: "British Airways • In Flight", type: "flights", notifications: true, lastUpdated: "5 min ago" },
    { id: "DL789", name: "DL789 - ATL to MIA", details: "Delta Airlines • Scheduled", type: "flights", notifications: false },
  ],
  marine: [
    { id: "SHIP1", name: "Ever Given", details: "Container Ship • IMO 9811000 • At Sea", type: "marine", notifications: true, lastUpdated: "10 min ago" },
    { id: "SHIP2", name: "MSC Oscar", details: "Container Ship • Panama Flag", type: "marine", notifications: false },
  ],
  locations: [
    { id: "LOC1", name: "Mount Etna", details: "Volcano • Sicily, Italy • Active", type: "locations", notifications: true, lastUpdated: "1 hour ago" },
    { id: "LOC2", name: "Ring of Fire", details: "Earthquake Zone • Pacific", type: "locations", notifications: true },
    { id: "LOC3", name: "San Andreas Fault", details: "Earthquake Zone • California", type: "locations", notifications: false },
  ],
  radio: [
    { id: "RAD1", name: "BBC Radio 1", details: "London, UK • Pop", type: "radio", notifications: false },
    { id: "RAD2", name: "NPR", details: "Washington, USA • Talk/News", type: "radio", notifications: false },
    { id: "RAD3", name: "NHK World", details: "Tokyo, Japan • News", type: "radio", notifications: false },
  ],
};

const iconMap: Record<string, React.ElementType> = {
  flights: Plane,
  marine: Ship,
  locations: Mountain,
  radio: Radio,
};

const colorMap: Record<string, string> = {
  flights: "text-blue-500 bg-blue-500/10",
  marine: "text-cyan-500 bg-cyan-500/10",
  locations: "text-orange-500 bg-orange-500/10",
  radio: "text-green-500 bg-green-500/10",
};

export default function Favorites() {
  const [favorites, setFavorites] = useState(initialFavorites);
  const [searchQuery, setSearchQuery] = useState("");

  const totalFavorites = Object.values(favorites).flat().length;

  const toggleNotification = (type: string, id: string) => {
    setFavorites(prev => ({
      ...prev,
      [type]: prev[type].map(item => 
        item.id === id ? { ...item, notifications: !item.notifications } : item
      )
    }));
  };

  const removeFavorite = (type: string, id: string) => {
    setFavorites(prev => ({
      ...prev,
      [type]: prev[type].filter(item => item.id !== id)
    }));
  };

  const filterFavorites = (items: FavoriteItem[]) => {
    if (!searchQuery) return items;
    return items.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.details.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  return (
    <Layout>
      <div className="p-4 space-y-4 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-red-500/20 to-pink-500/20">
            <Heart className="h-6 w-6 text-red-500" />
          </div>
          <div className="flex-1">
            <h1 className="font-heading text-xl font-bold">Favorites</h1>
            <p className="text-sm text-muted-foreground">
              {totalFavorites} saved items
            </p>
          </div>
          <Badge variant="secondary" className="gap-1">
            <Star className="h-3 w-3" />
            {totalFavorites}
          </Badge>
        </div>

        {/* Search */}
        <Card className="flex items-center gap-2 px-3 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search favorites..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 border-0 bg-transparent p-0 focus-visible:ring-0"
          />
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="flights">
          <TabsList className="w-full">
            <TabsTrigger value="flights" className="flex-1 gap-1">
              <Plane className="h-4 w-4" />
              <span className="hidden sm:inline">Flights</span>
              <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 justify-center">
                {favorites.flights.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="marine" className="flex-1 gap-1">
              <Ship className="h-4 w-4" />
              <span className="hidden sm:inline">Marine</span>
              <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 justify-center">
                {favorites.marine.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="locations" className="flex-1 gap-1">
              <Mountain className="h-4 w-4" />
              <span className="hidden sm:inline">Places</span>
              <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 justify-center">
                {favorites.locations.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="radio" className="flex-1 gap-1">
              <Radio className="h-4 w-4" />
              <span className="hidden sm:inline">Radio</span>
              <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 justify-center">
                {favorites.radio.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          {Object.entries(favorites).map(([key, items]) => {
            const Icon = iconMap[key];
            const colorClass = colorMap[key];
            const filteredItems = filterFavorites(items);
            
            return (
              <TabsContent key={key} value={key} className="mt-4">
                {filteredItems.length > 0 ? (
                  <Card className="divide-y">
                    {filteredItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors"
                      >
                        <div className={`flex h-10 w-10 items-center justify-center rounded-full ${colorClass}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium truncate">{item.name}</p>
                            {item.notifications && (
                              <Bell className="h-3 w-3 text-primary shrink-0" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {item.details}
                          </p>
                          {item.lastUpdated && (
                            <p className="text-xs text-muted-foreground">
                              Updated {item.lastUpdated}
                            </p>
                          )}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => toggleNotification(key, item.id)}>
                              {item.notifications ? (
                                <>
                                  <BellOff className="h-4 w-4 mr-2" />
                                  Disable alerts
                                </>
                              ) : (
                                <>
                                  <Bell className="h-4 w-4 mr-2" />
                                  Enable alerts
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <ExternalLink className="h-4 w-4 mr-2" />
                              View details
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => removeFavorite(key, item.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ))}
                  </Card>
                ) : (
                  <Card className="p-8 text-center">
                    <Icon className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="font-medium mb-1">No favorites found</p>
                    <p className="text-sm text-muted-foreground">
                      {searchQuery 
                        ? "Try a different search term" 
                        : "Start adding items to your favorites"}
                    </p>
                  </Card>
                )}
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
    </Layout>
  );
}
