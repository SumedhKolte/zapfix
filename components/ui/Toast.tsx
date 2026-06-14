import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/useTheme';

export type ToastVariant = 'success' | 'error' | 'info';

type ToastOptions = {
  title: string;
  message?: string;
  variant?: ToastVariant;
  /** ms before auto-dismiss. Default 2800. */
  duration?: number;
};

type ToastContextValue = {
  show: (options: ToastOptions) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

/**
 * App-wide toast feedback. Replaces the plain native `Alert.alert` "task done"
 * popups with a themed, auto-dismissing banner. Use `useToast()` anywhere under
 * <ToastProvider> (mounted once in the root layout).
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { theme: Theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<(ToastOptions & { key: number }) | null>(null);
  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: -120, duration: 220, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start(() => setToast(null));
  }, [opacity, translateY]);

  const show = useCallback(
    (options: ToastOptions) => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      setToast({ ...options, key: Date.now() });
      translateY.setValue(-120);
      opacity.setValue(0);
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, tension: 90, friction: 12, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
      hideTimer.current = setTimeout(dismiss, options.duration ?? 2800);
    },
    [dismiss, opacity, translateY]
  );

  useEffect(() => () => { if (hideTimer.current) clearTimeout(hideTimer.current); }, []);

  const api: ToastContextValue = {
    show,
    success: (title, message) => show({ title, message, variant: 'success' }),
    error: (title, message) => show({ title, message, variant: 'error' }),
    info: (title, message) => show({ title, message, variant: 'info' }),
  };

  const variant = toast?.variant ?? 'info';
  const accent =
    variant === 'success' ? '#1FA971' : variant === 'error' ? Theme.error : Theme.navy;
  const icon =
    variant === 'success' ? 'checkmark-circle' : variant === 'error' ? 'alert-circle' : 'information-circle';

  return (
    <ToastContext.Provider value={api}>
      {children}
      {toast ? (
        <Animated.View
          pointerEvents="box-none"
          style={{
            position: 'absolute',
            top: insets.top + 8,
            left: 12,
            right: 12,
            transform: [{ translateY }],
            opacity,
            zIndex: 9999,
            elevation: 9999,
          }}
        >
          <Pressable
            onPress={dismiss}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              backgroundColor: Theme.creamCard,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: Theme.border,
              borderLeftWidth: 4,
              borderLeftColor: accent,
              paddingVertical: 12,
              paddingHorizontal: 14,
              shadowColor: Theme.navy,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.18,
              shadowRadius: 16,
              elevation: 12,
            }}
          >
            <Ionicons name={icon as any} size={22} color={accent} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: Theme.textDark, fontSize: 14, fontWeight: '800' }} numberOfLines={1}>
                {toast.title}
              </Text>
              {toast.message ? (
                <Text style={{ color: Theme.textMid, fontSize: 12, marginTop: 1 }} numberOfLines={2}>
                  {toast.message}
                </Text>
              ) : null}
            </View>
          </Pressable>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (ctx) return ctx;
  // No-op fallback so components used outside the provider don't crash.
  const noop = () => undefined;
  return { show: noop, success: noop, error: noop, info: noop };
}
