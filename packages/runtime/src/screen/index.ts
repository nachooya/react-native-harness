import type { ElementReference } from '@react-native-harness/bridge';
import { getClientInstance } from '../client/store.js';

export type Screen = {
  findByTestId: (testId: string) => Promise<ElementReference>;
  findAllByTestId: (testId: string) => Promise<ElementReference[]>;
};

const createScreen = (): Screen => {
  return {
    findByTestId: async (testId: string): Promise<ElementReference> => {
      const client = getClientInstance();
      return await (
        client.rpc as unknown as {
          'platform.queries.findByTestId': (
            testId: string
          ) => Promise<ElementReference>;
        }
      )['platform.queries.findByTestId'](testId);
    },
    findAllByTestId: async (testId: string): Promise<ElementReference[]> => {
      const client = getClientInstance();
      return await (
        client.rpc as unknown as {
          'platform.queries.findAllByTestId': (
            testId: string
          ) => Promise<ElementReference[]>;
        }
      )['platform.queries.findAllByTestId'](testId);
    },
  };
};

export const screen = createScreen();
