import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export async function getItem(key) {
  if (Platform.OS === 'web') {
    try {
      return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
    } catch {
      return null;
    }
  }
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

export async function setItem(key, value) {
  if (Platform.OS === 'web') {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, value);
      }
      return;
    } catch {
      return;
    }
  }
  try {
    await SecureStore.setItemAsync(key, value);
  } catch {
    // Ignore storage errors on non-supported platforms
  }
}

export async function deleteItem(key) {
  if (Platform.OS === 'web') {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
      }
      return;
    } catch {
      return;
    }
  }
  try {
    await SecureStore.deleteItemAsync(key);
  } catch {
    // Ignore storage deletion errors
  }
}
