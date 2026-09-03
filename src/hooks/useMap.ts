'use client';

export function useMap() {
  const provider = process.env.NEXT_PUBLIC_MAP_PROVIDER || 'leaflet';
  const googleApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;

  return {
    provider,
    isGoogle: provider === 'google',
    hasGoogleKey: !!googleApiKey,
  };
}
