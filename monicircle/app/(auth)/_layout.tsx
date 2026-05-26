import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/auth';

export default function AuthLayout() {
  const { state } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (state.status === 'needs-profile') {
      router.replace('/(auth)/profile-setup');
    }
  }, [state.status]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="profile-setup" />
    </Stack>
  );
}
