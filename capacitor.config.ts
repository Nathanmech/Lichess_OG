/// <reference types="@capacitor/splash-screen" />
import { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'org.lichess.mobileapp',
  appName: 'lichess',
  bundledWebRuntime: false,
  webDir: 'www',
  backgroundColor: '000000ff',
  // keeps the "Lichobile/" marker so lichess.org can still tell what this is
  appendUserAgent: 'Lichobile/7.15.2-og',
  plugins: {
    SplashScreen: {
      androidSplashResourceName: 'launch_splash',
      launchAutoHide: false,
      useDialog: false,
    },
  },
  ios: {
    scheme: 'lichess',
  }
}

export default config

