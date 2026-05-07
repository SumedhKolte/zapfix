import { useEffect, useState } from 'react';
import * as Location from 'expo-location';

type LocationState = {
  areaName: string;
  isLoading: boolean;
  error: string | null;
};

export const useLocation = () => {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [state, setState] = useState<LocationState>({
    areaName: '',
    isLoading: true,
    error: null
  });

  useEffect(() => {
    const getLocation = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setState({ areaName: '', isLoading: false, error: 'Location permission denied' });
        return;
      }

      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced
      });
      setLocation(current);

      const [place] = await Location.reverseGeocodeAsync({
        latitude: current.coords.latitude,
        longitude: current.coords.longitude
      });

      const areaName = place?.district || place?.city || place?.region || '';
      setState({ areaName, isLoading: false, error: null });
    };

    getLocation();
  }, []);

  return { location, ...state };
};
