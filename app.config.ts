import type { ConfigContext, ExpoConfig } from 'expo/config';

export default function appConfig({ config }: ConfigContext): ExpoConfig {
  const projectId = process.env.EAS_PROJECT_ID;
  const updateUrl = process.env.EAS_UPDATE_URL;
  const applicationId = process.env.ANDROID_APPLICATION_ID;
  return {
    ...config,
    name: config.name ?? 'Fut Manager',
    slug: config.slug ?? 'fut_manager_app_mobile',
    android: { ...config.android, ...(applicationId ? { package: applicationId } : {}) },
    extra: { ...config.extra, ...(projectId ? { eas: { projectId } } : {}) },
    updates: updateUrl ? { enabled: true, url: updateUrl, checkAutomatically: 'ON_LOAD', fallbackToCacheTimeout: 0 } : { enabled: false },
  };
}
