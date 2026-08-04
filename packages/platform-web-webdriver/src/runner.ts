import {
  createAppSessionEmitter,
  createBoundedLogBuffer,
  type AppSession,
  type AppSessionState,
  type HarnessPlatformRunnerFactory,
} from '@react-native-harness/platforms';
import type { Config as HarnessConfig } from '@react-native-harness/config';
import WebDriver from 'webdriver';
import logger from '@wdio/logger';
import { createBridge } from './bridge.js';
import { WebDriverPlatformConfigSchema, type WebDriverPlatformConfig } from './config.js';

type WebDriverClient = Awaited<ReturnType<typeof WebDriver.newSession>>;

type BrowserLogEntry = {
  level: string;
  message: string;
};

// Annotated with HarnessPlatformRunnerFactory so a drift from the harness's
// call convention -- `module.default(platform.config, runtimeConfig, init)` --
// fails to typecheck here instead of throwing at session setup. The 1.2 build
// of this package predated that type and took `(config, init?)`, which silently
// bound the harness config to `init`.
const getWebRunner: HarnessPlatformRunnerFactory<
  WebDriverPlatformConfig,
  HarnessConfig
> = async (config, _harnessConfig, init) => {
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
  const logBuffer = createBoundedLogBuffer();

  const drainBrowserLogs = async (action: string) => {
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
        logBuffer.push(`${entry.level} ${entry.message}`);
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

  // safaridriver (transitive via @wdio/utils) holds a module-level singleton that
  // makes its next start() throw "There is already a Safaridriver instance
  // running on port N!" until reset, even after the child process is dead.
  // stop() kills the child and clears the singleton; no-op when the module
  // isn't installed (non-Safari setups).
  const resetSafaridriverSingleton = async () => {
    try {
      const mod = (await import('safaridriver')) as {
        stop?: () => void;
        default?: { stop?: () => void };
      };
      (mod.stop ?? mod.default?.stop)?.();
    } catch {
      // safaridriver unavailable; nothing to reset.
    }
  };

  const teardownSession = async () => {
    if (client) {
      try {
        await client.deleteSession();
      } catch {
        // Session may already be gone; proceed to reset the driver singleton anyway.
      }
      client = null;
    }
    await resetSafaridriverSingleton();
  };

  // Session-lifetime signal (see HarnessPlatformInitOptions.signal): tear the
  // WebDriver session down on session teardown, in addition to the normal
  // dispose() path. Without this, a SIGINT mid-run leaves an orphaned browser
  // and a live chromedriver/geckodriver/safaridriver child behind.
  const teardownOnAbort = () => {
    bridge.stop();
    void teardownSession();
  };
  if (init.signal.aborted) {
    teardownOnAbort();
  } else {
    init.signal.addEventListener('abort', teardownOnAbort, { once: true });
  }

  return {
    createAppSession: async (): Promise<AppSession> => {
      // The harness disposes the previous session before asking for a new one,
      // but relaunching is what makes an environment reset a real reset, so
      // guard against a stale client either way.
      await teardownSession();
      await launchBrowser();
      bridge.start();

      const emitter = createAppSessionEmitter();
      let state: AppSessionState = { status: 'running' };

      return {
        dispose: async () => {
          if (state.status === 'disposed') {
            return;
          }

          state = { status: 'disposed', occurredAt: Date.now() };
          await drainBrowserLogs('Dispose app session');
          emitter.clear();
          bridge.stop();
          await teardownSession();
        },
        getState: async () => state,
        getLogs: () => logBuffer.getLogs(),
        // WebDriver has no push equivalent of Playwright's `page.on('close')`,
        // and probing the session on a timer would contend with in-flight
        // commands, so an externally-closed browser is surfaced by the failing
        // command rather than by an `app_exited` event. The 1.2 polling monitor
        // only ever compared `client !== null` -- a variable this module owns --
        // so it could not detect that either; nothing is lost here.
        addListener: emitter.addListener,
        removeListener: emitter.removeListener,
      };
    },
    dispose: async () => {
      await drainBrowserLogs('Dispose');
      bridge.stop();
      await teardownSession();
    },
  };
};

export default getWebRunner;
