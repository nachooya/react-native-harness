// This is adapted version of https://github.com/vitest-dev/vitest/blob/main/packages/vitest/src/integrations/chai/setup.ts
// Credits to Vitest team for the original implementation.

import {
  JestAsymmetricMatchers,
  JestChaiExpect,
  JestExtend,
} from '@vitest/expect';
import * as chai from 'chai';

chai.use(JestExtend);
chai.use(JestChaiExpect);
chai.use(JestAsymmetricMatchers);
