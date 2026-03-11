import { Stack, router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useEffect } from 'react';

export default function AppLayout() {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [user, isLoading]);

  if (!user) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="vehicle-reporting" />
      <Stack.Screen name="documents-submission" />
      <Stack.Screen name="hpod" />
    </Stack>
  );
}
