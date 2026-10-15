import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '@/contexts/auth';
import { palette } from '@/components/fut-ui';
import { ResponsiveProvider } from '@/contexts/responsive';
import DesktopShell from '@/components/desktop-shell';

function Navigation() {
  const { session } = useAuth();
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: palette.background } }}>
    <Stack.Protected guard={!session}><Stack.Screen name="login" /></Stack.Protected>
    <Stack.Protected guard={!!session}><Stack.Screen name="index" /><Stack.Screen name="profile" /><Stack.Screen name="trophies" /><Stack.Screen name="find-group" options={{ presentation: 'modal' }} /><Stack.Screen name="explore" /><Stack.Screen name="groups" /><Stack.Screen name="create" /><Stack.Screen name="clubs" /><Stack.Screen name="championships/index" /><Stack.Screen name="championships/history" /><Stack.Screen name="championships/match" /><Stack.Screen name="championships/team" /><Stack.Screen name="championships/player" /><Stack.Screen name="championships/[championshipId]" /></Stack.Protected>
  </Stack>;
}
export default function RootLayout() {
  return <AuthProvider><ResponsiveProvider><StatusBar style="dark" /><DesktopShell><Navigation /></DesktopShell></ResponsiveProvider></AuthProvider>;
}
