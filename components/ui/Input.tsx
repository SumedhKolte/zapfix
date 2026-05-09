import { ReactNode, useState } from 'react';
import { Text, TextInput, TextInputProps, View } from 'react-native';

import { Colors } from '@/constants/colors';

type InputProps = TextInputProps & {
  label?: string;
  leftElement?: ReactNode;
  rightElement?: ReactNode;
  error?: string;
};

export const Input = ({ label, leftElement, rightElement, error, onFocus, onBlur, ...props }: InputProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const borderColor = error ? Colors.error : isFocused ? Colors.amber.primary : Colors.border;

  return (
    <View style={{ gap: 8 }}>
      {label ? <Text style={{ color: Colors.darkGray, fontSize: 14 }}>{label}</Text> : null}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          borderWidth: 1.5,
          borderColor,
          borderRadius: 14,
          height: 54,
          paddingHorizontal: 16,
          backgroundColor: Colors.offWhite
        }}
      >
        {leftElement ? <View style={{ marginRight: 8 }}>{leftElement}</View> : null}
        <TextInput
          {...props}
          style={{ flex: 1, fontSize: 16, color: Colors.darkGray }}
          placeholderTextColor={Colors.midGray}
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
      {error ? <Text style={{ color: Colors.error, fontSize: 12 }}>{error}</Text> : null}
    </View>
  );
};
