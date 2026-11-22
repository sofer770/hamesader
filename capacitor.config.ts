import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'il.co.elhabriut.hamesader',
  appName: 'המסדר',
  webDir: 'dist',
  android: { backgroundColor: '#FBF8F3' },
  plugins: {
    // Self-hosted updates from el-habriut.co.il/hamesader/app (no external update service, no stats sent)
    CapacitorUpdater: { autoUpdate: false, statsUrl: '', appReadyTimeout: 15000 },
    LocalNotifications: { smallIcon: 'ic_stat_notify', iconColor: '#3B2E8A', sound: 'reminder.wav' },
  },
};

export default config;
