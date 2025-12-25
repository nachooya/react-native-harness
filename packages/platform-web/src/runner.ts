import { HarnessPlatformRunner } from '@react-native-harness/platforms';
import WebDriver from 'webdriver';
import { WebPlatformConfigSchema, type WebPlatformConfig } from './config.js';

const getWebRunner = async (
  config: WebPlatformConfig
): Promise<HarnessPlatformRunner> => {
  const parsedConfig = WebPlatformConfigSchema.parse(config);

  const client = await WebDriver.newSession({
    path: '/',
    capabilities: { browserName: parsedConfig.browserName },
    logLevel: 'warn',
  });
  return {
    startApp: async () => {
      await client.navigateTo(parsedConfig.appUrl);
    },
    restartApp: async () => {
      await client.refresh();
    },
    stopApp: async () => {
      await client.navigateTo('about:blank');
    },
    dispose: async () => {
      await client.deleteSession();
    },
  };
};

export default getWebRunner;
