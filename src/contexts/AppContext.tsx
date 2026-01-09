import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

interface Location {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: number;
}

interface FavoriteItem {
  id: string;
  type: "flight" | "vessel" | "earthquake" | "volcano" | "radio" | "location";
  name: string;
  data: Record<string, unknown>;
  createdAt: number;
}

interface UserPreferences {
  defaultMapView: "satellite" | "terrain" | "standard";
  units: "metric" | "imperial";
  notifications: {
    earthquakes: boolean;
    volcanoes: boolean;
    weather: boolean;
    flights: boolean;
  };
  autoRefresh: boolean;
  refreshInterval: number; // in seconds
}

interface AppState {
  location: Location | null;
  locationLoading: boolean;
  locationError: string | null;
  favorites: FavoriteItem[];
  preferences: UserPreferences;
  isOffline: boolean;
}

interface AppContextType extends AppState {
  requestLocation: () => Promise<void>;
  addFavorite: (item: Omit<FavoriteItem, "id" | "createdAt">) => void;
  removeFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
  updatePreferences: (prefs: Partial<UserPreferences>) => void;
}

const defaultPreferences: UserPreferences = {
  defaultMapView: "standard",
  units: "metric",
  notifications: {
    earthquakes: true,
    volcanoes: true,
    weather: true,
    flights: false,
  },
  autoRefresh: true,
  refreshInterval: 30,
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useState<Location | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  const [favorites, setFavorites] = useState<FavoriteItem[]>(() => {
    try {
      const stored = localStorage.getItem("safetrack_favorites");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    try {
      const stored = localStorage.getItem("safetrack_preferences");
      return stored ? { ...defaultPreferences, ...JSON.parse(stored) } : defaultPreferences;
    } catch {
      return defaultPreferences;
    }
  });

  // Persist favorites to localStorage
  useEffect(() => {
    localStorage.setItem("safetrack_favorites", JSON.stringify(favorites));
  }, [favorites]);

  // Persist preferences to localStorage
  useEffect(() => {
    localStorage.setItem("safetrack_preferences", JSON.stringify(preferences));
  }, [preferences]);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const requestLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      return;
    }

    setLocationLoading(true);
    setLocationError(null);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        });
      });

      setLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp,
      });
    } catch (error) {
      const geoError = error as GeolocationPositionError;
      switch (geoError.code) {
        case geoError.PERMISSION_DENIED:
          setLocationError("Location permission denied");
          break;
        case geoError.POSITION_UNAVAILABLE:
          setLocationError("Location information unavailable");
          break;
        case geoError.TIMEOUT:
          setLocationError("Location request timed out");
          break;
        default:
          setLocationError("An unknown error occurred");
      }
    } finally {
      setLocationLoading(false);
    }
  }, []);

  const addFavorite = useCallback((item: Omit<FavoriteItem, "id" | "createdAt">) => {
    const newItem: FavoriteItem = {
      ...item,
      id: `${item.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
    };
    setFavorites((prev) => [...prev, newItem]);
  }, []);

  const removeFavorite = useCallback((id: string) => {
    setFavorites((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const isFavorite = useCallback((id: string) => {
    return favorites.some((item) => item.id === id);
  }, [favorites]);

  const updatePreferences = useCallback((prefs: Partial<UserPreferences>) => {
    setPreferences((prev) => ({ ...prev, ...prefs }));
  }, []);

  return (
    <AppContext.Provider
      value={{
        location,
        locationLoading,
        locationError,
        favorites,
        preferences,
        isOffline,
        requestLocation,
        addFavorite,
        removeFavorite,
        isFavorite,
        updatePreferences,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}

export function useUserLocation() {
  const { location, locationLoading, locationError, requestLocation } = useApp();
  return { location, loading: locationLoading, error: locationError, requestLocation };
}

export function useFavorites() {
  const { favorites, addFavorite, removeFavorite, isFavorite } = useApp();
  return { favorites, addFavorite, removeFavorite, isFavorite };
}

export function usePreferences() {
  const { preferences, updatePreferences } = useApp();
  return { preferences, updatePreferences };
}
