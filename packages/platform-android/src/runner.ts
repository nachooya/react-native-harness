import {
  DeviceNotFoundError,
  AppNotInstalledError,
  HarnessPlatformRunner,
} from '@react-native-harness/platforms';
import { Config } from '@react-native-harness/config';
import {
  AndroidPlatformConfigSchema,
  type AndroidPlatformConfig,
} from './config.js';
import { getAdbId } from './adb-id.js';
import * as adb from './adb.js';
import { getDeviceName } from './utils.js';
import { color, logger } from '@react-native-harness/tools';

const getAndroidRunner = async (
  config: AndroidPlatformConfig,
  harnessConfig: Config
): Promise<HarnessPlatformRunner> => {
  const parsedConfig = AndroidPlatformConfigSchema.parse(config);

  const logTag = color.bgMagentaBright('[AndroidRunner]');

  let adbId;
  let deviceName = '';
  if (parsedConfig.device) {
    adbId = await getAdbId(parsedConfig.device);
    deviceName = getDeviceName(parsedConfig.device);

    if (!adbId) {
      throw new DeviceNotFoundError(getDeviceName(parsedConfig.device));
    }
  } else {
    const devicesIds = await adb.getDeviceIds();
    if (devicesIds.length === 0) {
      throw new DeviceNotFoundError('No android device found');
    }

    for (const deviceId of devicesIds) {
      const deviceInfo = await adb.getDeviceInfo(deviceId);
      logger.debug(
        `${logTag} Found device id: ${color.bold(deviceId)} ${color.bgBlue(
          '[' + deviceInfo?.manufacturer + ' - ' + deviceInfo?.model + ']'
        )}`
      );
    }
    adbId = devicesIds[0];
    const selectedDeviceInfo = await adb.getDeviceInfo(adbId);
    deviceName = `${selectedDeviceInfo?.manufacturer} ${selectedDeviceInfo?.model}`;
    logger.info(
      `${logTag} Selected device id: ${color.bold(adbId)} ${color.bgBlue(
        '[' +
          selectedDeviceInfo?.manufacturer +
          ' - ' +
          selectedDeviceInfo?.model +
          ']'
      )}`
    );
  }

  const isInstalled = await adb.isAppInstalled(adbId, parsedConfig.bundleId);

  if (!isInstalled) {
    throw new AppNotInstalledError(parsedConfig.bundleId, deviceName);
  }

  await Promise.all([
    adb.reversePort(adbId, 8081),
    adb.reversePort(adbId, 8080),
    adb.reversePort(adbId, harnessConfig.webSocketPort),
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
};

export default getAndroidRunner;
