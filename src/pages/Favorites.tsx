import { Layout } from "@/components/layout/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Heart,
  Plane,
  Ship,
  Mountain,
  Flame,
  Radio,
  Cloud,
  Trash2,
} from "lucide-react";

const favorites = {
  flights: [
    { id: "AA123", name: "AA123 - LAX to JFK", details: "American Airlines" },
    { id: "BA456", name: "BA456 - LHR to NYC", details: "British Airways" },
  ],
  marine: [
    { id: "SHIP1", name: "Ever Given", details: "Container Ship • IMO 9811000" },
  ],
  locations: [
    { id: "LOC1", name: "Mount Etna", details: "Volcano • Sicily, Italy" },
    { id: "LOC2", name: "Ring of Fire", details: "Earthquake Zone • Pacific" },
  ],
  radio: [
    { id: "RAD1", name: "BBC Radio 1", details: "London, UK • Pop" },
    { id: "RAD2", name: "NPR", details: "Washington, USA • Talk" },
  ],
};

const iconMap = {
  flights: Plane,
  marine: Ship,
  locations: Mountain,
  radio: Radio,
};

export default function Favorites() {
  return (
    <Layout>
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Heart className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-heading text-xl font-bold">Favorites</h1>
            <p className="text-sm text-muted-foreground">
              Your saved items and locations
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="flights">
          <TabsList className="w-full">
            <TabsTrigger value="flights" className="flex-1">
              <Plane className="h-4 w-4 mr-1" />
              Flights
            </TabsTrigger>
            <TabsTrigger value="marine" className="flex-1">
              <Ship className="h-4 w-4 mr-1" />
              Marine
            </TabsTrigger>
            <TabsTrigger value="locations" className="flex-1">
              <Mountain className="h-4 w-4 mr-1" />
              Places
            </TabsTrigger>
            <TabsTrigger value="radio" className="flex-1">
              <Radio className="h-4 w-4 mr-1" />
              Radio
            </TabsTrigger>
          </TabsList>

          {Object.entries(favorites).map(([key, items]) => {
            const Icon = iconMap[key as keyof typeof iconMap];
            return (
              <TabsContent key={key} value={key} className="mt-4">
                {items.length > 0 ? (
                  <Card className="divide-y">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 p-4"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                          <Icon className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{item.name}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            {item.details}
                          </p>
                        </div>
                        <Button size="icon" variant="ghost">
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
                    ))}
                  </Card>
                ) : (
                  <Card className="p-8 text-center">
                    <Icon className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">
                      No favorites saved yet
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
