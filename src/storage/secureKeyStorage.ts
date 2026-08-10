import { Platform } from 'react-native';

const KEYSTORE_ALIAS = 'ezcat_byok_api_key';
const CONFIG_ALIAS = 'ezcat_byok_config';

export type ProviderPreset = 'openai' | 'openrouter' | 'deepseek' | 'groq' | 'custom';

export interface BYOKConfig {
  provider: ProviderPreset;
  baseUrl: string;
  model: string;
  isEnabled: boolean;
}

export const DEFAULT_BYOK_CONFIG: BYOKConfig = {
  provider: 'openai',
  baseUrl: 'https://api.openai.com/v1',
  model: 'gpt-4o-mini',
  isEnabled: false,
};

// In-memory runtime session fallback
let inMemoryApiKey: string | null = null;
let inMemoryConfig: BYOKConfig | null = null;

// Dynamically acquire SecureStore module safely without crash on web
let SecureStore: typeof import('expo-secure-store') | null = null;
try {
  if (Platform.OS !== 'web') {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    SecureStore = require('expo-secure-store');
  }
} catch {
  SecureStore = null;
}

/**
 * Save user API key securely
 */
export async function saveApiKey(apiKey: string): Promise<void> {
  const cleanKey = apiKey.trim();
  inMemoryApiKey = cleanKey;

  if (Platform.OS !== 'web' && SecureStore) {
    try {
      await SecureStore.setItemAsync(KEYSTORE_ALIAS, cleanKey, {
        keychainAccessible: SecureStore.WHEN_UNLOCKED,
      });
      return;
    } catch (err) {
      console.warn('[SecureKeyStorage] SecureStore save warning:', err);
    }
  }

  // Web fallback using in-memory session cache & sessionStorage
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      // Obfuscate in session storage for basic DOM inspector protection
      const encoded = typeof btoa === 'function' ? btoa(cleanKey) : cleanKey;
      window.sessionStorage.setItem(KEYSTORE_ALIAS, encoded);
    }
  } catch {
    // Ignore web session storage restrictions
  }
}

/**
 * Retrieve user API key securely
 */
export async function getApiKey(): Promise<string | null> {
  if (inMemoryApiKey) {
    return inMemoryApiKey;
  }

  if (Platform.OS !== 'web' && SecureStore) {
    try {
      const stored = await SecureStore.getItemAsync(KEYSTORE_ALIAS);
      if (stored) {
        inMemoryApiKey = stored;
        return stored;
      }
    } catch (err) {
      console.warn('[SecureKeyStorage] SecureStore get warning:', err);
    }
  }

  // Web fallback
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      const stored = window.sessionStorage.getItem(KEYSTORE_ALIAS);
      if (stored) {
        const decoded = typeof atob === 'function' ? atob(stored) : stored;
        inMemoryApiKey = decoded;
        return decoded;
      }
    }
  } catch {
    return null;
  }

  return null;
}

/**
 * Clear stored API key completely
 */
export async function clearApiKey(): Promise<void> {
  inMemoryApiKey = null;

  if (Platform.OS !== 'web' && SecureStore) {
    try {
      await SecureStore.deleteItemAsync(KEYSTORE_ALIAS);
    } catch {
      // Ignore
    }
  }

  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.removeItem(KEYSTORE_ALIAS);
    }
  } catch {
    // Ignore
  }
}

/**
 * Save BYOK Configuration (Provider, Base URL, Model)
 */
export async function saveBYOKConfig(config: BYOKConfig): Promise<void> {
  inMemoryConfig = config;
  const jsonStr = JSON.stringify(config);

  if (Platform.OS !== 'web' && SecureStore) {
    try {
      await SecureStore.setItemAsync(CONFIG_ALIAS, jsonStr);
      return;
    } catch {
      // Fall through to localStorage
    }
  }

  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(CONFIG_ALIAS, jsonStr);
    }
  } catch {
    // Ignore
  }
}

/**
 * Get stored BYOK Configuration
 */
export async function getBYOKConfig(): Promise<BYOKConfig> {
  if (inMemoryConfig) {
    return inMemoryConfig;
  }

  if (Platform.OS !== 'web' && SecureStore) {
    try {
      const raw = await SecureStore.getItemAsync(CONFIG_ALIAS);
      if (raw) {
        const parsed = JSON.parse(raw);
        inMemoryConfig = parsed;
        return parsed;
      }
    } catch {
      // Fall through
    }
  }

  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem(CONFIG_ALIAS);
      if (raw) {
        const parsed = JSON.parse(raw);
        inMemoryConfig = parsed;
        return parsed;
      }
    }
  } catch {
    return DEFAULT_BYOK_CONFIG;
  }

  return DEFAULT_BYOK_CONFIG;
}
