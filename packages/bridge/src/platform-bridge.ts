import type {
  ElementReference,
  HarnessPlatformRunner,
} from '@react-native-harness/platforms';
import type { BridgeServerFunctions } from './shared.js';

export const createPlatformBridgeFunctions = (
  platformRunner: HarnessPlatformRunner
): Partial<BridgeServerFunctions> => {
  return {
    'platform.actions.tap': async (x: number, y: number) => {
      await platformRunner.actions.tap(x, y);
    },
    'platform.actions.inputText': async (text: string) => {
      await platformRunner.actions.inputText(text);
    },
    'platform.actions.tapElement': async (element: ElementReference) => {
      await platformRunner.actions.tapElement(element);
    },
    'platform.actions.screenshot': async () => {
      return await platformRunner.actions.screenshot();
    },
    'platform.queries.getUiHierarchy': async () => {
      return await platformRunner.queries.getUiHierarchy();
    },
    'platform.queries.findByTestId': async (testId: string) => {
      return await platformRunner.queries.findByTestId(testId);
    },
    'platform.queries.findAllByTestId': async (testId: string) => {
      return await platformRunner.queries.findAllByTestId(testId);
    },
  };
};
