import {
  AppNotInstalledError,
  DeviceNotFoundError,
  HarnessPlatformRunner,
} from '@react-native-harness/platforms';
import {
  ApplePlatformConfig,
  assertAppleDevicePhysical,
  assertAppleDeviceSimulator,
} from './config.js';
import * as simctl from './xcrun/simctl.js';
import * as devicectl from './xcrun/devicectl.js';
import { getDeviceName } from './utils.js';
import { color, logger } from '@react-native-harness/tools';

export const getAppleSimulatorPlatformInstance = async (
  config: ApplePlatformConfig
): Promise<HarnessPlatformRunner> => {
  assertAppleDeviceSimulator(config.device);

  const logTag = color.bgMagentaBright('[AppleSimulatorPlatform]');

  let udid;
  let deviceName = '';
  if (config.device.name && config.device.systemVersion) {
    deviceName = getDeviceName(config.device);
    udid = await simctl.getSimulatorId(
      config.device.name,
      config.device.systemVersion
    );
    if (!udid) {
      throw new DeviceNotFoundError(getDeviceName(config.device));
    }
  } else {
    let selectedSimulator;
    let simulators = await simctl.getSimulators();
    // Filter only iOS devices
    const prefix = 'com.apple.CoreSimulator.SimRuntime.';
    simulators = simulators
      .filter((s) =>
        s.runtime.startsWith('com.apple.CoreSimulator.SimRuntime.iOS')
      )
      .map((s) => ({
        ...s,
        runtime: s.runtime.slice(prefix.length),
      }));

    // Filter only available devices
    simulators = simulators.filter((simulator) => simulator.isAvailable);
    simulators.forEach((simulator) => {
      logger.debug(
        `${logTag}: Found simulator id: ${color.bold(simulator.udid)} ${color.bgBlue(
          '[' + simulator.name + ' - ' + simulator.runtime + ']'
        )} - State: ${simulator.state}`
      );
    });
    if (simulators.length === 0) {
      throw new DeviceNotFoundError('any');
    } else {
      // Prefer booted simulator
      selectedSimulator = simulators.find(
        (simulator) => simulator.state === 'Booted'
      );
      if (!selectedSimulator) {
        selectedSimulator = simulators[0];
      }

      udid = selectedSimulator.udid;
      deviceName = `${selectedSimulator.name} (${selectedSimulator.runtime}) (simulator)`;

      logger.info(
        `${logTag}: Selected simulator id: ${color.bold(
          selectedSimulator.udid
        )} ${color.bgBlue(
          '[' + selectedSimulator.name + ' - ' + selectedSimulator.runtime + ']'
        )} - State: ${selectedSimulator.state}`
      );
    }
  }

  const isInstalled = await simctl.isAppInstalled(udid, config.bundleId);

  if (!isInstalled) {
    throw new AppNotInstalledError(config.bundleId, deviceName);
  }

  const simulatorStatus = await simctl.getSimulatorStatus(udid);

  if (simulatorStatus !== 'Booted') {
    throw new Error('Simulator is not booted');
  }

  const isAvailable = await simctl.isAppInstalled(udid, config.bundleId);

  if (!isAvailable) {
    throw new AppNotInstalledError(
      config.bundleId,
      getDeviceName(config.device)
    );
  }

  return {
    startApp: async () => {
      await simctl.startApp(udid, config.bundleId);
    },
    restartApp: async () => {
      await simctl.stopApp(udid, config.bundleId);
      await simctl.startApp(udid, config.bundleId);
    },
    stopApp: async () => {
      await simctl.stopApp(udid, config.bundleId);
    },
    dispose: async () => {
      await simctl.stopApp(udid, config.bundleId);
    },
  };
};

const getDeviceString = (device: devicectl.AppleDeviceInfo) => {
  return color.bgBlue(
    `[${device.deviceProperties.name} - ${device.hardwareProperties.marketingName} - ${device.hardwareProperties.productType} - OS: ${device.deviceProperties.osVersionNumber}]`
  );
};

export const getApplePhysicalDevicePlatformInstance = async (
  config: ApplePlatformConfig
): Promise<HarnessPlatformRunner> => {
  assertAppleDevicePhysical(config.device);

  const logTag = color.bgMagentaBright('[ApplePhysicalDevicePlatform]');
  let deviceId;
  let deviceName = '';

  if (config.device.name) {
    deviceName = getDeviceName(config.device);
    deviceId = await devicectl.getDeviceId(config.device.name);
    if (!deviceId) {
      throw new DeviceNotFoundError(getDeviceName(config.device));
    }
  } else {
    const devicesIds = await devicectl.listDevices();
    devicesIds.forEach((device) => {
      logger.info(
        `${logTag} Found device id: ${color.bold(
          device.identifier
        )} ${getDeviceString(device)}`
      );
    });
    if (devicesIds.length === 0) {
      throw new DeviceNotFoundError('any');
    } else {
      const selectedDevice = devicesIds[0];
      deviceId = selectedDevice.identifier;
      deviceName = `${selectedDevice.deviceProperties.name} (${selectedDevice.deviceProperties.osVersionNumber}) (physical)`;

      logger.info(
        `${logTag} Selected device id: ${color.bold(
          selectedDevice.identifier
        )} ${getDeviceString(selectedDevice)}`
      );
    }
  }

  if (!deviceId) {
    throw new DeviceNotFoundError(deviceName);
  }

  const isAvailable = await devicectl.isAppInstalled(deviceId, config.bundleId);

  if (!isAvailable) {
    throw new AppNotInstalledError(config.bundleId, deviceName);
  }

  return {
    startApp: async () => {
      await devicectl.startApp(deviceId, config.bundleId);
    },
    restartApp: async () => {
      await devicectl.stopApp(deviceId, config.bundleId);
      await devicectl.startApp(deviceId, config.bundleId);
    },
    stopApp: async () => {
      await devicectl.stopApp(deviceId, config.bundleId);
    },
    dispose: async () => {
      await devicectl.stopApp(deviceId, config.bundleId);
    },
  };
};
