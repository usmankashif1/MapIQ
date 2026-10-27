import Constants from 'expo-constants';

// Set EXPO_PUBLIC_API_URL in .env (variables prefixed EXPO_PUBLIC_ are inlined at build time).
export const API_BASE_URL: string = process.env.EXPO_PUBLIC_API_URL;
export const GOOGLE_MAPS_API_KEY: string | undefined =
  Constants.expoConfig?.extra?.googleMapsApiKey;
