import {
  type AppMonitor,
  type AppMonitorEvent,
  type CreateAppMonitorOptions,
  type HarnessPlatformInitOptions,
  HarnessPlatformRunner,
} from '@react-native-harness/platforms';
import { getEmitter } from '@react-native-harness/tools';
import WebDriver from 'webdriver';
import logger from '@wdio/logger';
import { createBridge } from './bridge.js';
import { WebDriverPlatformConfigSchema, type WebDriverPlatformConfig } from './config.js';

type WebDriverClient = Awaited<ReturnType<typeof WebDriver.newSession>>;

type BrowserLogEntry = {
  level: string;
  message: string;
};

const createPollingAppMonitor = ({
  interval,
  isAppRunning,
}: {
  interval: number;
  isAppRunning: () => Promise<boolean>;
}): AppMonitor => {
  const emitter = getEmitter<AppMonitorEvent>();
  let timer: NodeJS.Timeout | null = null;
  let started = false;
  let wasRunning = false;

  const start = async () => {
    if (started) {
      return;
    }

    started = true;
    wasRunning = await isAppRunning();

    timer = setInterval(async () => {
      const running = await isAppRunning();

      if (running && !wasRunning) {
        emitter.emit({ type: 'app_started', source: 'polling' });
      } else if (!running && wasRunning) {
        emitter.emit({ type: 'app_exited', source: 'polling' });
      }

      wasRunning = running;
    }, interval);
  };

  const stop = async () => {
    started = false;

    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  };

  const dispose = async () => {
    await stop();
    emitter.clearAllListeners();
  };

  return {
    start,
    stop,
    dispose,
    addListener: emitter.addListener,
    removeListener: emitter.removeListener,
  };
};

const getWebRunner = async (
  config: WebDriverPlatformConfig,
  init?: HarnessPlatformInitOptions
): Promise<HarnessPlatformRunner> => {
  void init;
  const parsedConfig = WebDriverPlatformConfigSchema.parse(config);

  const logLevel = process.env.HARNESS_DEBUG ? 'info' : 'silent';
  logger.setLogLevelsConfig({
    webdriver: logLevel,
    '@wdio/utils': logLevel,
    chromedriver: logLevel,
    geckodriver: logLevel,
  });

  const capabilities: Record<string, unknown> = {
    browserName: parsedConfig.browser.browserName,
    ...(parsedConfig.browser.capabilities ?? {}),
  };

  if (parsedConfig.browser.showLogs) {
    capabilities['goog:loggingPrefs'] = { browser: 'ALL' };
    capabilities['moz:firefoxOptions'] = {
      ...((capabilities['moz:firefoxOptions'] as Record<string, unknown>) ?? {}),
      log: { level: 'trace' },
    };
  }

  let client: WebDriverClient | null = null;

  const bridge = createBridge({ getClient: () => client });

  const printLogs = async (action: string) => {
    if (
      !client ||
      !parsedConfig.browser.showLogs ||
      typeof (client as { getLogs?: unknown }).getLogs !== 'function'
    ) {
      return;
    }

    try {
      const logs = (await (
        client as unknown as { getLogs: (type: string) => Promise<BrowserLogEntry[]> }
      ).getLogs('browser')) as BrowserLogEntry[];
      if (logs.length === 0) return;
      console.log(`${action} - browser logs:`);
      for (const entry of logs) {
        console.log(entry.level, entry.message);
      }
    } catch {
      // Driver does not support reading logs; ignore.
    }
  };

  const launchBrowser = async () => {
    client = await WebDriver.newSession({
      hostname: parsedConfig.browser.hostname,
      port: parsedConfig.browser.port,
      path: parsedConfig.browser.path ?? '/',
      protocol: parsedConfig.browser.protocol,
      logLevel: 'warn',
      capabilities,
    });

    await client.navigateTo(parsedConfig.browser.url);
  };

  return {
    startApp: async () => {
      if (!client) {
        await launchBrowser();
      }
      bridge.start();
    },
    restartApp: async () => {
      await printLogs('Restart app');
      if (client) {
        await client.refresh();
      } else {
        await launchBrowser();
      }
      bridge.start();
    },
    stopApp: async () => {
      await printLogs('Stop app');
      bridge.stop();
      if (client) {
        await client.deleteSession();
        client = null;
      }
    },
    dispose: async () => {
      await printLogs('Dispose');
      bridge.stop();
      if (client) {
        await client.deleteSession();
        client = null;
      }
    },
    isAppRunning: async () => {
      return client !== null;
    },
    createAppMonitor: (options?: CreateAppMonitorOptions) => {
      void options;
      return createPollingAppMonitor({
        interval: 250,
        isAppRunning: async () => client !== null,
      });
    },
  };
};

export default getWebRunner;
