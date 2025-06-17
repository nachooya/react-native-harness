import {
  assertVegaRunnerConfig,
  TestRunnerConfig,
} from '@react-native-harness/config';
import { logger } from '@react-native-harness/tools';

import { type PlatformAdapter } from '../platform-adapter.js';
import {
  isAppInstalled,
  getVegaDeviceStatus,
  isVegaDeviceConnected,
  startVirtualDevice,
  stopVirtualDevice,
  startPortForwarding,
  stopPortForwarding,
} from './device.js';
import { runApp, killApp } from './build.js';
import { killWithAwait } from '../../process.js';
import { runMetro } from '../../bundlers/metro.js';
import { AppNotInstalledError } from '../../errors/errors.js';

const vegaPlatformAdapter: PlatformAdapter = {
  name: 'vega',
  getEnvironment: async (runner: TestRunnerConfig) => {
    assertVegaRunnerConfig(runner);

    let shouldStopVirtualDevice = false;

    // Check if the specific Vega device is available
    const deviceStatus = await getVegaDeviceStatus(runner.deviceId);
    logger.debug(`Vega device ${runner.deviceId} status: ${deviceStatus}`);

    if (deviceStatus === 'stopped') {
      logger.debug('Starting Vega Virtual Device system');
      await startVirtualDevice();
      shouldStopVirtualDevice = true;

      // Wait a bit for the device to become available
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    // Verify device is now connected
    const isConnected = await isVegaDeviceConnected(runner.deviceId);
    if (!isConnected) {
      throw new Error(
        `Vega device ${runner.deviceId} is not available. Make sure the virtual device is configured and running.`
      );
    }

    // Start Metro bundler
    const metroPromise = runMetro();

    // Set up port forwarding for debugging (similar to Android)
    await Promise.all([
      startPortForwarding(runner.deviceId, 8081, false), // reverse port forwarding for JS debugging
      startPortForwarding(runner.deviceId, 8080, false),
      startPortForwarding(runner.deviceId, 3001, false),
    ]);
    logger.debug('Port forwarding established');

    // Check if app is installed
    const isInstalled = await isAppInstalled(runner.deviceId, runner.bundleId);
    logger.debug(`App is installed: ${isInstalled}`);

    if (!isInstalled) {
      throw new AppNotInstalledError(runner.deviceId, runner.bundleId, 'vega');
    }

    logger.debug('Waiting for Metro to start');
    const metro = await metroPromise;
    logger.debug('Metro started');

    logger.debug('Running Vega app');
    await runApp(runner.deviceId, runner.bundleId);
    logger.debug('Vega app running');

    return {
      restart: async () => {
        await runApp(runner.deviceId, runner.bundleId);
      },
      dispose: async () => {
        // Kill the app
        await killApp(runner.deviceId, runner.bundleId);

        // Stop port forwarding
        await Promise.all([
          stopPortForwarding(runner.deviceId, 8081, false),
          stopPortForwarding(runner.deviceId, 8080, false),
          stopPortForwarding(runner.deviceId, 3001, false),
        ]).catch((error) => {
          // Don't fail disposal if port forwarding cleanup fails
          logger.debug(`Port forwarding cleanup failed: ${error.message}`);
        });

        // Stop Virtual Device if we started it
        if (shouldStopVirtualDevice) {
          await stopVirtualDevice();
        }

        // Kill Metro
        await killWithAwait(metro);
      },
    };
  },
};

export default vegaPlatformAdapter;
