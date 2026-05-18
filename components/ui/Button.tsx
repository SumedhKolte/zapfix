import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  Platform,
} from 'react-native';
import type { PressableProps, PressableStateCallbackType, StyleProp, ViewStyle } from 'react-native';
import type { ReactNode } from 'react';
import { LinearGradient } from 'expo-linear-gradient';

import { Colors } from '@/constants/colors';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonProps = Omit<PressableProps, 'children'> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
  children: ReactNode;
};

const sizeStyles: Record<
  ButtonSize,
  {
    height: number;
    paddingHorizontal: number;
    fontSize: number;
    borderRadius: number;
    loaderSize: number;
  }
> = {
  sm: {
    height: 58,
    paddingHorizontal: 26,
    fontSize: 15,
    borderRadius: 29,
    loaderSize: 18,
  },
  md: {
    height: 72,
    paddingHorizontal: 32,
    fontSize: 17,
    borderRadius: 36,
    loaderSize: 22,
  },
  lg: {
    // Super-sized, extra chunky "pill" shape globally for lg
    height: 90,
    paddingHorizontal: 40,
    fontSize: 19,
    borderRadius: 45, 
    loaderSize: 26,
  },
};

const variantStyles: Record<
  ButtonVariant,
  {
    background: string;
    text: string;
    border?: string;
    loaderColor: string;
    gradientColors?: [string, string, ...string[]];
    shadowColor: string;
    shadowOpacity: number;
    elevation: number;
  }
> = {
  primary: {
    background: 'transparent',
    text: Colors.navy.primary,
    loaderColor: Colors.navy.primary,
    gradientColors: [Colors.amber.primary, Colors.amber.dark],
    shadowColor: Colors.amber.dark,
    shadowOpacity: 0.45,
    elevation: 8,
  },
  secondary: {
    background: Colors.white,
    text: Colors.navy.primary,
    border: Colors.navy.primary,
    loaderColor: Colors.navy.primary,
    shadowColor: Colors.navy.primary,
    shadowOpacity: 0.1,
    elevation: 2,
  },
  danger: {
    background: Colors.error,
    text: Colors.white,
    loaderColor: Colors.white,
    gradientColors: [Colors.error, `${Colors.error}CC`],
    shadowColor: Colors.error,
    shadowOpacity: 0.35,
    elevation: 4,
  },
  ghost: {
    background: 'transparent',
    text: Colors.navy.primary,
    loaderColor: Colors.navy.primary,
    shadowColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
  },
};

export const Button = ({
  variant = 'primary',
  size = 'md',
  loading,
  disabled,
  leftIcon,
  rightIcon,
  fullWidth = true,
  children,
  style,
  ...rest
}: ButtonProps) => {
  const sizeStyle = sizeStyles[size];
  const variantStyle = variantStyles[variant];
  const isDisabled = disabled || loading;

  // Flatten styles to check if the user is overriding borderRadius or height manually
  const flattenedStyle = (StyleSheet.flatten(style) || {}) as ViewStyle;
  const activeBorderRadius = flattenedStyle.borderRadius ?? sizeStyle.borderRadius;

  const baseStyle: ViewStyle = {
    height: sizeStyle.height,
    minHeight: sizeStyle.height,
    flexShrink: 0,
    paddingHorizontal: sizeStyle.paddingHorizontal,
    borderRadius: sizeStyle.borderRadius,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: variantStyle.background,
    borderWidth: variantStyle.border ? 2 : 0,
    borderColor: variantStyle.border,
    alignSelf: fullWidth ? 'stretch' : 'auto',
    
    // 🚨 REMOVED `overflow: 'hidden'` HERE. 
    // In React Native, overflow hidden destroys shadows!

    // Shadow iOS
    shadowColor: variantStyle.shadowColor,
    shadowOpacity: isDisabled ? 0 : variantStyle.shadowOpacity,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    // Shadow Android
    elevation: isDisabled ? 0 : variantStyle.elevation,
  };

  const resolveStyle = (state: PressableStateCallbackType): StyleProp<ViewStyle> => {
    const userStyle = typeof style === 'function' ? style(state) : style;
    return [
      baseStyle,
      userStyle,
      isDisabled && styles.disabled,
      state.pressed && styles.pressed,
    ];
  };

  /* ── Label / content ── */
  const renderLabel = () => {
    if (loading) {
      return (
        <View style={styles.loaderWrapper}>
          <ActivityIndicator
            color={variantStyle.loaderColor}
            size={sizeStyle.loaderSize as any}
          />
          {typeof children === 'string' && (
            <Text
              style={[
                styles.label,
                {
                  color: variantStyle.text,
                  fontSize: sizeStyle.fontSize,
                  opacity: 0.65,
                },
              ]}
            >
              {children}
            </Text>
          )}
        </View>
      );
    }

    if (typeof children === 'string' || typeof children === 'number') {
      return (
        <View style={styles.contentRow}>
          {leftIcon ? (
            <View style={[styles.iconWrapper, styles.iconLeft]}>
              {leftIcon}
            </View>
          ) : null}
          <Text
            style={[
              styles.label,
              {
                color: variantStyle.text,
                fontSize: sizeStyle.fontSize,
              },
            ]}
            numberOfLines={1}
          >
            {children}
          </Text>
          {rightIcon ? (
            <View style={[styles.iconWrapper, styles.iconRight]}>
              {rightIcon}
            </View>
          ) : null}
        </View>
      );
    }

    return <>{children}</>;
  };

  /* ── Gradient fill ── */
  const renderBackground = () => {
    if (variant === 'ghost' || variant === 'secondary') return null;

    const gradColors = isDisabled
      ? variant === 'primary'
        ? ([Colors.amber.light, Colors.amber.primary] as [string, string])
        : ([
            variantStyle.gradientColors![0],
            variantStyle.gradientColors![0],
          ] as [string, string])
      : (variantStyle.gradientColors as [string, string]);

    return (
      <LinearGradient
        colors={gradColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        // Explicitly applying border radius here instead of relying on parent overflow
        style={[StyleSheet.absoluteFillObject, { borderRadius: activeBorderRadius }]}
      />
    );
  };

  /* ── Pressed ripple overlay ── */
  const renderPressOverlay = () => (
    <View
      style={[
        StyleSheet.absoluteFillObject,
        styles.pressOverlay,
        // Ensures the overlay matches the rounded corners correctly
        { borderRadius: activeBorderRadius },
      ]}
      pointerEvents="none"
    />
  );

  return (
    <Pressable
      {...rest}
      disabled={isDisabled}
      style={resolveStyle}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
    >
      {({ pressed }) => (
        <>
          {renderBackground()}
          {pressed && !isDisabled ? renderPressOverlay() : null}
          {renderLabel()}
        </>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  pressed: {
    transform: [{ scale: 0.974 }],
    opacity: 0.92,
  },
  disabled: {
    opacity: 0.5,
  },
  pressOverlay: {
    backgroundColor:
      Platform.OS === 'ios' ? 'rgba(0,0,0,0.07)' : 'rgba(0,0,0,0.09)',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1, // Ensures text stays above gradient
  },
  label: {
    fontWeight: '800',
    letterSpacing: 0.25,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLeft: {
    marginRight: 10,
  },
  iconRight: {
    marginLeft: 10,
  },
  loaderWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    zIndex: 1,
  },
});