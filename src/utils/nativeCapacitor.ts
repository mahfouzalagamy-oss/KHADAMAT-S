import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';

export async function initNativeCapacitorShell(): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  try {
    await StatusBar.setStyle({ style: Style.Dark });
  } catch {
    // StatusBar style may be controlled natively on Android 15+ edge-to-edge
  }

  try {
    await SplashScreen.hide({ fadeOutDuration: 250 });
  } catch {
    // Ignore if splash screen already hidden
  }
}
