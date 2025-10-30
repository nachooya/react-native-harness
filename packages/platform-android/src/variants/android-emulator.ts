import type { HarnessPlatformInstance } from '@react-native-harness/platforms';
import { logger, wait } from '@react-native-harness/tools';
import * as adb from '../adb.js';
import * as avd from '../avd.js';
import assert from 'node:assert';
import {
  AndroidPlatformConfig,
  assertAndroidDeviceEmulator,
} from '../config.js';

const getEmulatorAdbId = async (
  name: string,
  timeout = 10000
): Promise<string | null> => {
  const startTime = Date.now();

  while (startTime + timeout > Date.now()) {
    const adbIds = await adb.getDeviceIds();

    for (const adbId of adbIds) {
      const emulatorName = await adb.getEmulatorName(adbId);

      if (emulatorName === name) {
        return adbId;
      }
    }

    await wait(1000);
  }

  return null;
};

const DEFAULT_EMULATOR_OPTIONS = [
  '-no-snapshot-save',
  '-no-window',
  '-gpu',
  'swiftshader_indirect',
  '-noaudio',
  '-no-boot-anim',
  '-camera-back',
  'none',
];

const DEFAULT_SNAPSHOT_NAME = 'default_boot';

const createEmulatorSnapshot = async (avdName: string): Promise<void> => {
  await avd.launchEmulator(
    avdName,
    DEFAULT_EMULATOR_OPTIONS.filter((option) => option !== '-no-snapshot-save')
  );
  const adbId = await getEmulatorAdbId(avdName);

  assert(adbId, 'ADB ID not found for emulator');

  await adb.waitForBootCompleted(adbId);
  await adb.stopEmulator(adbId);
};

export const getAndroidEmulatorPlatformVariant = async (
  config: AndroidPlatformConfig
): Promise<HarnessPlatformInstance> => {
  assertAndroidDeviceEmulator(config.device);

  let adbId = await getEmulatorAdbId(config.device.name);
  let wasEmulatorLaunched = false;

  if (!adbId) {
    const doesEmulatorExist = await avd.doesEmulatorExist(config.device.name);

    if (!doesEmulatorExist) {
      logger.info(`Creating emulator ${config.device.name}`);
      await avd.createEmulator(
        config.device.name,
        'system-images;android-35;google_apis;arm64-v8a',
        'pixel_7'
      );
    } else {
      const hasSnapshot = await avd.hasEmulatorSnapshot(
        config.device.name,
        DEFAULT_SNAPSHOT_NAME
      );

      if (!hasSnapshot) {
        logger.info(`Creating emulator snapshot ${config.device.name}`);
        await createEmulatorSnapshot(config.device.name);
      }
    }

    logger.info(`Launching emulator ${config.device.name}`);
    await avd.launchEmulator(config.device.name, DEFAULT_EMULATOR_OPTIONS);

    adbId = await getEmulatorAdbId(config.device.name);
    assert(adbId, 'ADB ID not found for emulator');

    await adb.waitForBootCompleted(adbId);
    wasEmulatorLaunched = true;
    logger.info(`Emulator ${config.device.name} launched`);
  } else {
    logger.info(`Emulator ${config.device.name} already running`);
  }

  logger.info(`Reversing ports for emulator ${config.device.name}`);
  await Promise.all([
    adb.reversePort(adbId, 8081),
    adb.reversePort(adbId, 8080),
    adb.reversePort(adbId, 3001),
  ]);

  return {
    startApp: async () => {
      await adb.startApp(adbId, config.bundleId, config.activityName);
    },
    restartApp: async () => {
      await adb.stopApp(adbId, config.bundleId);
      await adb.startApp(adbId, config.bundleId, config.activityName);
    },
    stopApp: async () => {
      await adb.stopApp(adbId, config.bundleId);
    },
    dispose: async () => {
      // Clean up the emulator if it was launched by us
      if (wasEmulatorLaunched) {
        await adb.stopEmulator(adbId);
      }
    },
  };
};
