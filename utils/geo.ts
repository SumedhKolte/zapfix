export type GeoPoint = {
  latitude: number;
  longitude: number;
};

// We pack receiver name + landmark into the existing customer_addresses.address_text
// column using stable separators so we don't need a DB migration. These helpers
// keep the encoding/decoding in one place.
const RECEIVER_TAG = '• For: ';
const LANDMARK_TAG = ' (Near: ';

export const composeAddressText = (
  formatted: string,
  landmark?: string,
  receiver?: string
): string => {
  const trimmedAddress = formatted.trim();
  const trimmedLandmark = landmark?.trim() ?? '';
  const trimmedReceiver = receiver?.trim() ?? '';

  let result = trimmedAddress;
  if (trimmedLandmark) result += `${LANDMARK_TAG}${trimmedLandmark})`;
  if (trimmedReceiver) result += ` ${RECEIVER_TAG}${trimmedReceiver}`;
  return result;
};

export type ParsedAddressText = {
  formatted: string;
  landmark: string;
  receiver: string;
};

export const parseAddressText = (
  raw: string | null | undefined
): ParsedAddressText => {
  if (!raw) return { formatted: '', landmark: '', receiver: '' };
  let working = raw;
  let receiver = '';
  const receiverIdx = working.indexOf(RECEIVER_TAG);
  if (receiverIdx >= 0) {
    receiver = working.slice(receiverIdx + RECEIVER_TAG.length).trim();
    working = working.slice(0, receiverIdx).trim();
  }
  let landmark = '';
  const landmarkIdx = working.indexOf(LANDMARK_TAG);
  if (landmarkIdx >= 0) {
    const closeIdx = working.indexOf(')', landmarkIdx);
    if (closeIdx > landmarkIdx) {
      landmark = working.slice(landmarkIdx + LANDMARK_TAG.length, closeIdx).trim();
      working = (working.slice(0, landmarkIdx) + working.slice(closeIdx + 1)).trim();
    }
  }
  return { formatted: working, landmark, receiver };
};

export type GeoAddressSource =
  | string
  | {
      address_text?: string | null;
      label?: string | null;
    };

export type PlaceSuggestion = {
  placeId: string;
  description: string;
  primary: string;
  secondary: string;
};

export type ResolvedPlace = {
  formattedAddress: string;
  coords: GeoPoint;
};

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const getApiKey = () => {
  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    throw new Error('Google Maps API key is missing.');
  }
  return apiKey;
};

export const normalizeGeoPoint = (value: unknown): GeoPoint | null => {
  if (!value) return null;

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed.startsWith('{')) {
      return null;
    }
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      return normalizeGeoPoint(parsed);
    } catch {
      return null;
    }
  }

  if (typeof value === 'object') {
    const obj = value as { latitude?: unknown; longitude?: unknown; coordinates?: unknown; type?: unknown };

    if (isFiniteNumber(obj.latitude) && isFiniteNumber(obj.longitude)) {
      return { latitude: obj.latitude, longitude: obj.longitude };
    }

    if (Array.isArray(obj.coordinates) && obj.coordinates.length >= 2) {
      const [lng, lat] = obj.coordinates;
      if (isFiniteNumber(lat) && isFiniteNumber(lng)) {
        return { latitude: lat, longitude: lng };
      }
    }
  }

  return null;
};

// PostgREST + PostGIS reliably accepts WKT strings for geography columns.
// Pure GeoJSON objects fail with "invalid geometry / parse error within geometry".
export const toWktPoint = (point: GeoPoint): string =>
  `POINT(${point.longitude} ${point.latitude})`;

// Kept for callers that genuinely need GeoJSON (e.g. RPCs or client-side state).
export const toGeoJSONPoint = (point: GeoPoint) => ({
  type: 'Point' as const,
  coordinates: [point.longitude, point.latitude] as [number, number],
});

export const distanceKm = (a: GeoPoint, b: GeoPoint) => {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const earthRadiusKm = 6371;

  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);

  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);

  const h =
    sinDLat * sinDLat +
    Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;

  return 2 * earthRadiusKm * Math.asin(Math.sqrt(h));
};

const buildGeocodeCandidates = (source: GeoAddressSource) => {
  if (typeof source === 'string') {
    const trimmed = source.trim();
    return [trimmed, `${trimmed}, India`].filter(Boolean);
  }

  const label = source.label?.trim() ?? '';
  const addressText = source.address_text?.trim() ?? '';
  const combined = [label, addressText].filter(Boolean).join(', ');

  return [
    combined,
    addressText,
    label ? `${label}, India` : '',
    addressText ? `${addressText}, India` : '',
    combined ? `${combined}, India` : '',
  ].filter(Boolean);
};

export const geocodeAddress = async (source: GeoAddressSource): Promise<GeoPoint> => {
  const apiKey = getApiKey();
  const candidates = buildGeocodeCandidates(source).filter(
    (value, index, all) => Boolean(value) && all.indexOf(value) === index
  );

  for (const candidate of candidates) {
    const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
    url.searchParams.set('address', candidate);
    url.searchParams.set('key', apiKey);
    url.searchParams.set('region', 'in');
    url.searchParams.set('components', 'country:IN');

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error('Could not reach Google Maps.');
    }

    const data = (await response.json()) as {
      status?: string;
      results?: Array<{ geometry?: { location?: { lat?: number; lng?: number } } }>;
    };

    const location = data.results?.[0]?.geometry?.location;
    if (data.status === 'OK' && location && isFiniteNumber(location.lat) && isFiniteNumber(location.lng)) {
      return { latitude: location.lat, longitude: location.lng };
    }
  }

  throw new Error('Could not find that address. Please enter a more specific location.');
};

// Reverse-geocode a point into a human readable address using Google Maps.
export const reverseGeocode = async (point: GeoPoint): Promise<string | null> => {
  const apiKey = getApiKey();
  const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
  url.searchParams.set('latlng', `${point.latitude},${point.longitude}`);
  url.searchParams.set('key', apiKey);
  url.searchParams.set('region', 'in');

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error('Could not reach Google Maps.');
  }

  const data = (await response.json()) as {
    status?: string;
    error_message?: string;
    results?: Array<{ formatted_address?: string }>;
  };

  if (data.status === 'OK' && data.results?.[0]?.formatted_address) {
    return data.results[0].formatted_address;
  }

  // Surface the actual Google error so we don't silently swallow API setup
  // issues (Geocoding API not enabled, key restrictions, billing disabled).
  if (data.status === 'ZERO_RESULTS') {
    return null;
  }
  if (data.status && data.status !== 'OK') {
    const detail = data.error_message ? ` ${data.error_message}` : '';
    throw new Error(`Google Maps: ${data.status}.${detail}`);
  }
  return null;
};

// Generate a session token for Places Autocomplete billing.
export const createPlacesSessionToken = () => {
  const random = () => Math.random().toString(36).slice(2);
  return `${random()}${random()}${Date.now().toString(36)}`;
};

// Query Google Places Autocomplete. Biases to India and (optionally) nearby a point.
export const fetchPlaceSuggestions = async (
  input: string,
  options?: { sessionToken?: string; near?: GeoPoint; radiusM?: number }
): Promise<PlaceSuggestion[]> => {
  const trimmed = input.trim();
  if (trimmed.length < 3) return [];

  const apiKey = getApiKey();
  const url = new URL('https://maps.googleapis.com/maps/api/place/autocomplete/json');
  url.searchParams.set('input', trimmed);
  url.searchParams.set('key', apiKey);
  url.searchParams.set('components', 'country:in');
  url.searchParams.set('language', 'en');
  if (options?.sessionToken) {
    url.searchParams.set('sessiontoken', options.sessionToken);
  }
  if (options?.near) {
    url.searchParams.set('location', `${options.near.latitude},${options.near.longitude}`);
    url.searchParams.set('radius', String(options.radiusM ?? 50000));
  }

  const response = await fetch(url.toString());
  if (!response.ok) {
    console.warn('[Places] HTTP error', response.status);
    return [];
  }

  const data = (await response.json()) as {
    status?: string;
    error_message?: string;
    predictions?: Array<{
      place_id?: string;
      description?: string;
      structured_formatting?: { main_text?: string; secondary_text?: string };
    }>;
  };

  if (data.status === 'ZERO_RESULTS') return [];
  if (data.status !== 'OK') {
    // Make the underlying problem (API not enabled, key restriction, billing)
    // visible in the logs so we can fix the GCP setup instead of guessing.
    console.warn('[Places] API error', data.status, data.error_message);
    return [];
  }
  if (!data.predictions) return [];

  return data.predictions
    .filter((prediction) => prediction.place_id && prediction.description)
    .map((prediction) => ({
      placeId: prediction.place_id ?? '',
      description: prediction.description ?? '',
      primary: prediction.structured_formatting?.main_text ?? prediction.description ?? '',
      secondary: prediction.structured_formatting?.secondary_text ?? '',
    }));
};

// Resolve a placeId into a formatted address + coordinates.
export const resolvePlaceDetails = async (
  placeId: string,
  sessionToken?: string
): Promise<ResolvedPlace> => {
  const apiKey = getApiKey();
  const url = new URL('https://maps.googleapis.com/maps/api/place/details/json');
  url.searchParams.set('place_id', placeId);
  url.searchParams.set('key', apiKey);
  url.searchParams.set('fields', 'formatted_address,geometry/location,name');
  if (sessionToken) {
    url.searchParams.set('sessiontoken', sessionToken);
  }

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error('Could not reach Google Maps.');
  }

  const data = (await response.json()) as {
    status?: string;
    result?: {
      formatted_address?: string;
      name?: string;
      geometry?: { location?: { lat?: number; lng?: number } };
    };
  };

  const loc = data.result?.geometry?.location;
  if (data.status !== 'OK' || !loc || !isFiniteNumber(loc.lat) || !isFiniteNumber(loc.lng)) {
    throw new Error('Could not load that place. Please pick another suggestion.');
  }

  const formatted = data.result?.formatted_address ?? data.result?.name ?? '';
  return {
    formattedAddress: formatted,
    coords: { latitude: loc.lat, longitude: loc.lng },
  };
};
