import { Platform } from 'react-native';

const TOKEN_KEY = 'auth_token';

async function getSecureStore() {
  return import('expo-secure-store');
}

export const saveToken = async (token: string): Promise<void> => {
  if (Platform.OS === 'web') {
    window.localStorage.setItem(TOKEN_KEY, token);
    return;
  }

  const SecureStore = await getSecureStore();
  await SecureStore.setItemAsync(TOKEN_KEY, token);
};

export const getToken = async (): Promise<string | null> => {
  if (Platform.OS === 'web') {
    return window.localStorage.getItem(TOKEN_KEY);
  }

  const SecureStore = await getSecureStore();
  return SecureStore.getItemAsync(TOKEN_KEY);
};

export const removeToken = async (): Promise<void> => {
  if (Platform.OS === 'web') {
    window.localStorage.removeItem(TOKEN_KEY);
    return;
  }

  const SecureStore = await getSecureStore();
  await SecureStore.deleteItemAsync(TOKEN_KEY);
};
