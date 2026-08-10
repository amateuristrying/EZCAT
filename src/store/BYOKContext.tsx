import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  BYOKConfig,
  DEFAULT_BYOK_CONFIG,
  getApiKey,
  getBYOKConfig,
  saveApiKey,
  saveBYOKConfig,
  clearApiKey as removeStoredKey,
} from '../storage/secureKeyStorage';
import { OpenAIClient, AIInsightResponse, ClientMetricsContext } from '../services/openAIClient';

interface BYOKContextType {
  config: BYOKConfig;
  hasKey: boolean;
  isTesting: boolean;
  isLoadingInsights: boolean;
  cachedInsights: AIInsightResponse | null;
  insightError: string | null;
  saveConfiguration: (key: string, newConfig: BYOKConfig) => Promise<void>;
  clearConfiguration: () => Promise<void>;
  testConnection: (key: string, testConfig: BYOKConfig) => Promise<{ success: boolean; message: string }>;
  fetchGenerativeInsights: (metrics: ClientMetricsContext) => Promise<AIInsightResponse | null>;
}

const BYOKContext = createContext<BYOKContextType | null>(null);

export function BYOKProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<BYOKConfig>(DEFAULT_BYOK_CONFIG);
  const [hasKey, setHasKey] = useState<boolean>(false);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [isLoadingInsights, setIsLoadingInsights] = useState<boolean>(false);
  const [cachedInsights, setCachedInsights] = useState<AIInsightResponse | null>(null);
  const [insightError, setInsightError] = useState<string | null>(null);

  // Hydrate stored BYOK configuration & key on mount
  useEffect(() => {
    let isMounted = true;
    (async () => {
      const cfg = await getBYOKConfig();
      const key = await getApiKey();
      if (isMounted) {
        setConfig(cfg);
        setHasKey(!!key && cfg.isEnabled);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const testConnection = useCallback(async (key: string, testConfig: BYOKConfig) => {
    setIsTesting(true);
    try {
      const client = new OpenAIClient(testConfig.baseUrl, key, testConfig.model, testConfig.provider);
      return await client.validateKey();
    } finally {
      setIsTesting(false);
    }
  }, []);

  const saveConfiguration = useCallback(async (key: string, newConfig: BYOKConfig) => {
    if (key && key.trim()) {
      await saveApiKey(key);
    }
    await saveBYOKConfig(newConfig);
    setConfig(newConfig);
    setHasKey(!!key && newConfig.isEnabled);
    setInsightError(null);
  }, []);

  const clearConfiguration = useCallback(async () => {
    await removeStoredKey();
    const resetCfg = { ...DEFAULT_BYOK_CONFIG, isEnabled: false };
    await saveBYOKConfig(resetCfg);
    setConfig(resetCfg);
    setHasKey(false);
    setCachedInsights(null);
    setInsightError(null);
  }, []);

  const fetchGenerativeInsights = useCallback(async (metrics: ClientMetricsContext) => {
    const key = await getApiKey();
    if (!key || !config.isEnabled) {
      return null;
    }

    setIsLoadingInsights(true);
    setInsightError(null);

    try {
      const client = new OpenAIClient(config.baseUrl, key, config.model, config.provider);
      const res = await client.generateInsights(metrics);
      setCachedInsights(res);
      return res;
    } catch (err: any) {
      const errMsg = err?.message || 'Failed to fetch AI insights.';
      setInsightError(errMsg);
      console.warn('[BYOKContext] Insight generation failed:', errMsg);
      return null;
    } finally {
      setIsLoadingInsights(false);
    }
  }, [config]);

  return (
    <BYOKContext.Provider
      value={{
        config,
        hasKey,
        isTesting,
        isLoadingInsights,
        cachedInsights,
        insightError,
        saveConfiguration,
        clearConfiguration,
        testConnection,
        fetchGenerativeInsights,
      }}
    >
      {children}
    </BYOKContext.Provider>
  );
}

export function useBYOK(): BYOKContextType {
  const ctx = useContext(BYOKContext);
  if (!ctx) {
    throw new Error('useBYOK must be used within a BYOKProvider');
  }
  return ctx;
}
