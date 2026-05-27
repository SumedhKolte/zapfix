import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import * as Location from 'expo-location';
import MapView, { Marker, PROVIDER_GOOGLE, type Region } from 'react-native-maps';

import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import {
  composeAddressText,
  createPlacesSessionToken,
  fetchPlaceSuggestions,
  normalizeGeoPoint,
  parseAddressText,
  resolvePlaceDetails,
  reverseGeocode,
  toWktPoint,
  type GeoPoint,
  type PlaceSuggestion,
} from '@/utils/geo';
import type { Tables } from '@/types/database';

const Theme = {
  navy: '#0F2057',
  navyMid: '#1A3580',
  amber: '#F5B800',
  violet: '#7C6BFF',
  violetLight: '#EFECFF',
  cream: '#F7F5F0',
  creamCard: '#FFFFFF',
  textDark: '#0A0F1E',
  textMid: '#4A5578',
  textLight: '#8E97B5',
  border: '#E2E6F0',
  white: '#FFFFFF',
  error: '#C23232',
  success: '#1A7A4A',
};

type AddressRow = Tables<'customer_addresses'>;
type Mode = 'list' | 'pickLocation' | 'enterDetails';

const ADDRESS_TYPES = [
  { key: 'Home', icon: 'home' as const },
  { key: 'Office', icon: 'briefcase' as const },
  { key: "Friend's House", icon: 'people' as const },
];

const iconForLabel = (label?: string | null): keyof typeof Ionicons.glyphMap => {
  const norm = (label ?? '').toLowerCase();
  if (norm.includes('home')) return 'home';
  if (norm.includes('office') || norm.includes('work')) return 'briefcase';
  if (norm.includes('friend') || norm.includes('house')) return 'people';
  return 'location';
};

const FALLBACK_REGION: Region = {
  // Reasonable default centred on India (Delhi) when we have no other signal.
  latitude: 28.6139,
  longitude: 77.209,
  latitudeDelta: 0.2,
  longitudeDelta: 0.2,
};

export default function Addresses() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const { addressesQuery } = useProfile(profile?.id ?? '');

  const [mode, setMode] = useState<Mode>('list');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Map-picker step
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [resolvedAddress, setResolvedAddress] = useState('');
  const [resolvedCoords, setResolvedCoords] = useState<GeoPoint | null>(null);
  const [refining, setRefining] = useState(false);
  const [usingCurrentLocation, setUsingCurrentLocation] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  // Details step
  const [selectedType, setSelectedType] = useState<string>('Home');
  const [customType, setCustomType] = useState('');
  const [showCustomType, setShowCustomType] = useState(false);
  const [receiverName, setReceiverName] = useState('');
  const [completeAddress, setCompleteAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [makeDefault, setMakeDefault] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const sessionTokenRef = useRef<string>(createPlacesSessionToken());
  const searchSeqRef = useRef(0);
  const mapRef = useRef<MapView | null>(null);
  const lastPinChangeRef = useRef<number>(0);
  const isMountedRef = useRef(true);

  const addresses = useMemo(() => addressesQuery.data ?? [], [addressesQuery.data]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Prefill receiver name from profile so the most common case is one tap.
  useEffect(() => {
    if (!receiverName && profile?.full_name) {
      setReceiverName(profile.full_name);
    }
  }, [profile?.full_name]);

  const resetPickerState = () => {
    setSearchQuery('');
    setSuggestions([]);
    setResolvedAddress('');
    setResolvedCoords(null);
    setRefining(false);
    setMapError(null);
    sessionTokenRef.current = createPlacesSessionToken();
  };

  const resetDetailsState = () => {
    setSelectedType('Home');
    setCustomType('');
    setShowCustomType(false);
    setReceiverName(profile?.full_name ?? '');
    setCompleteAddress('');
    setLandmark('');
    setMakeDefault(false);
    setFormError(null);
  };

  const resetAll = () => {
    setEditingId(null);
    resetPickerState();
    resetDetailsState();
    setMode('list');
  };

  // Debounced autocomplete (Places).
  useEffect(() => {
    if (mode !== 'pickLocation') return;
    if (resolvedAddress) {
      setSuggestions([]);
      return;
    }
    const query = searchQuery.trim();
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    const seq = ++searchSeqRef.current;
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const results = await fetchPlaceSuggestions(query, {
          sessionToken: sessionTokenRef.current,
        });
        if (seq === searchSeqRef.current && isMountedRef.current) setSuggestions(results);
      } catch {
        if (seq === searchSeqRef.current && isMountedRef.current) setSuggestions([]);
      } finally {
        if (seq === searchSeqRef.current && isMountedRef.current) setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, resolvedAddress, mode]);

  const animateMapTo = (coords: GeoPoint) => {
    if (!mapRef.current) return;
    mapRef.current.animateToRegion(
      {
        latitude: coords.latitude,
        longitude: coords.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      },
      350
    );
  };

  const handlePickSuggestion = async (suggestion: PlaceSuggestion) => {
    setSearching(true);
    setMapError(null);
    try {
      const place = await resolvePlaceDetails(suggestion.placeId, sessionTokenRef.current);
      if (!isMountedRef.current) return;
      sessionTokenRef.current = createPlacesSessionToken();
      const display = place.formattedAddress || suggestion.description;
      setResolvedAddress(display);
      setResolvedCoords(place.coords);
      setSearchQuery(display);
      setSuggestions([]);
      animateMapTo(place.coords);
    } catch (err) {
      if (!isMountedRef.current) return;
      setMapError(err instanceof Error ? err.message : 'Could not load that place.');
    } finally {
      if (isMountedRef.current) setSearching(false);
    }
  };

  // When the map region settles, snap to that point and refresh the formatted
  // address. Throttled to avoid hammering the Geocoding API while panning.
  const handlePinChange = async (coords: GeoPoint) => {
    setResolvedCoords(coords);
    const stamp = Date.now();
    lastPinChangeRef.current = stamp;
    setRefining(true);
    try {
      // Tiny debounce so we don't reverse-geocode mid-pan.
      await new Promise((resolve) => setTimeout(resolve, 250));
      if (lastPinChangeRef.current !== stamp || !isMountedRef.current) return;

      const formatted = await reverseGeocode(coords);
      if (lastPinChangeRef.current !== stamp || !isMountedRef.current) return;

      if (formatted) {
        setResolvedAddress(formatted);
        setSearchQuery(formatted);
        setMapError(null);
      } else {
        // We refuse to fall back to lat/long in the visible UI — better to
        // surface a clear hint to the user instead.
        setMapError('Could not fetch address for that point. Move the pin or search instead.');
      }
    } catch (err) {
      if (isMountedRef.current) setMapError(err instanceof Error ? err.message : 'Could not fetch the address.');
    } finally {
      if (lastPinChangeRef.current === stamp && isMountedRef.current) setRefining(false);
    }
  };

  const handleUseCurrentLocation = async () => {
    setUsingCurrentLocation(true);
    setMapError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (!isMountedRef.current) return;
      if (status !== 'granted') {
        if (isMountedRef.current) setMapError('Allow location access in Settings to use your current location.');
        return;
      }

      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      if (!isMountedRef.current) return;
      const coords: GeoPoint = {
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
      };
      setResolvedCoords(coords);
      animateMapTo(coords);
      await handlePinChange(coords);
    } catch (err) {
      if (isMountedRef.current) setMapError(err instanceof Error ? err.message : 'Could not get your current location.');
    } finally {
      if (isMountedRef.current) setUsingCurrentLocation(false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setResolvedAddress('');
    setSuggestions([]);
  };

  const beginAdd = () => {
    setEditingId(null);
    resetPickerState();
    resetDetailsState();
    setMode('pickLocation');
  };

  const beginEdit = (address: AddressRow) => {
    setEditingId(address.id);
    resetPickerState();

    // Preload location from saved row if available.
    const existing = normalizeGeoPoint(address.location);
    setResolvedCoords(existing);
    const parsed = parseAddressText(address.address_text);
    setResolvedAddress(parsed.formatted);
    setSearchQuery(parsed.formatted);

    setSelectedType(address.label ?? 'Home');
    setShowCustomType(!ADDRESS_TYPES.find((t) => t.key === address.label) && Boolean(address.label));
    setCustomType(
      !ADDRESS_TYPES.find((t) => t.key === address.label) ? address.label ?? '' : ''
    );
    setReceiverName(parsed.receiver || profile?.full_name || '');
    setCompleteAddress(parsed.formatted);
    setLandmark(parsed.landmark);
    setMakeDefault(Boolean(address.is_default));
    setMode('pickLocation');
  };

  const handleConfirmLocation = () => {
    if (!resolvedCoords || !resolvedAddress) {
      setMapError('Move the pin to your service location first.');
      return;
    }
    setCompleteAddress(resolvedAddress);
    setMapError(null);
    setMode('enterDetails');
  };

  const setDefaultAddress = async (addressId: string) => {
    if (!profile?.id) return;
    await supabase
      .from('customer_addresses')
      .update({ is_default: false })
      .eq('customer_id', profile.id)
      .neq('id', addressId);

    await supabase
      .from('customer_addresses')
      .update({ is_default: true })
      .eq('id', addressId);
  };

  const handleDelete = (address: AddressRow) => {
    Alert.alert('Delete address', 'Are you sure you want to delete this address?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (!profile?.id) return;

          const { error: detachError } = await supabase
            .from('jobs')
            .update({ address_id: null })
            .eq('address_id', address.id)
            .eq('customer_id', profile.id);

          if (detachError) {
            Alert.alert('Could not delete', detachError.message);
            return;
          }

          const { error: deleteError } = await supabase
            .from('customer_addresses')
            .delete()
            .eq('id', address.id);
          if (deleteError) {
            Alert.alert('Could not delete', deleteError.message);
            return;
          }

          if (address.is_default) {
            const remaining = addresses.filter((a) => a.id !== address.id);
            const fallback = remaining[0];
            if (fallback) await setDefaultAddress(fallback.id);
          }
          await queryClient.invalidateQueries({ queryKey: ['addresses', profile.id] });
          await queryClient.invalidateQueries({ queryKey: ['jobs'] });
        },
      },
    ]);
  };

  const handleMakeDefault = async (address: AddressRow) => {
    if (!profile?.id) return;
    await setDefaultAddress(address.id);
    await queryClient.invalidateQueries({ queryKey: ['addresses', profile.id] });
  };

  const handleSave = async () => {
    if (!profile?.id) return;
    if (!resolvedCoords) {
      setFormError('Pin a location on the map first.');
      return;
    }
    const finalType =
      showCustomType && customType.trim()
        ? customType.trim()
        : selectedType.trim();
    if (!finalType) {
      setFormError('Pick an address type or add a custom one.');
      return;
    }
    const trimmedAddress = (completeAddress || resolvedAddress).trim();
    if (trimmedAddress.length < 6) {
      setFormError('Complete address is too short.');
      return;
    }
    if (!receiverName.trim()) {
      setFormError("Please enter the receiver's name.");
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      const location = toWktPoint(resolvedCoords);
      const composed = composeAddressText(trimmedAddress, landmark, receiverName);

      if (editingId) {
        const { data, error: updateError } = await supabase
          .from('customer_addresses')
          .update({
            label: finalType,
            address_text: composed,
            is_default: makeDefault,
            location,
          })
          .eq('id', editingId)
          .select('*')
          .single();

        if (updateError) throw updateError;
        if (makeDefault && data?.id) await setDefaultAddress(data.id);
      } else {
        const shouldBeDefault = makeDefault || addresses.length === 0;
        const { data, error: insertError } = await supabase
          .from('customer_addresses')
          .insert({
            customer_id: profile.id,
            label: finalType,
            address_text: composed,
            is_default: shouldBeDefault,
            location,
          })
          .select('*')
          .single();

        if (insertError) throw insertError;
        if (shouldBeDefault && data?.id) await setDefaultAddress(data.id);
      }

      if (!isMountedRef.current) return;
      await queryClient.invalidateQueries({ queryKey: ['addresses', profile.id] });
      resetAll();
    } catch (err) {
      if (isMountedRef.current) {
        setFormError(
          err instanceof Error ? err.message : 'Could not save your address. Please try again.'
        );
      }
    } finally {
      if (isMountedRef.current) setSaving(false);
    }
  };

  // ---------- Render helpers ----------

  const renderHeader = (title: string, onBack: () => void) => (
    <LinearGradient
      colors={[Theme.navy, Theme.navyMid]}
      style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 22 }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Pressable
          onPress={onBack}
          style={{
            width: 38,
            height: 38,
            borderRadius: 19,
            backgroundColor: 'rgba(255,255,255,0.12)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="arrow-back" size={20} color={Theme.white} />
        </Pressable>
        <Text style={{ color: Theme.white, fontSize: 18, fontWeight: '800', flex: 1 }}>
          {title}
        </Text>
      </View>
    </LinearGradient>
  );

  const renderListMode = () => (
    <>
      {renderHeader('Addresses', () => router.back())}
      <ScrollView contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 16 }}>
        <Pressable
          onPress={beginAdd}
          style={{
            marginTop: 16,
            backgroundColor: Theme.violetLight,
            borderRadius: 16,
            paddingVertical: 14,
            paddingHorizontal: 16,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <Ionicons name="add" size={22} color={Theme.violet} />
          <Text style={{ color: Theme.violet, fontWeight: '800', fontSize: 14 }}>
            Add New Address
          </Text>
        </Pressable>

        <View style={{ height: 14 }} />

        {addresses.length === 0 ? (
          <View
            style={{
              backgroundColor: Theme.creamCard,
              borderRadius: 18,
              padding: 24,
              borderWidth: 1,
              borderStyle: 'dashed',
              borderColor: Theme.border,
              alignItems: 'center',
            }}
          >
            <Ionicons name="location-outline" size={36} color={Theme.textLight} />
            <Text style={{ color: Theme.textMid, fontWeight: '700', marginTop: 10, fontSize: 15 }}>
              No addresses yet
            </Text>
            <Text style={{ color: Theme.textLight, fontSize: 12, marginTop: 4, textAlign: 'center' }}>
              Add a location so a Pro knows where to come.
            </Text>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            {addresses.map((address) => {
              const parsed = parseAddressText(address.address_text);
              const icon = iconForLabel(address.label);
              return (
                <View
                  key={address.id}
                  style={{
                    backgroundColor: Theme.creamCard,
                    borderRadius: 18,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: address.is_default ? Theme.violet : Theme.border,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 12,
                        backgroundColor: Theme.violetLight,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 12,
                      }}
                    >
                      <Ionicons name={icon} size={20} color={Theme.violet} />
                    </View>

                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={{ fontSize: 15, fontWeight: '800', color: Theme.textDark }}>
                          {address.label ?? 'Address'}
                        </Text>
                        {address.is_default ? (
                          <View
                            style={{
                              width: 22,
                              height: 22,
                              borderRadius: 11,
                              backgroundColor: Theme.violet,
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Ionicons name="checkmark" size={14} color={Theme.white} />
                          </View>
                        ) : null}
                      </View>

                      <Text
                        style={{ color: Theme.textMid, fontSize: 12, marginTop: 6, lineHeight: 18 }}
                        numberOfLines={2}
                      >
                        {parsed.formatted || address.address_text || 'No address details'}
                      </Text>

                      {profile?.phone_number ? (
                        <Text style={{ color: Theme.textMid, fontSize: 12, marginTop: 4 }}>
                          {profile.phone_number}
                        </Text>
                      ) : null}

                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 12 }}>
                        <Pressable onPress={() => beginEdit(address)} hitSlop={8}>
                          <Text style={{ color: Theme.violet, fontSize: 12, fontWeight: '700' }}>
                            Edit
                          </Text>
                        </Pressable>
                        {!address.is_default ? (
                          <Pressable onPress={() => handleMakeDefault(address)} hitSlop={8}>
                            <Text style={{ color: Theme.violet, fontSize: 12, fontWeight: '700' }}>
                              Set as default
                            </Text>
                          </Pressable>
                        ) : null}
                        <Pressable
                          onPress={() => handleDelete(address)}
                          hitSlop={8}
                          style={{ marginLeft: 'auto' }}
                        >
                          <Text style={{ color: Theme.error, fontSize: 12, fontWeight: '700' }}>
                            Delete
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </>
  );

  const initialRegion: Region = useMemo(() => {
    if (resolvedCoords) {
      return {
        latitude: resolvedCoords.latitude,
        longitude: resolvedCoords.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      };
    }
    return FALLBACK_REGION;
  }, [resolvedCoords]);

  const renderPickLocationMode = () => (
    <View style={{ flex: 1, backgroundColor: Theme.white }}>
      {/* Search bar overlay */}
      <SafeAreaView edges={['top']} style={{ backgroundColor: Theme.white }}>
        <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 10 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              borderRadius: 24,
              backgroundColor: Theme.white,
              paddingHorizontal: 12,
              paddingVertical: 8,
              shadowColor: '#000',
              shadowOpacity: 0.1,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 2 },
              elevation: 3,
              borderWidth: 1,
              borderColor: Theme.border,
            }}
          >
            <Pressable onPress={resetAll} hitSlop={8}>
              <Ionicons name="arrow-back" size={20} color={Theme.textDark} />
            </Pressable>
            <Ionicons name="search" size={16} color={Theme.textLight} style={{ marginLeft: 10 }} />
            <TextInput
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                if (resolvedAddress && text !== resolvedAddress) {
                  setResolvedAddress('');
                }
              }}
              placeholder="Search for delivery area"
              placeholderTextColor={Theme.textLight}
              style={{
                flex: 1,
                marginLeft: 8,
                fontSize: 14,
                color: Theme.textDark,
                paddingVertical: 4,
              }}
            />
            {searching ? <ActivityIndicator color={Theme.violet} size="small" /> : null}
            {searchQuery.length > 0 ? (
              <Pressable onPress={handleClearSearch} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color={Theme.textLight} />
              </Pressable>
            ) : null}
          </View>

          {suggestions.length > 0 ? (
            <View
              style={{
                marginTop: 8,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: Theme.border,
                backgroundColor: Theme.white,
                overflow: 'hidden',
                maxHeight: 240,
                shadowColor: '#000',
                shadowOpacity: 0.06,
                shadowRadius: 6,
                shadowOffset: { width: 0, height: 2 },
                elevation: 2,
              }}
            >
              <ScrollView keyboardShouldPersistTaps="handled">
                {suggestions.map((suggestion, index) => (
                  <Pressable
                    key={suggestion.placeId}
                    onPress={() => handlePickSuggestion(suggestion)}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 12,
                      borderTopWidth: index === 0 ? 0 : 1,
                      borderTopColor: Theme.border,
                      flexDirection: 'row',
                      gap: 10,
                    }}
                  >
                    <Ionicons name="location-outline" size={16} color={Theme.violet} style={{ marginTop: 2 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: Theme.textDark, fontSize: 13, fontWeight: '700' }} numberOfLines={1}>
                        {suggestion.primary}
                      </Text>
                      {suggestion.secondary ? (
                        <Text style={{ color: Theme.textMid, fontSize: 11, marginTop: 2 }} numberOfLines={1}>
                          {suggestion.secondary}
                        </Text>
                      ) : null}
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          ) : null}
        </View>
      </SafeAreaView>

      {/* Map fills the screen between search and bottom card */}
      <View style={{ flex: 1, position: 'relative' }}>
        <MapView
          ref={(ref) => {
            mapRef.current = ref;
          }}
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
          style={{ flex: 1 }}
          initialRegion={initialRegion}
          showsUserLocation
          showsMyLocationButton={false}
          onRegionChangeComplete={(region: Region) => {
            const next = { latitude: region.latitude, longitude: region.longitude };
            if (
              !resolvedCoords ||
              Math.abs(next.latitude - resolvedCoords.latitude) > 0.00005 ||
              Math.abs(next.longitude - resolvedCoords.longitude) > 0.00005
            ) {
              handlePinChange(next);
            }
          }}
        >
          {resolvedCoords ? (
            <Marker
              coordinate={resolvedCoords}
              draggable
              onDragEnd={(event) => handlePinChange(event.nativeEvent.coordinate)}
            />
          ) : null}
        </MapView>

        {/* Center "move pin" hint + pin overlay */}
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: '50%',
            left: 0,
            right: 0,
            alignItems: 'center',
            marginTop: -64,
          }}
        >
          <View
            style={{
              backgroundColor: Theme.textDark,
              borderRadius: 14,
              paddingHorizontal: 12,
              paddingVertical: 7,
              marginBottom: 4,
            }}
          >
            <Text style={{ color: Theme.white, fontSize: 11, fontWeight: '700' }}>
              Move pin to set your exact location
            </Text>
          </View>
          <Ionicons name="location" size={36} color={Theme.violet} />
        </View>

        {/* Locate-me FAB */}
        <Pressable
          onPress={handleUseCurrentLocation}
          disabled={usingCurrentLocation}
          style={{
            position: 'absolute',
            right: 16,
            bottom: 24,
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: Theme.white,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOpacity: 0.12,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 2 },
            elevation: 3,
          }}
        >
          {usingCurrentLocation ? (
            <ActivityIndicator color={Theme.violet} />
          ) : (
            <Ionicons name="locate" size={20} color={Theme.violet} />
          )}
        </Pressable>

        {refining ? (
          <View
            style={{
              position: 'absolute',
              top: 8,
              alignSelf: 'center',
              backgroundColor: 'rgba(15,32,87,0.85)',
              borderRadius: 10,
              paddingHorizontal: 10,
              paddingVertical: 6,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <ActivityIndicator size="small" color={Theme.white} />
            <Text style={{ color: Theme.white, fontSize: 11, fontWeight: '600' }}>
              Fetching address…
            </Text>
          </View>
        ) : null}
      </View>

      {/* Bottom confirmation card */}
      <View
        style={{
          backgroundColor: Theme.white,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 24,
          shadowColor: '#000',
          shadowOpacity: 0.1,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: -4 },
          elevation: 6,
        }}
      >
        <Text style={{ fontSize: 12, fontWeight: '700', color: Theme.textMid }}>
          Confirm your service address
        </Text>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            marginTop: 10,
            gap: 12,
          }}
        >
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 12,
              backgroundColor: Theme.violetLight,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="location" size={18} color={Theme.violet} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: '800', color: Theme.textDark }} numberOfLines={1}>
              {resolvedAddress ? resolvedAddress.split(',')[0] : 'Pin a location to begin'}
            </Text>
            <Text style={{ fontSize: 12, color: Theme.textMid, marginTop: 2 }} numberOfLines={2}>
              {resolvedAddress || 'Drag the map or search to set your address.'}
            </Text>
          </View>
        </View>

        {mapError ? (
          <Text style={{ color: Theme.error, fontSize: 12, marginTop: 10 }}>{mapError}</Text>
        ) : null}

        <View style={{ height: 14 }} />

        <Button
          onPress={handleConfirmLocation}
          disabled={!resolvedCoords || !resolvedAddress || refining}
        >
          Confirm and add details
        </Button>
      </View>
    </View>
  );

  const renderDetailsModal = () => (
    <Modal
      visible={mode === 'enterDetails'}
      transparent
      animationType="slide"
      onRequestClose={() => setMode('pickLocation')}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' }}
      >
        <View
          style={{
            backgroundColor: Theme.white,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: 28,
            maxHeight: '90%',
          }}
        >
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: 6,
              }}
            >
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={{ fontSize: 18, fontWeight: '800', color: Theme.textDark }}>
                  Address details
                </Text>
                <Text style={{ fontSize: 12, color: Theme.textMid, marginTop: 4 }}>
                  Complete address would help us serve you better
                </Text>
              </View>
              <Pressable onPress={() => setMode('pickLocation')} hitSlop={8}>
                <Ionicons name="close" size={22} color={Theme.textMid} />
              </Pressable>
            </View>

            <View style={{ height: 16 }} />

            <Text style={{ fontSize: 12, fontWeight: '700', color: Theme.textMid }}>
              Select address type
            </Text>
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: 8,
                marginTop: 10,
              }}
            >
              <Pressable
                onPress={() => {
                  setShowCustomType((prev) => !prev);
                  if (!showCustomType) setSelectedType('');
                }}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 19,
                  borderWidth: 1.5,
                  borderColor: showCustomType ? Theme.violet : Theme.border,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: showCustomType ? Theme.violetLight : Theme.white,
                }}
              >
                <Ionicons name="add" size={18} color={showCustomType ? Theme.violet : Theme.textMid} />
              </Pressable>
              {ADDRESS_TYPES.map((type) => {
                const isSelected = !showCustomType && selectedType === type.key;
                return (
                  <Pressable
                    key={type.key}
                    onPress={() => {
                      setShowCustomType(false);
                      setSelectedType(type.key);
                    }}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 19,
                      borderWidth: 1.5,
                      borderColor: isSelected ? Theme.violet : Theme.border,
                      backgroundColor: isSelected ? Theme.violetLight : Theme.white,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <Ionicons
                      name={type.icon}
                      size={14}
                      color={isSelected ? Theme.violet : Theme.textMid}
                    />
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: '700',
                        color: isSelected ? Theme.violet : Theme.textMid,
                      }}
                    >
                      {type.key}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {showCustomType ? (
              <View style={{ marginTop: 12 }}>
                <TextInput
                  value={customType}
                  onChangeText={setCustomType}
                  placeholder="e.g. Mom's place"
                  placeholderTextColor={Theme.textLight}
                  style={inputStyle}
                />
              </View>
            ) : null}

            <View style={{ height: 18 }} />

            <View style={inputWrapper}>
              <Text style={floatingLabel}>Receiver's name *</Text>
              <TextInput
                value={receiverName}
                onChangeText={setReceiverName}
                placeholder=""
                style={floatingInput}
              />
              {receiverName.length > 0 ? (
                <Pressable onPress={() => setReceiverName('')} hitSlop={8} style={{ position: 'absolute', right: 12, top: 18 }}>
                  <Ionicons name="close-circle" size={18} color={Theme.textLight} />
                </Pressable>
              ) : null}
            </View>

            <View style={{ height: 12 }} />

            <View style={inputWrapper}>
              <Text style={floatingLabel}>Complete address *</Text>
              <TextInput
                value={completeAddress}
                onChangeText={setCompleteAddress}
                placeholder=""
                multiline
                style={[floatingInput, { minHeight: 64, textAlignVertical: 'top' }]}
              />
            </View>

            <View style={{ height: 12 }} />

            <View style={inputWrapper}>
              <Text style={floatingLabel}>Nearby landmark (optional)</Text>
              <TextInput
                value={landmark}
                onChangeText={setLandmark}
                placeholder=""
                style={floatingInput}
              />
            </View>

            <Pressable
              onPress={() => setMakeDefault((prev) => !prev)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                marginTop: 16,
              }}
            >
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 6,
                  borderWidth: 1.5,
                  borderColor: makeDefault ? Theme.violet : Theme.border,
                  backgroundColor: makeDefault ? Theme.violet : 'transparent',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {makeDefault ? <Ionicons name="checkmark" size={14} color={Theme.white} /> : null}
              </View>
              <Text style={{ color: Theme.textMid, fontSize: 13 }}>Make this my default address</Text>
            </Pressable>

            {formError ? (
              <Text style={{ color: Theme.error, fontSize: 12, marginTop: 12 }}>{formError}</Text>
            ) : null}

            <View style={{ height: 18 }} />

            <Button onPress={handleSave} loading={saving} disabled={saving}>
              {editingId ? 'Update address' : 'Save address'}
            </Button>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  if (mode === 'pickLocation' || mode === 'enterDetails') {
    return (
      <View style={{ flex: 1, backgroundColor: Theme.white }}>
        {renderPickLocationMode()}
        {renderDetailsModal()}
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Theme.cream }} edges={['top']}>
      {renderListMode()}
    </SafeAreaView>
  );
}

const inputStyle = {
  borderRadius: 12,
  borderWidth: 1.5,
  borderColor: Theme.border,
  backgroundColor: Theme.cream,
  paddingHorizontal: 12,
  paddingVertical: 12,
  fontSize: 14,
  color: Theme.textDark,
} as const;

const inputWrapper = {
  borderRadius: 12,
  borderWidth: 1.5,
  borderColor: Theme.border,
  backgroundColor: Theme.white,
  paddingHorizontal: 14,
  paddingTop: 18,
  paddingBottom: 10,
  position: 'relative' as const,
};

const floatingLabel = {
  position: 'absolute' as const,
  top: 4,
  left: 14,
  fontSize: 11,
  color: Theme.textMid,
  fontWeight: '600' as const,
};

const floatingInput = {
  fontSize: 14,
  color: Theme.textDark,
  paddingVertical: 4,
  paddingTop: 8,
};
