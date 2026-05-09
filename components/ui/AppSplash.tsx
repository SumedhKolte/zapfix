import { useEffect, useRef } from 'react';
import { Animated, Image, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const Theme = {
  navy: '#0F2057',
  navyMid: '#1A3580',
  amber: '#F5B800',
  white: '#FFFFFF'
};

const logoSource = require('../../assets/icon.png');

export const AppSplash = () => {
  const scale = useRef(new Animated.Value(0.96)).current;
  const float = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 1.03,
            duration: 900,
            useNativeDriver: true
          }),
          Animated.timing(scale, {
            toValue: 0.96,
            duration: 900,
            useNativeDriver: true
          })
        ]),
        Animated.sequence([
          Animated.timing(float, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true
          }),
          Animated.timing(float, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true
          })
        ])
      ])
    ).start();
  }, [float, scale]);

  const translateY = float.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10]
  });

  return (
    <LinearGradient
      colors={[Theme.navy, Theme.navyMid]}
      style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}
    >
      <Animated.View style={{ transform: [{ translateY }, { scale }] }}>
        <View
          style={{
            width: 140,
            height: 140,
            borderRadius: 36,
            backgroundColor: 'rgba(255,255,255,0.08)',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Image source={logoSource} style={{ width: 88, height: 88 }} resizeMode="contain" />
        </View>
      </Animated.View>
      <Text style={{ color: Theme.white, fontSize: 26, fontWeight: '800', marginTop: 18 }}>
        Zapfix
      </Text>
      <View
        style={{
          marginTop: 10,
          backgroundColor: 'rgba(255,255,255,0.12)',
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 999
        }}
      >
        <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>
          Getting things ready
        </Text>
      </View>
    </LinearGradient>
  );
};
