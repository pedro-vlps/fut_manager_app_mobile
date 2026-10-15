import { createContext, PropsWithChildren, useContext, useSyncExternalStore } from 'react';
import { Platform, useWindowDimensions } from 'react-native';
import { isMobileBrowser, responsiveLayout } from '@/services/responsive-layout';

type Responsive = ReturnType<typeof responsiveLayout>;
const ResponsiveContext = createContext<Responsive | null>(null);

function subscribe(callback: () => void) {
  if (Platform.OS !== 'web') return () => {};
  window.addEventListener('pageshow', callback);
  window.addEventListener('focus', callback);
  return () => { window.removeEventListener('pageshow', callback); window.removeEventListener('focus', callback); };
}

function getSnapshot() {
  if (Platform.OS !== 'web') return true;
  const browser = navigator as Navigator & { userAgentData?: { mobile?: boolean } };
  return isMobileBrowser({ userAgent: browser.userAgent, platform: browser.platform, maxTouchPoints: browser.maxTouchPoints, mobile: browser.userAgentData?.mobile });
}

export function ResponsiveProvider({ children }: PropsWithChildren) {
  const { width } = useWindowDimensions();
  const mobileBrowser = useSyncExternalStore(subscribe, getSnapshot, () => true);
  const layout = responsiveLayout(width, mobileBrowser);
  return <ResponsiveContext.Provider value={layout}>{children}</ResponsiveContext.Provider>;
}

export function useResponsive() {
  const value = useContext(ResponsiveContext);
  if (!value) throw new Error('useResponsive deve ser usado dentro de ResponsiveProvider.');
  return value;
}
