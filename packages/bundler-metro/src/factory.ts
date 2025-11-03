import {
  getReactNativeCliPath,
  getExpoCliPath,
  spawn,
  logger,
  SubprocessError,
} from '@react-native-harness/tools';
import type { ChildProcess } from 'child_process';
import { isPortAvailable } from './utils.js';
import {
  MetroPortUnavailableError,
  MetroBundlerNotReadyError,
} from './errors.js';
import { METRO_PORT } from './constants.js';
import type { MetroEvents, MetroInstance } from './types.js';
import assert from 'node:assert';
import { createRequire } from 'node:module';
import { EventEmitter, getEmitter } from './emitter.js';

const require = createRequire(import.meta.url);

const getMetroEventsEmitter = (
  metro: ChildProcess
): EventEmitter<MetroEvents> => {
  const emitter = getEmitter<MetroEvents>();
  const customPipe = metro.stdio[3];
  assert(customPipe, 'customPipe is required');

  customPipe.on('data', (data) => {
    const text = data.toString().split('\n');

    for (const line of text) {
      if (line.trim() === '') {
        continue;
      }

      try {
        const event = JSON.parse(line);
        emitter.emit(event);
      } catch (error) {
        logger.error('Failed to parse event', error);
      }
    }
  });

  return emitter;
};

const waitForReady = (
  emitter: EventEmitter<MetroEvents>,
  timeoutMs = 60000
): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    const listener = (event: MetroEvents) => {
      if (event.type === 'initialize_done') {
        resolve();
      }
    };
    emitter.addListener(listener);

    setTimeout(() => {
      emitter.removeListener(listener);
      reject(new MetroBundlerNotReadyError(timeoutMs));
    }, timeoutMs);
  });
};

export const getMetroInstance = async (
  isExpo = false
): Promise<MetroInstance> => {
  const metro = spawn(
    'node',
    [
      isExpo ? getExpoCliPath() : getReactNativeCliPath(),
      'start',
      '--port',
      METRO_PORT.toString(),
      '--customLogReporterPath',
      require.resolve('../assets/reporter.cjs'),
    ],
    {
      stdio: ['ignore', 'pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        RN_HARNESS: 'true',
        ...(isExpo && { EXPO_NO_METRO_WORKSPACE_ROOT: 'true' }),
      },
    }
  );

  const isDefaultPortAvailable = await isPortAvailable(METRO_PORT);

  if (!isDefaultPortAvailable) {
    throw new MetroPortUnavailableError(METRO_PORT);
  }

  const childProcess = await metro.nodeChildProcess;
  const eventsEmitter = getMetroEventsEmitter(childProcess);

  // Forward events to logger
  eventsEmitter.addListener((event) => logger.debug(JSON.stringify(event)));

  metro.catch((error) => {
    // This process is going to be killed by us, so we don't need to throw an error
    if (error instanceof SubprocessError && error.signalName === 'SIGTERM') {
      return;
    }

    logger.error('Metro crashed unexpectedly', error);
  });

  // Wait for Metro to be ready by monitoring stdout for "Dev server ready."
  await waitForReady(eventsEmitter);

  return {
    events: eventsEmitter,
    dispose: async () => {
      const isKilled = childProcess.kill('SIGTERM');

      if (!isKilled) {
        childProcess.kill('SIGKILL');
      }
    },
  };
};
