import { getClientInstance } from '../../client/store.js';
import type { MatcherState } from '@vitest/expect';
import type {
  FileReference,
  ImageSnapshotOptions,
} from '@react-native-harness/bridge';
import { getHarnessContext } from '../../runner/index.js';

declare module '@vitest/expect' {
  interface Matchers {
    toMatchImageSnapshot(options: ImageSnapshotOptions): Promise<void>;
  }
}

export async function toMatchImageSnapshot(
  this: MatcherState,
  received: FileReference,
  options: ImageSnapshotOptions
): Promise<{ pass: boolean; message: () => string }> {
  const client = getClientInstance();
  const context = getHarnessContext();
  const result = await client.rpc['test.matchImageSnapshot'](
    received,
    context.testFilePath,
    options,
    context.runner
  );

  return {
    pass: result.pass,
    message: () => result.message,
  };
}
