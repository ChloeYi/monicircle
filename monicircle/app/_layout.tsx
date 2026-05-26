import { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
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

  useEffect(() => {
    if (state.status !== 'loading') {
      SplashScreen.hideAsync();
    }
  }, [state.status]);

  if (state.status === 'loading') return null;

  const isAuthed = state.status === 'authenticated';
  const needsProfile = state.status === 'needs-profile';

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={isAuthed}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="group" options={{ headerShown: false }} />
        <Stack.Screen name="member" options={{ headerShown: false }} />
        <Stack.Screen name="discover" options={{ headerShown: false }} />
        <Stack.Screen name="faq" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={!isAuthed}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}
