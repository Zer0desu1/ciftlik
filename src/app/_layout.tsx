import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/plus-jakarta-sans';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { EventToast } from '@/components/event-toast';
import { useGame } from '@/game/store';
import { C } from '@/theme';

SplashScreen.preventAutoHideAsync();

/**
 * Drives the farm's clock: one tick a second while the app is open, and a
 * catch-up tick whenever it comes back to the foreground, so whatever grew
 * while the phone was in a pocket is there on return.
 */
function useGameClock(ready: boolean) {
  useEffect(() => {
    if (!ready) return;
    const tick = () => useGame.getState().tick(Date.now());
    tick();
    const timer = setInterval(tick, 1000);
    const sub = AppState.addEventListener('change', (s) => s === 'active' && tick());
    return () => {
      clearInterval(timer);
      sub.remove();
    };
  }, [ready]);
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });
  const [hydrated, setHydrated] = useState(useGame.persist.hasHydrated());

  useEffect(() => {
    if (hydrated) return;
    return useGame.persist.onFinishHydration(() => setHydrated(true));
  }, [hydrated]);

  const ready = fontsLoaded && hydrated;
  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);
  useGameClock(ready);

  if (!ready) return null;

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.page }, animation: 'slide_from_right' }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
      <EventToast />
    </SafeAreaProvider>
  );
}
