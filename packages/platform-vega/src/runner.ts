import {
  DeviceNotFoundError,
  AppNotInstalledError,
  HarnessPlatformRunner,
} from '@react-native-harness/platforms';
import { VegaPlatformConfigSchema, type VegaPlatformConfig } from './config.js';
import * as kepler from './kepler.js';

const getVegaRunner = async (
  config: VegaPlatformConfig
): Promise<HarnessPlatformRunner> => {
  const parsedConfig = VegaPlatformConfigSchema.parse(config);
  const deviceId = parsedConfig.device.deviceId;
  const bundleId = parsedConfig.bundleId;
  const deviceStatus = await kepler.getVegaDeviceStatus(deviceId);

  if (deviceStatus === 'stopped') {
    throw new DeviceNotFoundError(deviceId);
  }

  const isInstalled = await kepler.isAppInstalled(deviceId, bundleId);

  if (!isInstalled) {
    throw new AppNotInstalledError(bundleId, deviceId);
  }

  return {
    startApp: async () => {
      await kepler.startApp(deviceId, bundleId);
    },
    restartApp: async () => {
      await kepler.stopApp(deviceId, bundleId);
      await kepler.startApp(deviceId, bundleId);
    },
    stopApp: async () => {
      await kepler.stopApp(deviceId, bundleId);
    },
    dispose: async () => {
      await kepler.stopApp(deviceId, bundleId);
    },
    queries: {
      getUiHierarchy: async () => {
        throw new Error('Not implemented yet');
      },
      findByTestId: async () => {
        throw new Error('Not implemented yet');
      },
      findAllByTestId: async () => {
        throw new Error('Not implemented yet');
      },
    },
    actions: {
      tap: async () => {
        throw new Error('Not implemented yet');
      },
      inputText: async () => {
        throw new Error('Not implemented yet');
      },
      tapElement: async () => {
        throw new Error('Not implemented yet');
      },
    },
  };
};

export default getVegaRunner;
