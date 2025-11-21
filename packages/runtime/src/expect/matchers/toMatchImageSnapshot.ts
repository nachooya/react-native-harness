import { getClientInstance } from '../../client/store.js';
import type { MatcherState } from '@vitest/expect';
import type {
  FileReference,
  ImageSnapshotOptions,
} from '@react-native-harness/bridge';
import { expect } from '../index.js';

declare module '@vitest/expect' {
  interface Matchers {
    toMatchImageSnapshot(options: ImageSnapshotOptions): Promise<void>;
  }
}

expect.extend({
  toMatchImageSnapshot,
});

async function toMatchImageSnapshot(
  this: MatcherState,
  received: FileReference,
  options: ImageSnapshotOptions
): Promise<{ pass: boolean; message: () => string }> {
  const client = getClientInstance();
  const result = await client.rpc['test.matchImageSnapshot'](
    received,
    globalThis['HARNESS_TEST_PATH'],
    options
  );

  return {
    pass: result.pass,
    message: () => result.message,
  };
}
