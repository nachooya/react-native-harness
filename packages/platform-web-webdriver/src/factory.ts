import { HarnessPlatform } from '@react-native-harness/platforms';
import {
  type WebDriverPlatformConfig,
  type WebDriverBrowserConfig,
} from './config.js';

export const webDriverPlatform = (
  config: WebDriverPlatformConfig
): HarnessPlatform<WebDriverPlatformConfig> => ({
  name: config.name,
  config,
  runner: import.meta.resolve('./runner.js'),
  platformId: 'web',
  getResourceLockKey: () =>
    `web-webdriver:browser:${config.browser.browserName}`,
});

export const chrome = (
  url: string,
  options: Partial<Omit<WebDriverBrowserConfig, 'browserName' | 'url'>> = {}
): WebDriverBrowserConfig => ({
  browserName: 'chrome',
  url,
  showLogs: false,
  ...options,
});

export const firefox = (
  url: string,
  options: Partial<Omit<WebDriverBrowserConfig, 'browserName' | 'url'>> = {}
): WebDriverBrowserConfig => ({
  browserName: 'firefox',
  url,
  showLogs: false,
  ...options,
});

export const safari = (
  url: string,
  options: Partial<Omit<WebDriverBrowserConfig, 'browserName' | 'url'>> = {}
): WebDriverBrowserConfig => ({
  browserName: 'safari',
  url,
  showLogs: false,
  ...options,
});

export const edge = (
  url: string,
  options: Partial<Omit<WebDriverBrowserConfig, 'browserName' | 'url'>> = {}
): WebDriverBrowserConfig => ({
  browserName: 'MicrosoftEdge',
  url,
  showLogs: false,
  ...options,
});
