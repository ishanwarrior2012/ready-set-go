import { useState, useEffect, useCallback } from "react";

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  altitude: number | null;
  altitudeAccuracy: number | null;
  heading: number | null;
  speed: number | null;
  timestamp: number | null;
  error: string | null;
  loading: boolean;
}

interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  watch?: boolean;
}

const defaultOptions: UseGeolocationOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 60000,
  watch: false,
};

export function useGeolocation(options: UseGeolocationOptions = {}) {
  const mergedOptions = { ...defaultOptions, ...options };
  
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    altitude: null,
    altitudeAccuracy: null,
    heading: null,
    speed: null,
    timestamp: null,
    error: null,
    loading: false,
  });

  const onSuccess = useCallback((position: GeolocationPosition) => {
    setState({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      altitude: position.coords.altitude,
      altitudeAccuracy: position.coords.altitudeAccuracy,
      heading: position.coords.heading,
      speed: position.coords.speed,
      timestamp: position.timestamp,
      error: null,
      loading: false,
    });
  }, []);

  const onError = useCallback((error: GeolocationPositionError) => {
    let errorMessage: string;
    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = "Location permission denied";
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = "Location information unavailable";
        break;
      case error.TIMEOUT:
        errorMessage = "Location request timed out";
        break;
      default:
        errorMessage = "An unknown error occurred";
    }
    setState((prev) => ({ ...prev, error: errorMessage, loading: false }));
  }, []);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState((prev) => ({
        ...prev,
        error: "Geolocation is not supported by your browser",
        loading: false,
      }));
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(onSuccess, onError, {
      enableHighAccuracy: mergedOptions.enableHighAccuracy,
      timeout: mergedOptions.timeout,
      maximumAge: mergedOptions.maximumAge,
    });
  }, [mergedOptions.enableHighAccuracy, mergedOptions.timeout, mergedOptions.maximumAge, onSuccess, onError]);

  useEffect(() => {
    if (!mergedOptions.watch) return;

    if (!navigator.geolocation) {
      setState((prev) => ({
        ...prev,
        error: "Geolocation is not supported by your browser",
      }));
      return;
    }

    setState((prev) => ({ ...prev, loading: true }));

    const watchId = navigator.geolocation.watchPosition(onSuccess, onError, {
      enableHighAccuracy: mergedOptions.enableHighAccuracy,
      timeout: mergedOptions.timeout,
      maximumAge: mergedOptions.maximumAge,
    });

    return () => navigator.geolocation.clearWatch(watchId);
  }, [mergedOptions.watch, mergedOptions.enableHighAccuracy, mergedOptions.timeout, mergedOptions.maximumAge, onSuccess, onError]);

  return { ...state, requestLocation };
}
