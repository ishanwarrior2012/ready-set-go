import { Layout } from "@/components/layout/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Cloud, Layers, MapPin, Thermometer, Wind, Droplets } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const weatherLayers = [
  { id: "temp", label: "Temperature", icon: Thermometer },
  { id: "wind", label: "Wind", icon: Wind },
  { id: "precip", label: "Precipitation", icon: Droplets },
  { id: "clouds", label: "Clouds", icon: Cloud },
];

export default function Weather() {
  return (
    <Layout>
      <div className="flex flex-col h-[calc(100vh-8rem)]">
        {/* Map Placeholder */}
        <div className="flex-1 relative bg-muted">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <Cloud className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="font-heading text-xl font-semibold mb-2">
                Weather Maps
              </h2>
              <p className="text-muted-foreground">
                Interactive weather map will be displayed here
              </p>
            </div>
          </div>

          {/* Map Controls */}
          <div className="absolute top-4 right-4 flex flex-col gap-2">
            <Button size="icon" variant="secondary" className="shadow-lg">
              <Layers className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="secondary" className="shadow-lg">
              <MapPin className="h-4 w-4" />
            </Button>
          </div>

          {/* Layer Selector */}
          <div className="absolute bottom-4 left-4 right-4">
            <Card className="p-2">
              <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar">
                {weatherLayers.map((layer) => (
                  <Button
                    key={layer.id}
                    variant={layer.id === "temp" ? "default" : "outline"}
                    size="sm"
                    className="shrink-0"
                  >
                    <layer.icon className="h-4 w-4 mr-1" />
                    {layer.label}
                  </Button>
                ))}
              </div>
            </Card>
          </div>
        </div>

        {/* Weather Info */}
        <div className="p-4">
          <Tabs defaultValue="current">
            <TabsList className="w-full">
              <TabsTrigger value="current" className="flex-1">Current</TabsTrigger>
              <TabsTrigger value="forecast" className="flex-1">Forecast</TabsTrigger>
              <TabsTrigger value="alerts" className="flex-1">Alerts</TabsTrigger>
            </TabsList>
            <TabsContent value="current" className="mt-3">
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      Current Location
                    </p>
                    <p className="text-4xl font-bold">24°C</p>
                    <p className="text-muted-foreground">Partly Cloudy</p>
                  </div>
                  <Cloud className="h-16 w-16 text-muted-foreground" />
                </div>
                <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
                  <div className="text-center">
                    <Wind className="h-5 w-5 mx-auto text-muted-foreground" />
                    <p className="font-medium mt-1">12 km/h</p>
                    <p className="text-xs text-muted-foreground">Wind</p>
                  </div>
                  <div className="text-center">
                    <Droplets className="h-5 w-5 mx-auto text-muted-foreground" />
                    <p className="font-medium mt-1">65%</p>
                    <p className="text-xs text-muted-foreground">Humidity</p>
                  </div>
                  <div className="text-center">
                    <Thermometer className="h-5 w-5 mx-auto text-muted-foreground" />
                    <p className="font-medium mt-1">26°C</p>
                    <p className="text-xs text-muted-foreground">Feels like</p>
                  </div>
                </div>
              </Card>
            </TabsContent>
            <TabsContent value="forecast" className="mt-3">
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">Forecast data will be displayed here</p>
              </Card>
            </TabsContent>
            <TabsContent value="alerts" className="mt-3">
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No active weather alerts</p>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
}
