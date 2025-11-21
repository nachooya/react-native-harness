import type {
  ElementReference,
  FileReference,
} from '@react-native-harness/bridge';
import { getClientInstance } from '../client/store.js';

export type Screen = {
  findByTestId: (testId: string) => Promise<ElementReference>;
  findAllByTestId: (testId: string) => Promise<ElementReference[]>;
  screenshot: (name?: string) => Promise<FileReference>;
};

const createScreen = (): Screen => {
  return {
    findByTestId: async (testId: string): Promise<ElementReference> => {
      const client = getClientInstance();
      return await client.rpc['platform.queries.findByTestId'](testId);
    },
    findAllByTestId: async (testId: string): Promise<ElementReference[]> => {
      const client = getClientInstance();
      return await client.rpc['platform.queries.findAllByTestId'](testId);
    },
    screenshot: async (): Promise<FileReference> => {
      const client = getClientInstance();
      return await client.rpc['platform.actions.screenshot']();
    },
  };
};

export const screen = createScreen();
