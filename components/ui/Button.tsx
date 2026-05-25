import {
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { TouchableOpacityProps, StyleProp, ViewStyle } from 'react-native';
import type { ReactNode } from 'react';
import { Colors } from '@/constants/colors';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonProps = Omit<TouchableOpacityProps, 'children'> & {
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
    height: 56,
    paddingHorizontal: 24,
    fontSize: 15,
    borderRadius: 28,
    loaderSize: 18,
  },

  md: {
    height: 64,
    paddingHorizontal: 28,
    fontSize: 17,
    borderRadius: 32,
    loaderSize: 20,
  },

  lg: {
    height: 74,
    paddingHorizontal: 32,
    fontSize: 18,
    borderRadius: 37,
    loaderSize: 24,
  },
};

const variantStyles: Record<
  ButtonVariant,
  {
    background: string;
    text: string;
    border?: string;
    loaderColor: string;
  }
> = {
  primary: {
    background: Colors.amber.primary,
    text: Colors.navy.primary,
    loaderColor: Colors.navy.primary,
  },
  secondary: {
    background: Colors.white,
    text: Colors.navy.primary,
    border: Colors.navy.primary,
    loaderColor: Colors.navy.primary,
  },
  danger: {
    background: Colors.error,
    text: Colors.white,
    loaderColor: Colors.white,
  },
  ghost: {
    background: 'transparent',
    text: Colors.navy.primary,
    loaderColor: Colors.navy.primary,
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

  elevation: 0,

  shadowOpacity: 0,
};

  const userStyle = style as StyleProp<ViewStyle>;

  const renderLabel = () => {
    if (loading) {
      return (
        <View style={styles.loaderWrapper}>
          <ActivityIndicator
            color={variantStyle.loaderColor}
            size={sizeStyle.loaderSize as any}
          />
          {typeof children === 'string' ? (
            <Text
              style={[
                styles.label,
                {
                  color: variantStyle.text,
                  fontSize: sizeStyle.fontSize,
                },
              ]}
            >
              {children}
            </Text>
          ) : null}
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

    return <View style={styles.contentRow}>{children}</View>;
  };

  return (
    <TouchableOpacity
      {...rest}
      disabled={isDisabled}
      style={[baseStyle, userStyle, isDisabled && styles.disabled]}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      activeOpacity={0.85}
    >
      {renderLabel()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  disabled: {
    opacity: 0.5,
  },

  contentRow: {
    flexDirection: 'row',

    alignItems: 'center',
    justifyContent: 'center',

    zIndex: 1,
  },

  label: {
    fontWeight: '800',

    letterSpacing: 0.2,

    includeFontPadding: false,

    textAlignVertical: 'center',
  },

  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  iconLeft: {
    marginRight: 14,
  },

  iconRight: {
    marginLeft: 14,
  },

  loaderWrapper: {
    flexDirection: 'row',

    alignItems: 'center',
    justifyContent: 'center',

    gap: 10,

    zIndex: 1,
  },
});