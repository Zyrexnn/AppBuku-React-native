import '@expo/metro-runtime';
import React from 'react';
import { View } from 'react-native';
import { PaperProvider, MD3LightTheme } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import BooksScreen from './src/screens/BooksScreen';

const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#007aff',
    secondary: '#0056b3',
  },
};

export default function App() {
  return (
    <SafeAreaProvider style={{ flex: 1 }}>
      <PaperProvider theme={theme}>
        <View style={{ flex: 1 }}>
          <BooksScreen />
        </View>
      </PaperProvider>
    </SafeAreaProvider>
  );
}