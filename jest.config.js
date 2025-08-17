module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|@testing-library|react-clerk|@clerk|expo|@expo|react-native-reanimated|@react-native-picker|@react-native-async-storage|@react-native-community|@react-native-firebase|@react-navigation|@unimodules|unimodules|sentry-expo|native-base|react-native-svg|react-native-vector-icons|react-native-safe-area-context|react-native-screens|react-native-gesture-handler|react-native-reanimated|react-native-paper|@gorhom|@shopify|@ptomasroos|@expo/vector-icons)/)'
  ],
  moduleNameMapper: {
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/__mocks__/fileMock.js',
    '\\.(css|less)$': '<rootDir>/__mocks__/styleMock.js',
  },
}; 