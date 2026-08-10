import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { FontFamily } from '../../constants/typography';
import { useBYOK } from '../../store/BYOKContext';
import { BYOKConfig, ProviderPreset, getApiKey } from '../../storage/secureKeyStorage';

interface BYOKConfigModalProps {
  visible: boolean;
  onClose: () => void;
}

const PROVIDER_PRESETS: {
  id: ProviderPreset;
  label: string;
  baseUrl: string;
  defaultModel: string;
  hint: string;
}[] = [
  {
    id: 'openai',
    label: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
    hint: 'Official OpenAI key (sk-...)',
  },
  {
    id: 'openrouter',
    label: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    defaultModel: 'openai/gpt-4o-mini',
    hint: 'Unified access to multiple models (sk-or-v1-...)',
  },
  {
    id: 'deepseek',
    label: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    defaultModel: 'deepseek-chat',
    hint: 'High efficiency reasoning key (sk-...)',
  },
  {
    id: 'groq',
    label: 'Groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    defaultModel: 'llama-3.3-70b-versatile',
    hint: 'Ultra-fast Llama inference (gsk_...)',
  },
  {
    id: 'custom',
    label: 'Custom / Local',
    baseUrl: 'http://localhost:11434/v1',
    defaultModel: 'llama3',
    hint: 'Custom reverse proxy or local Ollama endpoint',
  },
];

export function BYOKConfigModal({ visible, onClose }: BYOKConfigModalProps) {
  const { config, saveConfiguration, clearConfiguration, testConnection, hasKey, isTesting } = useBYOK();

  const [provider, setProvider] = useState<ProviderPreset>(config.provider);
  const [apiKey, setApiKey] = useState<string>('');
  const [baseUrl, setBaseUrl] = useState<string>(config.baseUrl);
  const [model, setModel] = useState<string>(config.model);
  const [showKey, setShowKey] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success?: boolean; message?: string } | null>(null);

  useEffect(() => {
    if (visible) {
      let isMounted = true;
      (async () => {
        const storedKey = await getApiKey();
        if (isMounted) {
          if (storedKey) setApiKey(storedKey);
          setProvider(config.provider);
          setBaseUrl(config.baseUrl);
          setModel(config.model);
          setTestResult(null);
        }
      })();
      return () => {
        isMounted = false;
      };
    }
  }, [visible, config]);

  const handleSelectPreset = (pId: ProviderPreset) => {
    const preset = PROVIDER_PRESETS.find((p) => p.id === pId);
    if (preset) {
      setProvider(pId);
      setBaseUrl(preset.baseUrl);
      setModel(preset.defaultModel);
      setTestResult(null);
    }
  };

  const handleTestConnection = async () => {
    if (!apiKey.trim()) {
      Alert.alert('Key Required', 'Please enter an API key to test the connection.');
      return;
    }

    const testCfg: BYOKConfig = {
      provider,
      baseUrl: baseUrl.trim(),
      model: model.trim(),
      isEnabled: true,
    };

    const res = await testConnection(apiKey, testCfg);
    setTestResult(res);
  };

  const handleSave = async () => {
    if (!apiKey.trim()) {
      Alert.alert('API Key Required', 'Please enter a valid API key to enable Enhanced AI Insights.');
      return;
    }

    const newConfig: BYOKConfig = {
      provider,
      baseUrl: baseUrl.trim(),
      model: model.trim(),
      isEnabled: true,
    };

    await saveConfiguration(apiKey, newConfig);
    Alert.alert('Key Configured', 'Your API key has been saved securely on device. Enhanced AI Insights unlocked!');
    onClose();
  };

  const handleRemoveKey = async () => {
    Alert.alert('Remove API Key', 'Are you sure you want to delete your stored API key?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await clearConfiguration();
          setApiKey('');
          setTestResult(null);
          onClose();
        },
      },
    ]);
  };

  const activePreset = PROVIDER_PRESETS.find((p) => p.id === provider);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Configure API Key (BYOK)</Text>
              <Text style={styles.subtitle}>Bring Your Own Key for Enhanced Generative AI</Text>
            </View>
            <Pressable style={styles.closeBtn} onPress={onClose} accessibilityLabel="Close modal">
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.scrollBody} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Security Notice */}
            <View style={styles.securityNotice}>
              <Text style={styles.securityIcon}>🔒</Text>
              <Text style={styles.securityText}>
                Zero Server Telemetry: Your key is encrypted directly on your device (iOS Keychain / Android Keystore) and never sent to any server other than your specified API endpoint.
              </Text>
            </View>

            {/* Provider Preset selector */}
            <Text style={styles.label}>1. Select AI Provider</Text>
            <View style={styles.presetRow}>
              {PROVIDER_PRESETS.map((p) => (
                <Pressable
                  key={p.id}
                  style={[styles.presetChip, provider === p.id && styles.presetChipActive]}
                  onPress={() => handleSelectPreset(p.id)}
                >
                  <Text style={[styles.presetText, provider === p.id && styles.presetTextActive]}>
                    {p.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Key input */}
            <Text style={styles.label}>2. API Key ({activePreset?.hint || 'Key'})</Text>
            <View style={styles.keyInputRow}>
              <TextInput
                style={styles.keyInput}
                value={apiKey}
                onChangeText={setApiKey}
                placeholder="sk-..."
                placeholderTextColor={Colors.textMuted}
                secureTextEntry={!showKey}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Pressable style={styles.eyeBtn} onPress={() => setShowKey(!showKey)}>
                <Text style={{ fontSize: 16 }}>{showKey ? '👁️' : '🙈'}</Text>
              </Pressable>
            </View>

            {/* Base URL */}
            <Text style={styles.label}>3. Endpoint Base URL</Text>
            <TextInput
              style={styles.textInput}
              value={baseUrl}
              onChangeText={setBaseUrl}
              placeholder="https://api.openai.com/v1"
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
            />

            {/* Model Name */}
            <Text style={styles.label}>4. Model Name</Text>
            <TextInput
              style={styles.textInput}
              value={model}
              onChangeText={setModel}
              placeholder="gpt-4o-mini"
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
            />

            {/* Connection Test Result */}
            {testResult && (
              <View style={[styles.testBox, testResult.success ? styles.testSuccess : styles.testError]}>
                <Text style={styles.testIcon}>{testResult.success ? '✅' : '⚠️'}</Text>
                <Text style={[styles.testMessage, { color: testResult.success ? '#065F46' : '#991B1B' }]}>
                  {testResult.message}
                </Text>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.btnRow}>
              <Pressable
                style={[styles.testBtn, isTesting && { opacity: 0.6 }]}
                onPress={handleTestConnection}
                disabled={isTesting}
              >
                {isTesting ? (
                  <ActivityIndicator size="small" color={Colors.accentBlue} />
                ) : (
                  <Text style={styles.testBtnText}>⚡ Test Connection</Text>
                )}
              </Pressable>

              <Pressable style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveBtnText}>Save Key & Unlock</Text>
              </Pressable>
            </View>

            {hasKey && (
              <Pressable style={styles.removeBtn} onPress={handleRemoveKey}>
                <Text style={styles.removeBtnText}>🗑️ Remove Stored API Key</Text>
              </Pressable>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(11, 15, 23, 0.7)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingTop: 18,
    paddingBottom: 24,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.2, shadowRadius: 16 },
      android: { elevation: 20 },
      default: {},
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: 18,
    fontFamily: FontFamily.bold,
    color: Colors.primary,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
    color: Colors.textSecondary,
  },
  scrollBody: {
    maxHeight: 520,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  securityNotice: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  securityIcon: {
    fontSize: 18,
  },
  securityText: {
    flex: 1,
    fontSize: 11.5,
    fontFamily: FontFamily.regular,
    color: '#166534',
    lineHeight: 16,
  },
  label: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: Colors.primary,
    marginTop: 10,
    marginBottom: 8,
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 6,
  },
  presetChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  presetChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  presetText: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: Colors.textBody,
  },
  presetTextActive: {
    color: '#FFFFFF',
    fontFamily: FontFamily.bold,
  },
  keyInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    backgroundColor: Colors.background,
    paddingRight: 10,
  },
  keyInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: FontFamily.medium,
    color: Colors.primary,
  },
  eyeBtn: {
    padding: 6,
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    backgroundColor: Colors.background,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: FontFamily.medium,
    color: Colors.primary,
  },
  testBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    marginTop: 14,
  },
  testSuccess: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  testError: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  testIcon: {
    fontSize: 16,
  },
  testMessage: {
    flex: 1,
    fontSize: 12,
    fontFamily: FontFamily.medium,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  testBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.accentBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  testBtnText: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: Colors.accentBlue,
  },
  saveBtn: {
    flex: 1.5,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: '#FFFFFF',
  },
  removeBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 10,
  },
  removeBtnText: {
    fontSize: 12,
    fontFamily: FontFamily.semiBold,
    color: Colors.danger,
  },
});
