/**
 * GlobalLocationContext
 * ---------------------
 * Single source of truth for user location across the entire app.
 * Supports:
 *  - GPS "Use My Location"
 *  - Manual country / city selection
 *  - Persists choice to localStorage
 */
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";

export interface AppLocation {
  lat: number;
  lon: number;
  label: string;          // Human-readable name, e.g. "New Delhi, IN"
  source: "gps" | "manual" | "default";
}

interface LocationContextType {
  location: AppLocation;
  isLocating: boolean;
  locationError: string | null;
  requestGPS: () => Promise<void>;
  setManualLocation: (loc: AppLocation) => void;
  clearError: () => void;
}

// ── Popular countries with capital coordinates ────────────────────────────────
export const COUNTRIES: { label: string; lat: number; lon: number; flag: string }[] = [
  { label: "India",          lat: 28.6139, lon:  77.2090, flag: "🇮🇳" },
  { label: "United States",  lat: 38.8951, lon: -77.0364, flag: "🇺🇸" },
  { label: "United Kingdom", lat: 51.5074, lon:  -0.1278, flag: "🇬🇧" },
  { label: "China",          lat: 39.9042, lon: 116.4074, flag: "🇨🇳" },
  { label: "Japan",          lat: 35.6762, lon: 139.6503, flag: "🇯🇵" },
  { label: "Germany",        lat: 52.5200, lon:  13.4050, flag: "🇩🇪" },
  { label: "France",         lat: 48.8566, lon:   2.3522, flag: "🇫🇷" },
  { label: "Brazil",         lat: -15.8267, lon: -47.9218, flag: "🇧🇷" },
  { label: "Australia",      lat: -35.2809, lon: 149.1300, flag: "🇦🇺" },
  { label: "Canada",         lat: 45.4215, lon: -75.6972, flag: "🇨🇦" },
  { label: "Russia",         lat: 55.7558, lon:  37.6173, flag: "🇷🇺" },
  { label: "South Korea",    lat: 37.5665, lon: 126.9780, flag: "🇰🇷" },
  { label: "Indonesia",      lat: -6.2088, lon: 106.8456, flag: "🇮🇩" },
  { label: "Mexico",         lat: 19.4326, lon: -99.1332, flag: "🇲🇽" },
  { label: "Italy",          lat: 41.9028, lon:  12.4964, flag: "🇮🇹" },
  { label: "Spain",          lat: 40.4168, lon:  -3.7038, flag: "🇪🇸" },
  { label: "Saudi Arabia",   lat: 24.7136, lon:  46.6753, flag: "🇸🇦" },
  { label: "Turkey",         lat: 39.9334, lon:  32.8597, flag: "🇹🇷" },
  { label: "Netherlands",    lat: 52.3676, lon:   4.9041, flag: "🇳🇱" },
  { label: "Pakistan",       lat: 33.6844, lon:  73.0479, flag: "🇵🇰" },
  { label: "Nigeria",        lat:  9.0765, lon:   7.3986, flag: "🇳🇬" },
  { label: "South Africa",   lat: -25.7479, lon:  28.2293, flag: "🇿🇦" },
  { label: "Argentina",      lat: -34.6037, lon: -58.3816, flag: "🇦🇷" },
  { label: "Egypt",          lat: 30.0444, lon:  31.2357, flag: "🇪🇬" },
  { label: "UAE",            lat: 24.4539, lon:  54.3773, flag: "🇦🇪" },
  { label: "Singapore",      lat:  1.3521, lon: 103.8198, flag: "🇸🇬" },
  { label: "New Zealand",    lat: -41.2866, lon: 174.7756, flag: "🇳🇿" },
  { label: "Sweden",         lat: 59.3293, lon:  18.0686, flag: "🇸🇪" },
  { label: "Switzerland",    lat: 46.9480, lon:   7.4474, flag: "🇨🇭" },
  { label: "Poland",         lat: 52.2297, lon:  21.0122, flag: "🇵🇱" },
];

const DEFAULT_LOCATION: AppLocation = {
  lat: 28.6139,
  lon: 77.2090,
  label: "New Delhi, India",
  source: "default",
};

const STORAGE_KEY = "safetrack_location";

function loadSavedLocation(): AppLocation {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as AppLocation;
  } catch { /* ignore */ }
  return DEFAULT_LOCATION;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useState<AppLocation>(loadSavedLocation);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Persist to localStorage whenever location changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(location));
  }, [location]);

  const requestGPS = useCallback(async () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      return;
    }
    setIsLocating(true);
    setLocationError(null);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 12000,
          maximumAge: 60000,
        })
      );
      const { latitude: lat, longitude: lon } = pos.coords;
      // Reverse geocode for a nice label
      let label = `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`;
      try {
        const r = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
        );
        if (r.ok) {
          const d = await r.json();
          const city =
            d.address?.city ||
            d.address?.town ||
            d.address?.village ||
            d.address?.county ||
            "";
          const country = d.address?.country_code?.toUpperCase() || "";
          if (city) label = country ? `${city}, ${country}` : city;
        }
      } catch { /* ignore geocoding error */ }

      setLocation({ lat, lon, label, source: "gps" });
    } catch (e) {
      const code = (e as GeolocationPositionError).code;
      if (code === 1) setLocationError("Location permission denied");
      else if (code === 2) setLocationError("Location unavailable");
      else setLocationError("Location request timed out");
    } finally {
      setIsLocating(false);
    }
  }, []);

  const setManualLocation = useCallback((loc: AppLocation) => {
    setLocation(loc);
    setLocationError(null);
  }, []);

  const clearError = useCallback(() => setLocationError(null), []);

  return (
    <LocationContext.Provider
      value={{ location, isLocating, locationError, requestGPS, setManualLocation, clearError }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error("useLocation must be used inside <LocationProvider>");
  return ctx;
}
