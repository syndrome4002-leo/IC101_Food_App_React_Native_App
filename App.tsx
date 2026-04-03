import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import SplashScreen from './src/screens/SplashScreen';
import CategoriesScreen from './src/screens/CategoriesScreen';
import FoodsScreen from './src/screens/FoodsScreen';
import FoodSearchScreen from './src/screens/FoodSearchScreen';
import AIHelpScreen from './src/screens/AIHelpScreen';
import { RootStackParamList } from './src/types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="Categories" component={CategoriesScreen} />
          <Stack.Screen name="Foods" component={FoodsScreen} />
          <Stack.Screen name="FoodSearch" component={FoodSearchScreen} />
          <Stack.Screen name="AIHelp" component={AIHelpScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
