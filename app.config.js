const appEnv = process.env.APP_ENV ?? 'development';
const isProd = appEnv === 'production';
const isPreview = appEnv === 'preview';
const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

const appVersion = '1.0.0';

module.exports = ({ config }) => ({
  ...config,
  name: 'Zapfix',
  slug: 'zapfix',
  version: appVersion,
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  scheme: 'zapfix',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#0D1B3E'
  },
  updates: {
    fallbackToCacheTimeout: 0
  },
  runtimeVersion: appVersion,
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.Sumedh.zapfix',
    config: {
      googleMapsApiKey
    },
    infoPlist: {
      NSAllowsLocalNetworking: true,
      NSBonjourServices: ['_expo._tcp'],
      NSLocalNetworkUsageDescription: 'Expo Dev Launcher uses the local network to discover and connect to development servers running on your computer.',
      NSMicrophoneUsageDescription: 'Allow Zapfix to record your problem description for speech to text.'
    }
  },
  android: {
    package: 'com.zapfix.app',
    config: {
      googleMaps: {
        apiKey: googleMapsApiKey
      }
    },
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#0D1B3E'
    },
    permissions: [
      'CAMERA',
      'READ_EXTERNAL_STORAGE',
      'WRITE_EXTERNAL_STORAGE',
      'ACCESS_FINE_LOCATION',
      'ACCESS_COARSE_LOCATION',
      'RECORD_AUDIO',
      'VIBRATE'
    ]
  },
  plugins: [
    'expo-router',
    'expo-camera',
    'expo-location',
    'expo-notifications',
    ['expo-image-picker', {
      photosPermission: 'Allow Zapfix to access your photos.'
    }],
    'expo-audio'
  ],
  extra: {
    appEnv,
    isProd,
    isPreview
  }
});
