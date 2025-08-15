import Constants from 'expo-constants';

/**
 * Detects if the app is running in Expo Go
 * Expo Go doesn't support native modules, so we need to disable features that require them
 */
export function isExpoGo(): boolean {
  return Constants.appOwnership === 'expo';
}

/**
 * Checks if Google Sign-In is available (not in Expo Go)
 */
export function isGoogleSignInAvailable(): boolean {
  return !isExpoGo();
}