"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface GeoState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  isTracking: boolean;
  error: string | null;
}

interface UseGeolocationOptions {
  driverId: string;
  enabled?: boolean;
  intervalMs?: number;
}

const DEFAULT_INTERVAL = 10_000;

export function useGeolocation({
  driverId,
  enabled = false,
  intervalMs = DEFAULT_INTERVAL,
}: UseGeolocationOptions) {
  const [state, setState] = useState<GeoState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    isTracking: false,
    error: null,
  });

  const watchIdRef = useRef<number | null>(null);
  const sendTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastCoordsRef = useRef<{ lat: number; lng: number } | null>(null);
  const driverIdRef = useRef(driverId);
  driverIdRef.current = driverId;

  const sendLocation = useCallback(async () => {
    const coords = lastCoordsRef.current;
    if (!coords) return;
    try {
      const token = (() => {
        try {
          const stored = JSON.parse(localStorage.getItem("ds_auth") || "{}");
          return stored.accessToken || null;
        } catch {
          return null;
        }
      })();
      if (!token) return;

      await fetch(`/api/drivers/${driverIdRef.current}/location`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          latitude: coords.lat,
          longitude: coords.lng,
        }),
      });
    } catch {
      // Silent fail — don't block driver UI on network issues
    }
  }, []);

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setState((prev) => ({ ...prev, error: "Geolocation not supported", isTracking: false }));
      return;
    }

    setState((prev) => ({ ...prev, isTracking: true, error: null }));

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        lastCoordsRef.current = { lat: latitude, lng: longitude };
        setState({
          latitude,
          longitude,
          accuracy,
          isTracking: true,
          error: null,
        });
      },
      (err) => {
        let msg = "Location permission denied";
        if (err.code === 2) msg = "Location unavailable";
        else if (err.code === 3) msg = "Location request timed out";
        setState((prev) => ({ ...prev, error: msg, isTracking: false }));
      },
      {
        enableHighAccuracy: true,
        timeout: 10_000,
        maximumAge: 5_000,
      }
    );

    // Send location periodically
    sendLocation(); // send immediately
    sendTimerRef.current = setInterval(sendLocation, intervalMs);
  }, [intervalMs, sendLocation]);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (sendTimerRef.current) {
      clearInterval(sendTimerRef.current);
      sendTimerRef.current = null;
    }
    setState((prev) => ({ ...prev, isTracking: false }));
  }, []);

  // Auto-start if enabled
  useEffect(() => {
    if (enabled) startTracking();
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
      if (sendTimerRef.current) clearInterval(sendTimerRef.current);
    };
  }, [enabled, startTracking]);

  return {
    ...state,
    startTracking,
    stopTracking,
  };
}
