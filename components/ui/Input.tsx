import { ReactNode, useState } from 'react';
import { Text, TextInput, TextInputProps, View } from 'react-native';

import { Colors } from '@/constants/colors';

type InputProps = TextInputProps & {
  label?: string;
  leftElement?: ReactNode;
  rightElement?: ReactNode;
  error?: string;
};

export const Input = ({ label, leftElement, rightElement, error, ...props }: InputProps) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={{ gap: 8 }}>
      {label ? <Text style={{ color: Colors.darkGray, fontSize: 14 }}>{label}</Text> : null}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          borderWidth: 1.5,
          borderColor: isFocused ? Colors.amber.primary : Colors.border,
          borderRadius: 12,
          height: 52,
          paddingHorizontal: 16,
          backgroundColor: Colors.white
        }}
      >
        {leftElement ? <View style={{ marginRight: 8 }}>{leftElement}</View> : null}
        <TextInput
          {...props}
          style={{ flex: 1, fontSize: 16, color: Colors.darkGray }}
          placeholderTextColor={Colors.midGray}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
        {rightElement ? <View style={{ marginLeft: 8 }}>{rightElement}</View> : null}
      </View>
      {error ? <Text style={{ color: Colors.error, fontSize: 12 }}>{error}</Text> : null}
    </View>
  );
};
