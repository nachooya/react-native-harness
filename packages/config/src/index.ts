export { getConfig } from './reader.js';
export type {
  Config,
  TestRunnerConfig,
  Platform,
  BrowserType,
  AndroidTestRunnerConfig,
  iOSTestRunnerConfig,
  WebTestRunnerConfig,
  VegaTestRunnerConfig,
} from './types.js';
export {
  ConfigValidationError,
  ConfigNotFoundError,
  ConfigLoadError,
} from './errors.js';
export {
  isAndroidRunnerConfig,
  isIOSRunnerConfig,
  isWebRunnerConfig,
  isVegaRunnerConfig,
  assertAndroidRunnerConfig,
  assertIOSRunnerConfig,
  assertWebRunnerConfig,
  assertVegaRunnerConfig,
} from './types.js';
