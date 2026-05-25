export type GeoPoint = {
  latitude: number;
  longitude: number;
};

export type GeoAddressSource =
  | string
  | {
      address_text?: string | null;
      label?: string | null;
    };

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

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
  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    throw new Error('Google Maps API key is missing.');
  }

  const candidates = buildGeocodeCandidates(source).filter((value, index, all) => Boolean(value) && all.indexOf(value) === index);

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
