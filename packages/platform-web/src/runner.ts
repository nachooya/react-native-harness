import WebDriver from 'webdriver';
import { HarnessPlatformRunner } from '@react-native-harness/platforms';
import { WebPlatformConfigSchema, type WebPlatformConfig } from './config.js';
import logger from '@wdio/logger';

const logLevel = !process.env.HARNESS_DEBUG ? 'silent' : 'info';

logger.setLogLevelsConfig({
  webdriver: logLevel,
  '@wdio/utils': logLevel,
  chromedriver: logLevel,
  geckodriver: logLevel,
});

const getWebRunner = async (
  config: WebPlatformConfig
): Promise<HarnessPlatformRunner> => {

  const parsedConfig = WebPlatformConfigSchema.parse(config);

  const capabilities: Record<string, any> = {
    browserName: parsedConfig.browserName,
  };

  const client = await WebDriver.newSession({
    path: '/',
    logLevel: 'warn',
    capabilities,
  });

  return {
    startApp: async () => {
      await client.navigateTo(parsedConfig.appUrl);
    },
    restartApp: async () => {
      await client.navigateTo(parsedConfig.appUrl);
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
