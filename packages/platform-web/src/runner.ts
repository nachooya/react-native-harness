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

  if (parsedConfig.showLogs) {
    capabilities['goog:chromeOptions'] = {
      args: ['--auto-open-devtools-for-tabs'],
    };
    capabilities['goog:loggingPrefs'] = {
      browser: 'ALL', 
    };
    capabilities['moz:firefoxOptions'] = {
      log: { level: 'trace' },
    };
    capabilities.loggingPrefs = {
      browser: 'ALL', 
    };
  }

  const hostOptions: Partial<{
    hostname: string;
    port: number;
  }> = {};

  if (parsedConfig.hostname) hostOptions.hostname = parsedConfig.hostname;
  if (parsedConfig.port !== undefined) hostOptions.port = parsedConfig.port;

  const client = await WebDriver.newSession({
    ...hostOptions,
    path: '/',
    logLevel: 'warn',
    capabilities,
  });

  const printLogs = async (action: string) => {
    if (parsedConfig.showLogs) {
      console.log(`${action} - browser logs:`);
      const logs = (await client.getLogs('browser')) as any[];
      for (const entry of logs) {
        console.log(entry.level, entry.message);
      }
    }
  };

  return {
    startApp: async () => {
      await client.navigateTo(parsedConfig.appUrl);
    },
    restartApp: async () => {
      printLogs('Restart app');
      await client.navigateTo(parsedConfig.appUrl);
    },
    stopApp: async () => {
      printLogs('Stop app');
      await client.navigateTo('about:blank');
    },
    dispose: async () => {
      printLogs('Dispose');
      await client.deleteSession();
    },
  };
};

export default getWebRunner;
