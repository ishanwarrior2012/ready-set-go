import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Cloud, 
  Layers, 
  MapPin, 
  Thermometer, 
  Wind, 
  Droplets,
  ExternalLink,
  Sun,
  CloudRain,
  Snowflake,
  Eye,
  Gauge,
  Sunrise,
  Sunset,
  AlertTriangle
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

const weatherLayers = [
  { id: "temp", label: "Temperature", icon: Thermometer, active: true },
  { id: "wind", label: "Wind", icon: Wind, active: false },
  { id: "precip", label: "Precipitation", icon: Droplets, active: false },
  { id: "clouds", label: "Clouds", icon: Cloud, active: false },
];

const forecast = [
  { day: "Today", high: 24, low: 18, icon: Sun, condition: "Sunny" },
  { day: "Tue", high: 22, low: 16, icon: Cloud, condition: "Cloudy" },
  { day: "Wed", high: 20, low: 15, icon: CloudRain, condition: "Rain" },
  { day: "Thu", high: 19, low: 14, icon: CloudRain, condition: "Showers" },
  { day: "Fri", high: 21, low: 15, icon: Cloud, condition: "Partly Cloudy" },
  { day: "Sat", high: 23, low: 17, icon: Sun, condition: "Sunny" },
  { day: "Sun", high: 25, low: 18, icon: Sun, condition: "Clear" },
];

const alerts = [
  { type: "warning", title: "Heat Advisory", description: "High temperatures expected through Tuesday", expires: "Tomorrow 8PM" },
  { type: "watch", title: "Thunderstorm Watch", description: "Possible severe thunderstorms Wednesday afternoon", expires: "Wed 6PM" },
];

const hourlyForecast = [
  { time: "Now", temp: 24, icon: Sun },
  { time: "1PM", temp: 25, icon: Sun },
  { time: "2PM", temp: 26, icon: Sun },
  { time: "3PM", temp: 25, icon: Cloud },
  { time: "4PM", temp: 24, icon: Cloud },
  { time: "5PM", temp: 23, icon: Cloud },
  { time: "6PM", temp: 22, icon: Sun },
  { time: "7PM", temp: 21, icon: Sunset },
];

export default function Weather() {
  const [activeLayer, setActiveLayer] = useState("temp");

  const openWindy = () => {
    window.open("https://www.windy.com/", "_blank", "noopener,noreferrer");
  };

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <section className="px-4 pt-4">
          <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
            <Cloud className="h-6 w-6 text-blue-500" />
            Weather
          </h1>
          <p className="text-muted-foreground">
            Global weather maps and forecasts
          </p>
        </section>

        {/* Embedded Windy Map */}
        <section className="w-full">
          <div className="relative w-full h-[350px] sm:h-[450px] bg-muted rounded-lg overflow-hidden">
            <iframe
              src="https://embed.windy.com/embed2.html?lat=40&lon=-74&zoom=4&level=surface&overlay=temp&product=ecmwf&menu=&message=true&marker=&calendar=now&pressure=true&type=map&location=coordinates&detail=&metricWind=km%2Fh&metricTemp=%C2%B0C&radarRange=-1"
              className="w-full h-full border-0"
              title="Windy Weather Map"
            />
            <Button 
              onClick={openWindy}
              className="absolute top-3 right-3 gap-2 bg-blue-500 hover:bg-blue-600 shadow-lg"
              size="sm"
            >
              <ExternalLink className="h-4 w-4" />
              Open Full Screen
            </Button>

            {/* Layer Selector Overlay */}
            <div className="absolute bottom-3 left-3 right-3">
              <Card className="p-2 bg-background/95 backdrop-blur">
                <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar">
                  {weatherLayers.map((layer) => (
                    <Button
                      key={layer.id}
                      variant={activeLayer === layer.id ? "default" : "outline"}
                      size="sm"
                      className="shrink-0"
                      onClick={() => setActiveLayer(layer.id)}
                    >
                      <layer.icon className="h-4 w-4 mr-1" />
                      {layer.label}
                    </Button>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* Current Weather Card */}
        <section className="px-4">
          <Card className="p-4 bg-gradient-to-br from-blue-500/10 to-cyan-500/10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  San Francisco, CA
                </p>
                <p className="text-5xl font-bold">24°C</p>
                <p className="text-lg text-muted-foreground">Partly Cloudy</p>
              </div>
              <div className="text-right">
                <Sun className="h-20 w-20 text-yellow-500" />
              </div>
            </div>
            
            {/* Hourly Forecast */}
            <div className="flex gap-4 overflow-x-auto py-3 -mx-2 px-2 hide-scrollbar">
              {hourlyForecast.map((hour, index) => (
                <div key={index} className="flex flex-col items-center min-w-[50px]">
                  <p className="text-xs text-muted-foreground">{hour.time}</p>
                  <hour.icon className="h-6 w-6 my-2 text-blue-500" />
                  <p className="font-semibold">{hour.temp}°</p>
                </div>
              ))}
            </div>

            {/* Weather Details */}
            <div className="grid grid-cols-4 gap-3 mt-4 pt-4 border-t">
              <div className="text-center">
                <Wind className="h-5 w-5 mx-auto text-muted-foreground" />
                <p className="font-semibold mt-1">12 km/h</p>
                <p className="text-xs text-muted-foreground">Wind</p>
              </div>
              <div className="text-center">
                <Droplets className="h-5 w-5 mx-auto text-muted-foreground" />
                <p className="font-semibold mt-1">65%</p>
                <p className="text-xs text-muted-foreground">Humidity</p>
              </div>
              <div className="text-center">
                <Eye className="h-5 w-5 mx-auto text-muted-foreground" />
                <p className="font-semibold mt-1">16 km</p>
                <p className="text-xs text-muted-foreground">Visibility</p>
              </div>
              <div className="text-center">
                <Gauge className="h-5 w-5 mx-auto text-muted-foreground" />
                <p className="font-semibold mt-1">1015</p>
                <p className="text-xs text-muted-foreground">Pressure</p>
              </div>
            </div>
          </Card>
        </section>

        {/* Tabs */}
        <section className="px-4 pb-4">
          <Tabs defaultValue="forecast">
            <TabsList className="w-full">
              <TabsTrigger value="forecast" className="flex-1">7-Day Forecast</TabsTrigger>
              <TabsTrigger value="alerts" className="flex-1">Alerts</TabsTrigger>
            </TabsList>

            <TabsContent value="forecast" className="mt-4">
              <Card className="divide-y">
                {forecast.map((day, index) => (
                  <div key={index} className="flex items-center gap-3 p-3">
                    <p className="w-12 font-medium">{day.day}</p>
                    <day.icon className="h-6 w-6 text-blue-500" />
                    <p className="flex-1 text-sm text-muted-foreground">{day.condition}</p>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{day.high}°</span>
                      <span className="text-muted-foreground">{day.low}°</span>
                    </div>
                  </div>
                ))}
              </Card>
            </TabsContent>

            <TabsContent value="alerts" className="mt-4">
              {alerts.length > 0 ? (
                <div className="space-y-3">
                  {alerts.map((alert, index) => (
                    <Card key={index} className={`p-4 ${alert.type === 'warning' ? 'border-orange-500 bg-orange-500/5' : 'border-yellow-500 bg-yellow-500/5'}`}>
                      <div className="flex items-start gap-3">
                        <AlertTriangle className={`h-5 w-5 shrink-0 ${alert.type === 'warning' ? 'text-orange-500' : 'text-yellow-500'}`} />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">{alert.title}</p>
                            <Badge variant={alert.type === 'warning' ? 'destructive' : 'secondary'}>
                              {alert.type}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{alert.description}</p>
                          <p className="text-xs text-muted-foreground mt-2">Expires: {alert.expires}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="p-8 text-center">
                  <Cloud className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No active weather alerts</p>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </section>
      </div>
    </Layout>
  );
}
