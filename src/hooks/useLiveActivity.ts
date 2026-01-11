import { useQuery } from "@tanstack/react-query";

export interface ActivityItem {
  id: string;
  type: "earthquake" | "volcano" | "weather" | "tsunami";
  title: string;
  location: string;
  time: string;
  timestamp: number;
  severity: "low" | "medium" | "high" | "critical";
  magnitude?: number;
  link?: string;
}

function getRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function getSeverityFromMagnitude(mag: number): "low" | "medium" | "high" | "critical" {
  if (mag >= 7) return "critical";
  if (mag >= 6) return "high";
  if (mag >= 4.5) return "medium";
  return "low";
}

async function fetchLiveActivity(): Promise<ActivityItem[]> {
  const activities: ActivityItem[] = [];

  // Fetch earthquakes from USGS (significant earthquakes in last 24h)
  try {
    const earthquakeResponse = await fetch(
      "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson"
    );
    if (earthquakeResponse.ok) {
      const data = await earthquakeResponse.json();
      const earthquakes = data.features?.slice(0, 10) || [];
      
      for (const eq of earthquakes) {
        const props = eq.properties;
        const mag = props.mag || 0;
        const place = props.place || "Unknown location";
        const time = props.time || Date.now();
        
        activities.push({
          id: `eq-${eq.id}`,
          type: "earthquake",
          title: `M${mag.toFixed(1)} Earthquake`,
          location: place,
          time: getRelativeTime(time),
          timestamp: time,
          severity: getSeverityFromMagnitude(mag),
          magnitude: mag,
          link: props.url,
        });
      }
    }
  } catch (error) {
    console.error("Failed to fetch earthquakes:", error);
  }

  // Fetch tsunami warnings from NOAA (if available)
  try {
    const tsunamiResponse = await fetch(
      "https://www.tsunami.gov/events/xml/PHEBAtom.xml"
    );
    if (tsunamiResponse.ok) {
      const text = await tsunamiResponse.text();
      // Parse XML for any active warnings
      if (text.includes("<entry>")) {
        const titleMatch = text.match(/<title>([^<]+)<\/title>/g);
        if (titleMatch && titleMatch.length > 1) {
          activities.push({
            id: `tsunami-${Date.now()}`,
            type: "tsunami",
            title: "Tsunami Advisory",
            location: "Pacific Ocean Region",
            time: "Active",
            timestamp: Date.now(),
            severity: "high",
          });
        }
      }
    }
  } catch (error) {
    // NOAA feed may have CORS issues, silently fail
  }

  // Fetch volcano data from Smithsonian
  try {
    // Using USGS volcano alerts as fallback
    const volcanoResponse = await fetch(
      "https://volcanoes.usgs.gov/hans2/api/volcanoAlerts"
    );
    if (volcanoResponse.ok) {
      const data = await volcanoResponse.json();
      const alerts = data?.volcanoAlerts?.slice(0, 3) || [];
      
      for (const alert of alerts) {
        if (alert.alertLevel && alert.alertLevel !== "NORMAL") {
          activities.push({
            id: `volcano-${alert.volcanoName}`,
            type: "volcano",
            title: `${alert.alertLevel} Alert`,
            location: alert.volcanoName || "Unknown volcano",
            time: getRelativeTime(new Date(alert.pubDate).getTime()),
            timestamp: new Date(alert.pubDate).getTime(),
            severity: alert.alertLevel === "WARNING" ? "high" : 
                     alert.alertLevel === "WATCH" ? "medium" : "low",
          });
        }
      }
    }
  } catch (error) {
    // Volcano API may have issues, silently fail
  }

  // Sort by timestamp (most recent first)
  activities.sort((a, b) => b.timestamp - a.timestamp);

  return activities;
}

export function useLiveActivity() {
  return useQuery({
    queryKey: ["live-activity"],
    queryFn: fetchLiveActivity,
    refetchInterval: 120000, // Refresh every 2 minutes
    staleTime: 60000,
  });
}
