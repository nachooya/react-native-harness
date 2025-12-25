import { HarnessPlatform } from '@react-native-harness/platforms';
import {
  type WebPlatformConfig,
} from './config.js';


export const webPlatform = (
  config: WebPlatformConfig
): HarnessPlatform<WebPlatformConfig> => ({
  name: config.name,
  config,
  runner: import.meta.resolve('./runner.js'),
});