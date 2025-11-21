import {
  DeviceNotFoundError,
  AppNotInstalledError,
  ElementReference,
  HarnessPlatformRunner,
} from '@react-native-harness/platforms';
import {
  AndroidPlatformConfigSchema,
  type AndroidPlatformConfig,
} from './config.js';
import { getAdbId } from './adb-id.js';
import * as adb from './adb.js';
import {
  getDeviceName,
  parseUiHierarchy,
  findByTestId,
  findAllByTestId,
  getElementByPath,
} from './utils.js';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';

const getAndroidRunner = async (
  config: AndroidPlatformConfig
): Promise<HarnessPlatformRunner> => {
  const parsedConfig = AndroidPlatformConfigSchema.parse(config);
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

  const getUiHierarchy = async () => {
    const xmlString = await adb.getUiHierarchy(adbId);
    return parseUiHierarchy(xmlString);
  };

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
    queries: {
      getUiHierarchy,
      findByTestId: async (testId: string) => {
        return await findByTestId(getUiHierarchy, testId);
      },
      findAllByTestId: async (testId: string) => {
        return await findAllByTestId(getUiHierarchy, testId);
      },
    },
    actions: {
      tap: async (x: number, y: number) => {
        await adb.tap(adbId, x, y);
      },
      inputText: async (text: string) => {
        await adb.inputText(adbId, text);
      },
      tapElement: async (element: ElementReference) => {
        // Query hierarchy again to get current state
        const hierarchy = await getUiHierarchy();

        // Get element by path identifier
        const uiElement = getElementByPath(hierarchy, element.id);

        if (!uiElement) {
          throw new Error(
            `Element with identifier "${element.id}" not found in UI hierarchy. The element may have been removed or the UI may have changed.`
          );
        }

        // Calculate center coordinates
        const centerX = uiElement.rect.x + uiElement.rect.width / 2;
        const centerY = uiElement.rect.y + uiElement.rect.height / 2;

        // Tap at center
        await adb.tap(adbId, centerX, centerY);
      },
      screenshot: async () => {
        const tempPath = join(
          tmpdir(),
          `harness-screenshot-${randomUUID()}.png`
        );
        await adb.screenshot(adbId, tempPath);
        return { path: tempPath };
      },
    },
  };
};

export default getAndroidRunner;
