const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// 🚫 Ignoramos la carpeta de Cloud Functions (Node.js)
config.watchFolders = [
    path.resolve(__dirname, 'src'),
];
config.resolver = {
    ...config.resolver,
    blacklistRE: /functions\/.*/,
};

module.exports = config;
