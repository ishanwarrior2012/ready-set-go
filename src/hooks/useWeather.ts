import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useGeolocation } from "./useGeolocation";
import { fetchWithTimeout } from "@/lib/fetchWithTimeout";

export interface CurrentWeather {
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  pressure: number;
  visibility: number;
  uvIndex: number;
  condition: string;
  conditionCode: number;
  icon: string;
  sunrise: number;
  sunset: number;
  location: string;
}

export interface HourlyForecast {
  time: string;
  timestamp: number;
  temperature: number;
  conditionCode: number;
  precipitation: number;
}

export interface DailyForecast {
  day: string;
  date: string;
  high: number;
  low: number;
  conditionCode: number;
  condition: string;
  precipitation: number;
  humidity: number;
  windSpeed: number;
}

export interface WeatherAlert {
  id: string;
  type: "warning" | "watch" | "advisory";
  title: string;
  description: string;
  severity: string;
  expires: string;
}

export interface WeatherData {
  current: CurrentWeather;
  hourly: HourlyForecast[];
  daily: DailyForecast[];
  alerts: WeatherAlert[];
}

// Open-Meteo API (free, no API key required)
async function fetchWeatherData(lat: number, lon: number): Promise<WeatherData> {
  // Fetch current weather and forecast
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", lat.toString());
  url.searchParams.set("longitude", lon.toString());
  url.searchParams.set("current", "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure,visibility");
  url.searchParams.set("hourly", "temperature_2m,weather_code,precipitation_probability");
  url.searchParams.set("daily", "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,relative_humidity_2m_max,wind_speed_10m_max,sunrise,sunset");
  url.searchParams.set("timezone", "auto");
  url.searchParams.set("forecast_days", "7");

  const response = await fetchWithTimeout(url.toString(), { timeoutMs: 10000 });
  if (!response.ok) {
    throw new Error("Failed to fetch weather data");
  }

  const data = await response.json();
  
  // Get location name using reverse geocoding
  let locationName = "Current Location";
  try {
    const geoResponse = await fetchWithTimeout(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
      { timeoutMs: 5000 }
    );
    if (geoResponse.ok) {
      const geoData = await geoResponse.json();
      const city = geoData.address?.city || geoData.address?.town || geoData.address?.village || geoData.address?.county;
      const country = geoData.address?.country_code?.toUpperCase();
      if (city) {
        locationName = country ? `${city}, ${country}` : city;
      }
    }
  } catch {
    // Ignore geocoding errors
  }

  // Parse current weather
  const current: CurrentWeather = {
    temperature: Math.round(data.current.temperature_2m),
    feelsLike: Math.round(data.current.apparent_temperature),
    humidity: data.current.relative_humidity_2m,
    windSpeed: Math.round(data.current.wind_speed_10m),
    windDirection: data.current.wind_direction_10m,
    pressure: Math.round(data.current.surface_pressure),
    visibility: Math.round((data.current.visibility || 10000) / 1000),
    uvIndex: 0,
    condition: getConditionFromCode(data.current.weather_code),
    conditionCode: data.current.weather_code,
    icon: getIconFromCode(data.current.weather_code),
    sunrise: new Date(data.daily.sunrise[0]).getTime(),
    sunset: new Date(data.daily.sunset[0]).getTime(),
    location: locationName,
  };

  // Parse hourly forecast (next 24 hours)
  const hourly: HourlyForecast[] = data.hourly.time.slice(0, 24).map((time: string, i: number) => ({
    time: formatHourlyTime(time),
    timestamp: new Date(time).getTime(),
    temperature: Math.round(data.hourly.temperature_2m[i]),
    conditionCode: data.hourly.weather_code[i],
    precipitation: data.hourly.precipitation_probability[i] || 0,
  }));

  // Parse daily forecast
  const daily: DailyForecast[] = data.daily.time.map((date: string, i: number) => ({
    day: formatDayName(date, i),
    date,
    high: Math.round(data.daily.temperature_2m_max[i]),
    low: Math.round(data.daily.temperature_2m_min[i]),
    conditionCode: data.daily.weather_code[i],
    condition: getConditionFromCode(data.daily.weather_code[i]),
    precipitation: data.daily.precipitation_probability_max[i] || 0,
    humidity: data.daily.relative_humidity_2m_max[i] || 0,
    windSpeed: Math.round(data.daily.wind_speed_10m_max[i] || 0),
  }));

  return {
    current,
    hourly,
    daily,
    alerts: [], // Open-Meteo doesn't provide alerts in free tier
  };
}

function formatHourlyTime(isoTime: string): string {
  const date = new Date(isoTime);
  const now = new Date();
  if (date.getHours() === now.getHours() && date.getDate() === now.getDate()) {
    return "Now";
  }
  return date.toLocaleTimeString([], { hour: "numeric" });
}

function formatDayName(dateStr: string, index: number): string {
  if (index === 0) return "Today";
  if (index === 1) return "Tomorrow";
  return new Date(dateStr).toLocaleDateString([], { weekday: "short" });
}

function getConditionFromCode(code: number): string {
  const conditions: Record<number, string> = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Foggy",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    66: "Light freezing rain",
    67: "Heavy freezing rain",
    71: "Slight snow",
    73: "Moderate snow",
    75: "Heavy snow",
    77: "Snow grains",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    85: "Slight snow showers",
    86: "Heavy snow showers",
    95: "Thunderstorm",
    96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail",
  };
  return conditions[code] || "Unknown";
}

function getIconFromCode(code: number): string {
  if (code === 0 || code === 1) return "sun";
  if (code === 2) return "cloud-sun";
  if (code === 3) return "cloud";
  if (code >= 45 && code <= 48) return "cloud-fog";
  if (code >= 51 && code <= 55) return "cloud-drizzle";
  if (code >= 61 && code <= 67) return "cloud-rain";
  if (code >= 71 && code <= 77) return "snowflake";
  if (code >= 80 && code <= 82) return "cloud-rain";
  if (code >= 85 && code <= 86) return "snowflake";
  if (code >= 95) return "cloud-lightning";
  return "cloud";
}

export function useWeather(customLat?: number, customLon?: number) {
  const geo = useGeolocation({ watch: false });
  
  // Request location on mount
  useEffect(() => {
    if (customLat === undefined && !geo.latitude) {
      geo.requestLocation();
    }
  }, []);
  
  // Default to New Delhi, India when geolocation is unavailable
  const lat = customLat ?? geo.latitude ?? 28.6139;
  const lon = customLon ?? geo.longitude ?? 77.2090;

  const query = useQuery({
    queryKey: ["weather", lat, lon],
    queryFn: () => fetchWeatherData(lat, lon),
    refetchInterval: 600000, // Refresh every 10 minutes
    staleTime: 300000, // 5 minutes
    enabled: !geo.loading || customLat !== undefined,
  });

  return {
    ...query,
    isLocating: geo.loading && customLat === undefined,
  };
}

export { getConditionFromCode, getIconFromCode };
