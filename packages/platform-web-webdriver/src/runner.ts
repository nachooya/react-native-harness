import WebDriver, { Client } from 'webdriver';
import { HarnessPlatformRunner } from '@react-native-harness/platforms';
import { WebDriverPlatformConfigSchema, type WebDriverPlatformConfig } from './config.js';
import logger from '@wdio/logger';

const logLevel = !process.env.HARNESS_DEBUG ? 'silent' : 'info';

logger.setLogLevelsConfig({
  webdriver: logLevel,
  '@wdio/utils': logLevel,
  chromedriver: logLevel,
  geckodriver: logLevel,
});

const getWebRunner = async (
  config: WebDriverPlatformConfig
): Promise<HarnessPlatformRunner> => {
  const parsedConfig = WebDriverPlatformConfigSchema.parse(config);

  const capabilities: Record<string, any> = {
    browserName: parsedConfig.browserName,
  };

  if (parsedConfig.showLogs) {
    capabilities['goog:loggingPrefs'] = {
      browser: 'ALL',
    };
    capabilities['moz:firefoxOptions'] = {
      log: { level: 'trace' },
    };
  }

  const hostOptions: Partial<{
    hostname: string;
    port: number;
  }> = {};

  if (parsedConfig.hostname) hostOptions.hostname = parsedConfig.hostname;
  if (parsedConfig.port !== undefined) hostOptions.port = parsedConfig.port;

  let client: Client | null = null;

  const printLogs = async (action: string) => {
    // Not available in all drivers
    if (
      client &&
      parsedConfig.showLogs &&
      typeof client.getLogs === 'function'
    ) {
      console.log(`${action} - browser logs:`);
      const logs = (await client.getLogs('browser')) as any[];
      for (const entry of logs) {
        console.log(entry.level, entry.message);
      }
    }
  };

  const launchBrowser = async () => {
    client = await WebDriver.newSession({
      ...hostOptions,
      path: '/',
      logLevel: 'warn',
      capabilities,
    });
    await client.navigateTo(parsedConfig.appUrl);
  };

  return {
    startApp: async () => {
      if (!client) {
        await launchBrowser();
      }
    },
    restartApp: async () => {
      printLogs('Restart app');
      if (client) {
        await client.refresh();
      } else {
        await launchBrowser();
      }
    },
    stopApp: async () => {
      printLogs('Stop app');
      if (client) {
        await client.deleteSession();
        client = null;
      }
    },
    dispose: async () => {
      printLogs('Dispose');
      if (client) {
        await client.deleteSession();
        client = null;
      }
    },
    isAppRunning: async () => {
      return client !== null;
    },
  };
};

export default getWebRunner;
