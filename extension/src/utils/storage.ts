import { browser } from 'wxt/browser';
import type { Settings } from '../types';

const DEFAULT_SETTINGS: Settings = {
  githubToken: '',
  gistId: '',
  apiSecret: '',
  webUrl: '',
  autoSync: false,
  syncDelay: 5,
  theme: 'brutalist',
  aiApiKey: '',
  aiApiUrl: '',
  aiModel: '',
  jinaApiKey: ''
};

const SETTING_KEYS = Object.keys(DEFAULT_SETTINGS) as (keyof Settings)[];

export async function getSettings(): Promise<Settings> {
  const localSettings = await browser.storage.local.get(SETTING_KEYS);
  const mergedLocal = { ...DEFAULT_SETTINGS, ...localSettings } as Settings;

  const needsMigration = !localSettings.githubToken && !localSettings.gistId && !localSettings.webUrl;
  if (needsMigration) {
    const syncSettings = await browser.storage.sync.get(DEFAULT_SETTINGS);
    const migrated = { ...DEFAULT_SETTINGS, ...syncSettings, ...localSettings } as Settings;
    await browser.storage.local.set(migrated);
    return migrated;
  }

  return mergedLocal;
}

export async function saveSettings(settings: Partial<Settings>): Promise<void> {
  await browser.storage.local.set(settings);
}
