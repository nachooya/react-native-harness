import type { ElementReference } from '@react-native-harness/bridge';
import { getClientInstance } from '../client/store.js';

export type UserEvent = {
  tap: (element: ElementReference) => Promise<void>;
};

const createUserEvent = (): UserEvent => {
  return {
    tap: async (element: ElementReference): Promise<void> => {
      const client = getClientInstance();
      await (
        client.rpc as unknown as {
          'platform.actions.tapElement': (
            element: ElementReference
          ) => Promise<void>;
        }
      )['platform.actions.tapElement'](element);
    },
  };
};

export const userEvent = createUserEvent();
