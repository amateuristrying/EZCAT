const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add .db and .wasm to assetExts to enable Metro bundling cat_questions.db and expo-sqlite wasm assets
if (!config.resolver.assetExts.includes('db')) {
  config.resolver.assetExts.push('db');
}
if (!config.resolver.assetExts.includes('wasm')) {
  config.resolver.assetExts.push('wasm');
}

module.exports = config;
