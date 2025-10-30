import {
  DeviceNotFoundError,
  AppNotInstalledError,
  HarnessPlatform,
} from '@react-native-harness/platforms';
import {
  AndroidPlatformConfigSchema,
  type AndroidEmulator,
  type AndroidPlatformConfig,
  type PhysicalAndroidDevice,
  type AndroidEmulatorHardwareProfile,
  isAndroidDeviceEmulator,
} from './config.js';
import { getAdbId } from './adb-id.js';
import * as adb from './adb.js';
import { getDeviceName } from './utils.js';
import { getAndroidEmulatorPlatformVariant } from './variants/android-emulator.js';

export const androidEmulator = (
  name: string,
  hardwareProfile: AndroidEmulatorHardwareProfile
): AndroidEmulator => ({
  type: 'emulator',
  name,
  hardwareProfile,
});

export const physicalAndroidDevice = (
  manufacturer: string,
  model: string
): PhysicalAndroidDevice => ({
  type: 'physical',
  manufacturer: manufacturer.toLowerCase(),
  model: model.toLowerCase(),
});

export const androidPlatform = (
  config: AndroidPlatformConfig
): HarnessPlatform => ({
  name: config.name,
  getInstance: async () => {
    const parsedConfig = AndroidPlatformConfigSchema.parse(config);

    if (isAndroidDeviceEmulator(parsedConfig.device)) {
      return await getAndroidEmulatorPlatformVariant(parsedConfig);
    }

    const adbId = await getAdbId(parsedConfig.device);

    if (!adbId) {
      throw new DeviceNotFoundError(getDeviceName(parsedConfig.device));
    }

    const isInstalled = await adb.isAppInstalled(adbId, parsedConfig.bundleId);

    if (!isInstalled) {
      throw new AppNotInstalledError(
        parsedConfig.bundleId,
        getDeviceName(parsedConfig.device)
      );
    }

    await Promise.all([
      adb.reversePort(adbId, 8081),
      adb.reversePort(adbId, 8080),
      adb.reversePort(adbId, 3001),
    ]);

    return {
      startApp: async () => {
        await adb.startApp(
          adbId,
          parsedConfig.bundleId,
          parsedConfig.activityName
        );
      },
      restartApp: async () => {
        await adb.stopApp(adbId, parsedConfig.bundleId);
        await adb.startApp(
          adbId,
          parsedConfig.bundleId,
          parsedConfig.activityName
        );
      },
      stopApp: async () => {
        await adb.stopApp(adbId, parsedConfig.bundleId);
      },
      dispose: async () => {
        await adb.stopApp(adbId, parsedConfig.bundleId);
      },
    };
  },
});
