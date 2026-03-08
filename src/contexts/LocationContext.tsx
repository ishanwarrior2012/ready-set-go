/**
 * GlobalLocationContext
 * ---------------------
 * Single source of truth for user location across the entire app.
 * Supports:
 *  - GPS "Use My Location" (with graceful fallback for PWAs/converters)
 *  - Manual country / city selection (200+ countries with timezones)
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
  label: string;          // Human-readable name
  source: "gps" | "manual" | "default";
  timezone?: string;      // IANA timezone string
}

interface LocationContextType {
  location: AppLocation;
  isLocating: boolean;
  locationError: string | null;
  requestGPS: () => Promise<void>;
  setManualLocation: (loc: AppLocation) => void;
  clearError: () => void;
}

// ── All world countries with capital coordinates + timezone ───────────────────
export const COUNTRIES: { label: string; lat: number; lon: number; flag: string; timezone: string }[] = [
  // Asia
  { label: "India",           lat: 28.6139,  lon:  77.2090, flag: "🇮🇳", timezone: "Asia/Kolkata" },
  { label: "China",           lat: 39.9042,  lon: 116.4074, flag: "🇨🇳", timezone: "Asia/Shanghai" },
  { label: "Japan",           lat: 35.6762,  lon: 139.6503, flag: "🇯🇵", timezone: "Asia/Tokyo" },
  { label: "South Korea",     lat: 37.5665,  lon: 126.9780, flag: "🇰🇷", timezone: "Asia/Seoul" },
  { label: "Indonesia",       lat: -6.2088,  lon: 106.8456, flag: "🇮🇩", timezone: "Asia/Jakarta" },
  { label: "Pakistan",        lat: 33.6844,  lon:  73.0479, flag: "🇵🇰", timezone: "Asia/Karachi" },
  { label: "Bangladesh",      lat: 23.8103,  lon:  90.4125, flag: "🇧🇩", timezone: "Asia/Dhaka" },
  { label: "Philippines",     lat: 14.5995,  lon: 120.9842, flag: "🇵🇭", timezone: "Asia/Manila" },
  { label: "Vietnam",         lat: 21.0285,  lon: 105.8542, flag: "🇻🇳", timezone: "Asia/Ho_Chi_Minh" },
  { label: "Thailand",        lat: 13.7563,  lon: 100.5018, flag: "🇹🇭", timezone: "Asia/Bangkok" },
  { label: "Malaysia",        lat:  3.1390,  lon: 101.6869, flag: "🇲🇾", timezone: "Asia/Kuala_Lumpur" },
  { label: "Singapore",       lat:  1.3521,  lon: 103.8198, flag: "🇸🇬", timezone: "Asia/Singapore" },
  { label: "Myanmar",         lat: 16.8661,  lon:  96.1951, flag: "🇲🇲", timezone: "Asia/Rangoon" },
  { label: "Sri Lanka",       lat:  6.9271,  lon:  79.8612, flag: "🇱🇰", timezone: "Asia/Colombo" },
  { label: "Nepal",           lat: 27.7172,  lon:  85.3240, flag: "🇳🇵", timezone: "Asia/Kathmandu" },
  { label: "Cambodia",        lat: 11.5564,  lon: 104.9282, flag: "🇰🇭", timezone: "Asia/Phnom_Penh" },
  { label: "Laos",            lat: 17.9757,  lon: 102.6331, flag: "🇱🇦", timezone: "Asia/Vientiane" },
  { label: "Taiwan",          lat: 25.0330,  lon: 121.5654, flag: "🇹🇼", timezone: "Asia/Taipei" },
  { label: "Hong Kong",       lat: 22.3193,  lon: 114.1694, flag: "🇭🇰", timezone: "Asia/Hong_Kong" },
  { label: "Mongolia",        lat: 47.8864,  lon: 106.9057, flag: "🇲🇳", timezone: "Asia/Ulaanbaatar" },
  { label: "Kazakhstan",      lat: 51.1801,  lon:  71.4460, flag: "🇰🇿", timezone: "Asia/Almaty" },
  { label: "Uzbekistan",      lat: 41.2995,  lon:  69.2401, flag: "🇺🇿", timezone: "Asia/Tashkent" },
  { label: "Azerbaijan",      lat: 40.4093,  lon:  49.8671, flag: "🇦🇿", timezone: "Asia/Baku" },
  { label: "Georgia",         lat: 41.6938,  lon:  44.8015, flag: "🇬🇪", timezone: "Asia/Tbilisi" },
  { label: "Armenia",         lat: 40.1872,  lon:  44.5152, flag: "🇦🇲", timezone: "Asia/Yerevan" },
  { label: "Afghanistan",     lat: 34.5260,  lon:  69.1763, flag: "🇦🇫", timezone: "Asia/Kabul" },
  { label: "Iraq",            lat: 33.3406,  lon:  44.4009, flag: "🇮🇶", timezone: "Asia/Baghdad" },
  { label: "Iran",            lat: 35.6892,  lon:  51.3890, flag: "🇮🇷", timezone: "Asia/Tehran" },
  { label: "Saudi Arabia",    lat: 24.7136,  lon:  46.6753, flag: "🇸🇦", timezone: "Asia/Riyadh" },
  { label: "UAE",             lat: 24.4539,  lon:  54.3773, flag: "🇦🇪", timezone: "Asia/Dubai" },
  { label: "Israel",          lat: 31.7683,  lon:  35.2137, flag: "🇮🇱", timezone: "Asia/Jerusalem" },
  { label: "Jordan",          lat: 31.9522,  lon:  35.9304, flag: "🇯🇴", timezone: "Asia/Amman" },
  { label: "Lebanon",         lat: 33.8886,  lon:  35.4955, flag: "🇱🇧", timezone: "Asia/Beirut" },
  { label: "Syria",           lat: 33.5138,  lon:  36.2765, flag: "🇸🇾", timezone: "Asia/Damascus" },
  { label: "Kuwait",          lat: 29.3759,  lon:  47.9774, flag: "🇰🇼", timezone: "Asia/Kuwait" },
  { label: "Qatar",           lat: 25.2854,  lon:  51.5310, flag: "🇶🇦", timezone: "Asia/Qatar" },
  { label: "Bahrain",         lat: 26.2235,  lon:  50.5876, flag: "🇧🇭", timezone: "Asia/Bahrain" },
  { label: "Oman",            lat: 23.5880,  lon:  58.3829, flag: "🇴🇲", timezone: "Asia/Muscat" },
  { label: "Yemen",           lat: 15.3694,  lon:  44.1910, flag: "🇾🇪", timezone: "Asia/Aden" },
  { label: "Turkey",          lat: 39.9334,  lon:  32.8597, flag: "🇹🇷", timezone: "Europe/Istanbul" },

  // Europe
  { label: "Russia",          lat: 55.7558,  lon:  37.6173, flag: "🇷🇺", timezone: "Europe/Moscow" },
  { label: "Germany",         lat: 52.5200,  lon:  13.4050, flag: "🇩🇪", timezone: "Europe/Berlin" },
  { label: "France",          lat: 48.8566,  lon:   2.3522, flag: "🇫🇷", timezone: "Europe/Paris" },
  { label: "United Kingdom",  lat: 51.5074,  lon:  -0.1278, flag: "🇬🇧", timezone: "Europe/London" },
  { label: "Italy",           lat: 41.9028,  lon:  12.4964, flag: "🇮🇹", timezone: "Europe/Rome" },
  { label: "Spain",           lat: 40.4168,  lon:  -3.7038, flag: "🇪🇸", timezone: "Europe/Madrid" },
  { label: "Poland",          lat: 52.2297,  lon:  21.0122, flag: "🇵🇱", timezone: "Europe/Warsaw" },
  { label: "Netherlands",     lat: 52.3676,  lon:   4.9041, flag: "🇳🇱", timezone: "Europe/Amsterdam" },
  { label: "Belgium",         lat: 50.8503,  lon:   4.3517, flag: "🇧🇪", timezone: "Europe/Brussels" },
  { label: "Sweden",          lat: 59.3293,  lon:  18.0686, flag: "🇸🇪", timezone: "Europe/Stockholm" },
  { label: "Norway",          lat: 59.9139,  lon:  10.7522, flag: "🇳🇴", timezone: "Europe/Oslo" },
  { label: "Denmark",         lat: 55.6761,  lon:  12.5683, flag: "🇩🇰", timezone: "Europe/Copenhagen" },
  { label: "Finland",         lat: 60.1699,  lon:  24.9384, flag: "🇫🇮", timezone: "Europe/Helsinki" },
  { label: "Switzerland",     lat: 46.9480,  lon:   7.4474, flag: "🇨🇭", timezone: "Europe/Zurich" },
  { label: "Austria",         lat: 48.2082,  lon:  16.3738, flag: "🇦🇹", timezone: "Europe/Vienna" },
  { label: "Portugal",        lat: 38.7223,  lon:  -9.1393, flag: "🇵🇹", timezone: "Europe/Lisbon" },
  { label: "Greece",          lat: 37.9838,  lon:  23.7275, flag: "🇬🇷", timezone: "Europe/Athens" },
  { label: "Czech Republic",  lat: 50.0755,  lon:  14.4378, flag: "🇨🇿", timezone: "Europe/Prague" },
  { label: "Romania",         lat: 44.4268,  lon:  26.1025, flag: "🇷🇴", timezone: "Europe/Bucharest" },
  { label: "Hungary",         lat: 47.4979,  lon:  19.0402, flag: "🇭🇺", timezone: "Europe/Budapest" },
  { label: "Ukraine",         lat: 50.4501,  lon:  30.5234, flag: "🇺🇦", timezone: "Europe/Kiev" },
  { label: "Belarus",         lat: 53.9045,  lon:  27.5615, flag: "🇧🇾", timezone: "Europe/Minsk" },
  { label: "Serbia",          lat: 44.8176,  lon:  20.4569, flag: "🇷🇸", timezone: "Europe/Belgrade" },
  { label: "Bulgaria",        lat: 42.6977,  lon:  23.3219, flag: "🇧🇬", timezone: "Europe/Sofia" },
  { label: "Croatia",         lat: 45.8150,  lon:  15.9819, flag: "🇭🇷", timezone: "Europe/Zagreb" },
  { label: "Slovakia",        lat: 48.1486,  lon:  17.1077, flag: "🇸🇰", timezone: "Europe/Bratislava" },
  { label: "Ireland",         lat: 53.3498,  lon:  -6.2603, flag: "🇮🇪", timezone: "Europe/Dublin" },
  { label: "Lithuania",       lat: 54.6872,  lon:  25.2797, flag: "🇱🇹", timezone: "Europe/Vilnius" },
  { label: "Latvia",          lat: 56.9460,  lon:  24.1059, flag: "🇱🇻", timezone: "Europe/Riga" },
  { label: "Estonia",         lat: 59.4370,  lon:  24.7536, flag: "🇪🇪", timezone: "Europe/Tallinn" },
  { label: "Slovenia",        lat: 46.0511,  lon:  14.5051, flag: "🇸🇮", timezone: "Europe/Ljubljana" },
  { label: "Luxembourg",      lat: 49.6117,  lon:   6.1319, flag: "🇱🇺", timezone: "Europe/Luxembourg" },
  { label: "Malta",           lat: 35.8997,  lon:  14.5146, flag: "🇲🇹", timezone: "Europe/Malta" },
  { label: "Iceland",         lat: 64.1355,  lon: -21.8954, flag: "🇮🇸", timezone: "Atlantic/Reykjavik" },
  { label: "Moldova",         lat: 47.0105,  lon:  28.8638, flag: "🇲🇩", timezone: "Europe/Chisinau" },
  { label: "Albania",         lat: 41.3275,  lon:  19.8187, flag: "🇦🇱", timezone: "Europe/Tirane" },
  { label: "North Macedonia", lat: 41.9981,  lon:  21.4254, flag: "🇲🇰", timezone: "Europe/Skopje" },
  { label: "Bosnia",          lat: 43.8519,  lon:  18.3866, flag: "🇧🇦", timezone: "Europe/Sarajevo" },
  { label: "Montenegro",      lat: 42.4411,  lon:  19.2636, flag: "🇲🇪", timezone: "Europe/Podgorica" },
  { label: "Kosovo",          lat: 42.6629,  lon:  21.1655, flag: "🇽🇰", timezone: "Europe/Belgrade" },

  // Americas
  { label: "United States",   lat: 38.8951,  lon: -77.0364, flag: "🇺🇸", timezone: "America/New_York" },
  { label: "Canada",          lat: 45.4215,  lon: -75.6972, flag: "🇨🇦", timezone: "America/Toronto" },
  { label: "Mexico",          lat: 19.4326,  lon: -99.1332, flag: "🇲🇽", timezone: "America/Mexico_City" },
  { label: "Brazil",          lat: -15.8267, lon: -47.9218, flag: "🇧🇷", timezone: "America/Sao_Paulo" },
  { label: "Argentina",       lat: -34.6037, lon: -58.3816, flag: "🇦🇷", timezone: "America/Argentina/Buenos_Aires" },
  { label: "Colombia",        lat:  4.7110,  lon: -74.0721, flag: "🇨🇴", timezone: "America/Bogota" },
  { label: "Chile",           lat: -33.4489, lon: -70.6693, flag: "🇨🇱", timezone: "America/Santiago" },
  { label: "Peru",            lat: -12.0464, lon: -77.0428, flag: "🇵🇪", timezone: "America/Lima" },
  { label: "Venezuela",       lat: 10.4806,  lon: -66.9036, flag: "🇻🇪", timezone: "America/Caracas" },
  { label: "Ecuador",         lat: -0.1807,  lon: -78.4678, flag: "🇪🇨", timezone: "America/Guayaquil" },
  { label: "Bolivia",         lat: -16.5000, lon: -68.1193, flag: "🇧🇴", timezone: "America/La_Paz" },
  { label: "Paraguay",        lat: -25.2867, lon: -57.6470, flag: "🇵🇾", timezone: "America/Asuncion" },
  { label: "Uruguay",         lat: -34.9011, lon: -56.1645, flag: "🇺🇾", timezone: "America/Montevideo" },
  { label: "Cuba",            lat: 23.1136,  lon: -82.3666, flag: "🇨🇺", timezone: "America/Havana" },
  { label: "Dominican Rep.",  lat: 18.4861,  lon: -69.9312, flag: "🇩🇴", timezone: "America/Santo_Domingo" },
  { label: "Guatemala",       lat: 14.6349,  lon: -90.5069, flag: "🇬🇹", timezone: "America/Guatemala" },
  { label: "Honduras",        lat: 14.0818,  lon: -87.2068, flag: "🇭🇳", timezone: "America/Tegucigalpa" },
  { label: "El Salvador",     lat: 13.6929,  lon: -89.2182, flag: "🇸🇻", timezone: "America/El_Salvador" },
  { label: "Nicaragua",       lat: 12.1364,  lon: -86.2514, flag: "🇳🇮", timezone: "America/Managua" },
  { label: "Costa Rica",      lat:  9.9281,  lon: -84.0907, flag: "🇨🇷", timezone: "America/Costa_Rica" },
  { label: "Panama",          lat:  8.9943,  lon: -79.5188, flag: "🇵🇦", timezone: "America/Panama" },
  { label: "Jamaica",         lat: 17.9970,  lon: -76.7936, flag: "🇯🇲", timezone: "America/Jamaica" },
  { label: "Trinidad",        lat: 10.6596,  lon: -61.5086, flag: "🇹🇹", timezone: "America/Port_of_Spain" },

  // Africa
  { label: "Nigeria",         lat:  9.0765,  lon:   7.3986, flag: "🇳🇬", timezone: "Africa/Lagos" },
  { label: "Egypt",           lat: 30.0444,  lon:  31.2357, flag: "🇪🇬", timezone: "Africa/Cairo" },
  { label: "South Africa",    lat: -25.7479, lon:  28.2293, flag: "🇿🇦", timezone: "Africa/Johannesburg" },
  { label: "Kenya",           lat: -1.2921,  lon:  36.8219, flag: "🇰🇪", timezone: "Africa/Nairobi" },
  { label: "Ethiopia",        lat:  9.0320,  lon:  38.7468, flag: "🇪🇹", timezone: "Africa/Addis_Ababa" },
  { label: "Tanzania",        lat: -6.7924,  lon:  39.2083, flag: "🇹🇿", timezone: "Africa/Dar_es_Salaam" },
  { label: "Ghana",           lat:  5.6037,  lon:  -0.1870, flag: "🇬🇭", timezone: "Africa/Accra" },
  { label: "Algeria",         lat: 36.7372,  lon:   3.0865, flag: "🇩🇿", timezone: "Africa/Algiers" },
  { label: "Morocco",         lat: 34.0209,  lon:  -6.8416, flag: "🇲🇦", timezone: "Africa/Casablanca" },
  { label: "Tunisia",         lat: 36.8190,  lon:  10.1658, flag: "🇹🇳", timezone: "Africa/Tunis" },
  { label: "Libya",           lat: 32.8872,  lon:  13.1913, flag: "🇱🇾", timezone: "Africa/Tripoli" },
  { label: "Sudan",           lat: 15.5007,  lon:  32.5599, flag: "🇸🇩", timezone: "Africa/Khartoum" },
  { label: "Angola",          lat: -8.8368,  lon:  13.2343, flag: "🇦🇴", timezone: "Africa/Luanda" },
  { label: "Mozambique",      lat: -25.9664, lon:  32.5892, flag: "🇲🇿", timezone: "Africa/Maputo" },
  { label: "Uganda",          lat:  0.3476,  lon:  32.5825, flag: "🇺🇬", timezone: "Africa/Kampala" },
  { label: "Cameroon",        lat:  3.8480,  lon:  11.5021, flag: "🇨🇲", timezone: "Africa/Douala" },
  { label: "Ivory Coast",     lat:  5.3599,  lon:  -4.0082, flag: "🇨🇮", timezone: "Africa/Abidjan" },
  { label: "Senegal",         lat: 14.7167,  lon: -17.4677, flag: "🇸🇳", timezone: "Africa/Dakar" },
  { label: "Zimbabwe",        lat: -17.8292, lon:  31.0522, flag: "🇿🇼", timezone: "Africa/Harare" },
  { label: "Zambia",          lat: -15.4166, lon:  28.2833, flag: "🇿🇲", timezone: "Africa/Lusaka" },
  { label: "Somalia",         lat:  2.0469,  lon:  45.3182, flag: "🇸🇴", timezone: "Africa/Mogadishu" },
  { label: "Botswana",        lat: -24.6282, lon:  25.9231, flag: "🇧🇼", timezone: "Africa/Gaborone" },
  { label: "Namibia",         lat: -22.5609, lon:  17.0658, flag: "🇳🇦", timezone: "Africa/Windhoek" },
  { label: "Rwanda",          lat: -1.9415,  lon:  29.8739, flag: "🇷🇼", timezone: "Africa/Kigali" },
  { label: "Madagascar",      lat: -18.9249, lon:  47.5185, flag: "🇲🇬", timezone: "Indian/Antananarivo" },

  // Oceania
  { label: "Australia",       lat: -35.2809, lon: 149.1300, flag: "🇦🇺", timezone: "Australia/Sydney" },
  { label: "New Zealand",     lat: -41.2866, lon: 174.7756, flag: "🇳🇿", timezone: "Pacific/Auckland" },
  { label: "Papua New Guinea",lat: -9.4438,  lon: 147.1803, flag: "🇵🇬", timezone: "Pacific/Port_Moresby" },
  { label: "Fiji",            lat: -18.1416, lon: 178.4419, flag: "🇫🇯", timezone: "Pacific/Fiji" },
];

const DEFAULT_LOCATION: AppLocation = {
  lat: 28.6139,
  lon: 77.2090,
  label: "New Delhi, India",
  source: "default",
  timezone: "Asia/Kolkata",
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
    // Check if geolocation API is even available
    if (!navigator.geolocation) {
      setLocationError("GPS not available on this device. Please select a country below.");
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false, // Use network-based first for faster response in PWAs
          timeout: 15000,
          maximumAge: 120000,
        })
      );
      const { latitude: lat, longitude: lon } = pos.coords;

      // Reverse geocode for a nice label
      let label = `${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E`;
      try {
        const r = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
          { signal: AbortSignal.timeout(8000) }
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
      } catch { /* ignore geocoding error, use coordinates */ }

      setLocation({ lat, lon, label, source: "gps" });
    } catch (e) {
      const err = e as GeolocationPositionError;
      if (err.code === 1) {
        setLocationError("Location permission denied. Please select a country from the list below.");
      } else if (err.code === 2) {
        setLocationError("Location unavailable. Please select a country from the list below.");
      } else {
        setLocationError("Location request timed out. Please select a country from the list below.");
      }
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
