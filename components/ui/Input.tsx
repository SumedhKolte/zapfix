import { ReactNode, useState } from 'react';
import { Text, TextInput, TextInputProps, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

type InputProps = TextInputProps & {
  label?: string;
  leftElement?: ReactNode;
  rightElement?: ReactNode;
  error?: string;
};

export const Input = ({ label, leftElement, rightElement, error, onFocus, onBlur, ...props }: InputProps) => {
  const { colors } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const borderColor = error ? colors.error : isFocused ? colors.amber.primary : colors.border;

  return (
    <View style={{ gap: 8 }}>
      {label ? <Text style={{ color: colors.text.secondary, fontSize: 14 }}>{label}</Text> : null}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          borderWidth: 1.5,
          borderColor,
          borderRadius: 14,
          height: 54,
          paddingHorizontal: 16,
          backgroundColor: colors.surfaceAlt
        }}
      >
        {leftElement ? <View style={{ marginRight: 8 }}>{leftElement}</View> : null}
        <TextInput
          {...props}
          style={{ flex: 1, fontSize: 16, color: colors.text.primary }}
          placeholderTextColor={colors.midGray}
          onFocus={(event) => {
            setIsFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setIsFocused(false);
            onBlur?.(event);
          }}
        />
        {rightElement ? <View style={{ marginLeft: 8 }}>{rightElement}</View> : null}
      </View>
      {error ? <Text style={{ color: colors.error, fontSize: 12 }}>{error}</Text> : null}
    </View>
  );
};
