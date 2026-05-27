const appEnv = process.env.APP_ENV ?? 'development';
const isProd = appEnv === 'production';
const isPreview = appEnv === 'preview';

const appVersion = '1.0.0';

const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

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
      NSMicrophoneUsageDescription: 'Allow Zapfix to record your problem description for speech to text.',
      NSLocationWhenInUseUsageDescription: 'Zapfix uses your location to find the right service address and dispatch a Pro to you.',
      NSLocationAlwaysAndWhenInUseUsageDescription: 'Zapfix uses your location to find the right service address and dispatch a Pro to you.',
      NSPhotoLibraryUsageDescription: 'Zapfix needs photo access so you can attach pictures of the appliance issue.',
      NSCameraUsageDescription: 'Zapfix uses the camera to capture the appliance and diagnose the issue.'
    }
  },
  android: {
    package: 'com.zapfix.app',
    googleServicesFile: './app/google-services.json',
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#0D1B3E'
    },
    config: {
      googleMaps: {
        apiKey: googleMapsApiKey
      }
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
    'expo-font',
    'expo-asset',
    ['expo-audio', {
      microphonePermission: 'Allow Zapfix to record your problem description for speech to text.',
      recordAudioAndroid: true
    }],
    'expo-camera',
    ['expo-location', {
      locationAlwaysAndWhenInUsePermission: 'Zapfix uses your location to dispatch a Pro to the right address.'
    }],
    'expo-notifications',
    'expo-font',
    'expo-asset',
    ['expo-image-picker', {
      photosPermission: 'Allow Zapfix to access your photos.'
    }]
  ],
  extra: {
    appEnv,
    isProd,
    isPreview,
    eas: {
      projectId: '24a75c24-24d5-4662-b99e-b4d513112dd4'
    }
  }
});
