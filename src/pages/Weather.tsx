import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Cloud, 
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
  CloudSun,
  CloudFog,
  CloudLightning,
  CloudDrizzle,
  RefreshCw,
  Loader2
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWeather } from "@/hooks/useWeather";
import { Skeleton } from "@/components/ui/skeleton";

const weatherLayers = [
  { id: "temp", label: "Temperature", icon: Thermometer, active: true },
  { id: "wind", label: "Wind", icon: Wind, active: false },
  { id: "precip", label: "Precipitation", icon: Droplets, active: false },
  { id: "clouds", label: "Clouds", icon: Cloud, active: false },
];

function getWeatherIcon(code: number) {
  if (code === 0 || code === 1) return Sun;
  if (code === 2) return CloudSun;
  if (code === 3) return Cloud;
  if (code >= 45 && code <= 48) return CloudFog;
  if (code >= 51 && code <= 55) return CloudDrizzle;
  if (code >= 61 && code <= 67) return CloudRain;
  if (code >= 71 && code <= 77) return Snowflake;
  if (code >= 80 && code <= 82) return CloudRain;
  if (code >= 85 && code <= 86) return Snowflake;
  if (code >= 95) return CloudLightning;
  return Cloud;
}

function getIconColor(code: number): string {
  if (code === 0 || code === 1) return "text-yellow-500";
  if (code === 2) return "text-yellow-400";
  if (code >= 61 && code <= 67) return "text-blue-500";
  if (code >= 71 && code <= 77) return "text-blue-200";
  if (code >= 95) return "text-purple-500";
  return "text-gray-400";
}

export default function Weather() {
  const [activeLayer, setActiveLayer] = useState("temp");
  const { data: weather, isLoading, error, refetch, isLocating } = useWeather();

  const openWindy = () => {
    window.open("https://www.windy.com/", "_blank", "noopener,noreferrer");
  };

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <section className="px-4 pt-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
                <Cloud className="h-6 w-6 text-blue-500" />
                Weather
              </h1>
              <p className="text-muted-foreground">
                Global weather maps and forecasts
              </p>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
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
          {isLocating ? (
            <Card className="p-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-500 mb-2" />
              <p className="text-muted-foreground">Getting your location...</p>
            </Card>
          ) : isLoading ? (
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-12 w-24 mb-2" />
                  <Skeleton className="h-5 w-28" />
                </div>
                <Skeleton className="h-20 w-20 rounded-full" />
              </div>
              <div className="flex gap-4 py-3">
                {[1,2,3,4,5,6].map(i => (
                  <div key={i} className="flex flex-col items-center min-w-[50px]">
                    <Skeleton className="h-3 w-8 mb-2" />
                    <Skeleton className="h-6 w-6 mb-2" />
                    <Skeleton className="h-4 w-8" />
                  </div>
                ))}
              </div>
            </Card>
          ) : error ? (
            <Card className="p-8 text-center">
              <Cloud className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">Failed to load weather data</p>
              <Button variant="outline" size="sm" className="mt-2" onClick={() => refetch()}>
                Retry
              </Button>
            </Card>
          ) : weather ? (
            <Card className="p-4 bg-gradient-to-br from-blue-500/10 to-cyan-500/10">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {weather.current.location}
                    <span className="ml-2 flex items-center gap-1 text-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                      Live
                    </span>
                  </p>
                  <p className="text-5xl font-bold">{weather.current.temperature}°C</p>
                  <p className="text-lg text-muted-foreground">{weather.current.condition}</p>
                  <p className="text-sm text-muted-foreground">
                    Feels like {weather.current.feelsLike}°C
                  </p>
                </div>
                <div className="text-right">
                  {(() => {
                    const IconComponent = getWeatherIcon(weather.current.conditionCode);
                    return <IconComponent className={`h-20 w-20 ${getIconColor(weather.current.conditionCode)}`} />;
                  })()}
                </div>
              </div>
              
              {/* Hourly Forecast */}
              <div className="flex gap-4 overflow-x-auto py-3 -mx-2 px-2 hide-scrollbar">
                {weather.hourly.slice(0, 12).map((hour, index) => {
                  const HourIcon = getWeatherIcon(hour.conditionCode);
                  return (
                    <div key={index} className="flex flex-col items-center min-w-[50px]">
                      <p className="text-xs text-muted-foreground">{hour.time}</p>
                      <HourIcon className={`h-6 w-6 my-2 ${getIconColor(hour.conditionCode)}`} />
                      <p className="font-semibold">{hour.temperature}°</p>
                      {hour.precipitation > 0 && (
                        <p className="text-xs text-blue-500">{hour.precipitation}%</p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Weather Details */}
              <div className="grid grid-cols-4 gap-3 mt-4 pt-4 border-t">
                <div className="text-center">
                  <Wind className="h-5 w-5 mx-auto text-muted-foreground" />
                  <p className="font-semibold mt-1">{weather.current.windSpeed} km/h</p>
                  <p className="text-xs text-muted-foreground">Wind</p>
                </div>
                <div className="text-center">
                  <Droplets className="h-5 w-5 mx-auto text-muted-foreground" />
                  <p className="font-semibold mt-1">{weather.current.humidity}%</p>
                  <p className="text-xs text-muted-foreground">Humidity</p>
                </div>
                <div className="text-center">
                  <Eye className="h-5 w-5 mx-auto text-muted-foreground" />
                  <p className="font-semibold mt-1">{weather.current.visibility} km</p>
                  <p className="text-xs text-muted-foreground">Visibility</p>
                </div>
                <div className="text-center">
                  <Gauge className="h-5 w-5 mx-auto text-muted-foreground" />
                  <p className="font-semibold mt-1">{weather.current.pressure}</p>
                  <p className="text-xs text-muted-foreground">hPa</p>
                </div>
              </div>
            </Card>
          ) : null}
        </section>

        {/* Tabs */}
        <section className="px-4 pb-4">
          <Tabs defaultValue="forecast">
            <TabsList className="w-full">
              <TabsTrigger value="forecast" className="flex-1">7-Day Forecast</TabsTrigger>
              <TabsTrigger value="details" className="flex-1">Details</TabsTrigger>
            </TabsList>

            <TabsContent value="forecast" className="mt-4">
              {isLoading ? (
                <Card className="divide-y">
                  {[1,2,3,4,5,6,7].map(i => (
                    <div key={i} className="flex items-center gap-3 p-3">
                      <Skeleton className="w-16 h-4" />
                      <Skeleton className="w-6 h-6" />
                      <Skeleton className="flex-1 h-4" />
                      <Skeleton className="w-16 h-4" />
                    </div>
                  ))}
                </Card>
              ) : weather ? (
                <Card className="divide-y">
                  {weather.daily.map((day, index) => {
                    const DayIcon = getWeatherIcon(day.conditionCode);
                    return (
                      <div key={index} className="flex items-center gap-3 p-3">
                        <p className="w-20 font-medium">{day.day}</p>
                        <DayIcon className={`h-6 w-6 ${getIconColor(day.conditionCode)}`} />
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground">{day.condition}</p>
                          {day.precipitation > 0 && (
                            <p className="text-xs text-blue-500 flex items-center gap-1">
                              <Droplets className="h-3 w-3" />
                              {day.precipitation}% chance
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-right">
                          <span className="font-semibold">{day.high}°</span>
                          <span className="text-muted-foreground">{day.low}°</span>
                        </div>
                      </div>
                    );
                  })}
                </Card>
              ) : null}
            </TabsContent>

            <TabsContent value="details" className="mt-4">
              {weather ? (
                <div className="grid gap-3">
                  {weather.daily.slice(0, 4).map((day, index) => (
                    <Card key={index} className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {(() => {
                            const DayIcon = getWeatherIcon(day.conditionCode);
                            return <DayIcon className={`h-5 w-5 ${getIconColor(day.conditionCode)}`} />;
                          })()}
                          <span className="font-medium">{day.day}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">{day.condition}</span>
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-center text-sm">
                        <div>
                          <Thermometer className="h-4 w-4 mx-auto text-muted-foreground" />
                          <p className="font-medium">{day.high}°/{day.low}°</p>
                          <p className="text-xs text-muted-foreground">Temp</p>
                        </div>
                        <div>
                          <Droplets className="h-4 w-4 mx-auto text-muted-foreground" />
                          <p className="font-medium">{day.humidity}%</p>
                          <p className="text-xs text-muted-foreground">Humidity</p>
                        </div>
                        <div>
                          <Wind className="h-4 w-4 mx-auto text-muted-foreground" />
                          <p className="font-medium">{day.windSpeed} km/h</p>
                          <p className="text-xs text-muted-foreground">Wind</p>
                        </div>
                        <div>
                          <CloudRain className="h-4 w-4 mx-auto text-muted-foreground" />
                          <p className="font-medium">{day.precipitation}%</p>
                          <p className="text-xs text-muted-foreground">Precip</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="p-8 text-center">
                  <Cloud className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No weather data available</p>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </section>
      </div>
    </Layout>
  );
}
