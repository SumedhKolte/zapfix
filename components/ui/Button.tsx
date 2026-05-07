import { ActivityIndicator, Pressable, Text } from 'react-native';
import type { PressableProps, PressableStateCallbackType } from 'react-native';
import type { ReactNode } from 'react';

import { Colors } from '@/constants/colors';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonProps = Omit<PressableProps, 'children'> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: ReactNode;
};

const sizeStyles: Record<ButtonSize, { height: number; paddingHorizontal: number; fontSize: number }> = {
  sm: { height: 40, paddingHorizontal: 16, fontSize: 14 },
  md: { height: 52, paddingHorizontal: 20, fontSize: 16 },
  lg: { height: 56, paddingHorizontal: 24, fontSize: 18 }
};

const variantStyles: Record<ButtonVariant, { background: string; text: string; border?: string }> = {
  primary: { background: Colors.amber.primary, text: Colors.navy.primary },
  secondary: { background: 'transparent', text: Colors.navy.primary, border: Colors.navy.primary },
  danger: { background: Colors.error, text: Colors.white },
  ghost: { background: 'transparent', text: Colors.navy.primary }
};

export const Button = ({
  variant = 'primary',
  size = 'md',
  loading,
  disabled,
  children,
  style,
  ...rest
}: ButtonProps) => {
  const sizeStyle = sizeStyles[size];
  const variantStyle = variantStyles[variant];
  const isDisabled = disabled || loading;

  const baseStyle = {
    height: sizeStyle.height,
    paddingHorizontal: sizeStyle.paddingHorizontal,
    borderRadius: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: variantStyle.background,
    borderWidth: variantStyle.border ? 1.5 : 0,
    borderColor: variantStyle.border,
    opacity: isDisabled ? 0.6 : 1
  };

  const resolveStyle = (state: PressableStateCallbackType) => {
    const userStyle = typeof style === 'function' ? style(state) : style;
    return [baseStyle, userStyle, state.pressed ? { transform: [{ scale: 0.97 }] } : null];
  };

  return (
    <Pressable
      {...rest}
      disabled={isDisabled}
      style={resolveStyle}
      accessibilityRole="button"
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? Colors.navy.primary : Colors.amber.primary} />
      ) : typeof children === 'string' || typeof children === 'number' ? (
        <Text style={{ color: variantStyle.text, fontWeight: '700', fontSize: sizeStyle.fontSize }}>
          {children}
        </Text>
      ) : (
        children
      )}
    </Pressable>
  );
};
