import { useState, useEffect, useCallback, useRef } from "react";

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  error: string | null;
  loading: boolean;
}

const GEO_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10_000,
  maximumAge: 5 * 60 * 1000, // 5 minute cache
};

// Rough bounding box for India
function isInIndia(lat: number, lon: number): boolean {
  return lat >= 6 && lat <= 38 && lon >= 68 && lon <= 98;
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    error: null,
    loading: true,
  });

  const watchIdRef = useRef<number | null>(null);

  const handleSuccess = useCallback((position: GeolocationPosition) => {
    const { latitude, longitude, accuracy } = position.coords;
    setState({
      latitude,
      longitude,
      accuracy,
      error: !isInIndia(latitude, longitude)
        ? "Location appears outside India. Weather data may be inaccurate."
        : null,
      loading: false,
    });
  }, []);

  const handleError = useCallback((error: GeolocationPositionError) => {
    const messages: Record<number, string> = {
      1: "Location permission denied. Please enable in browser settings.",
      2: "Location unavailable. Please check your device settings.",
      3: "Location request timed out. Please try again.",
    };
    setState((prev) => ({
      ...prev,
      error: messages[error.code] || error.message,
      loading: false,
    }));
  }, []);

  const startWatching = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setState((prev) => ({
        ...prev,
        error: "Geolocation not supported in this browser",
        loading: false,
      }));
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    // Use watchPosition for live updates
    watchIdRef.current = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      GEO_OPTIONS
    );
  }, [handleSuccess, handleError]);

  // Retry function: allows re-requesting after permission denial
  const retry = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    startWatching();
  }, [startWatching]);

  useEffect(() => {
    startWatching();
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [startWatching]);

  return { ...state, retry };
}
