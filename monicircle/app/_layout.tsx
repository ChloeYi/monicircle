import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-reanimated';

import { AuthProvider, useAuth } from '@/context/auth';
import { LanguageProvider } from '@/context/language';
import { TourProvider } from '@/context/tour';
import TourOverlay from '@/components/TourOverlay';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <TourProvider>
          <RootNavigator />
          <TourOverlay />
        </TourProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

function RootNavigator() {
  const { state } = useAuth();
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem('onboarding_v1').then((val) => {
      setOnboardingDone(val === 'done');
    });
  }, []);

  useEffect(() => {
    if (state.status !== 'loading' && onboardingDone !== null) {
      SplashScreen.hideAsync();
    }
  }, [state.status, onboardingDone]);

  if (state.status === 'loading' || onboardingDone === null) return null;

  const isAuthed = state.status === 'authenticated';
  const showOnboarding = !isAuthed && !onboardingDone;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={isAuthed}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="group" options={{ headerShown: false }} />
        <Stack.Screen name="member" options={{ headerShown: false }} />
        <Stack.Screen name="discover" options={{ headerShown: false }} />
        <Stack.Screen name="faq" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={showOnboarding}>
        <Stack.Screen name="onboarding" options={{ animation: 'none' }} />
      </Stack.Protected>
      <Stack.Protected guard={!isAuthed}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}
