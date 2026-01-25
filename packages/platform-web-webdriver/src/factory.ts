import { HarnessPlatform } from '@react-native-harness/platforms';
import { WebDriverPlatformConfig } from './index.js';


export const webDriverPlatform = (
  config: WebDriverPlatformConfig
): HarnessPlatform<WebDriverPlatformConfig> => ({
  name: config.name,
  config,
  runner: import.meta.resolve('./runner.js'),
});