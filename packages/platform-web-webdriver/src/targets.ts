import { RunTarget } from '@react-native-harness/platforms';

export const getRunTargets = async (): Promise<RunTarget[]> => {
  return [
    {
      type: 'browser',
      name: 'Chrome',
      platform: 'web',
      description: 'WebDriver Chrome browser',
      device: { browserType: 'chromium' },
    },
    {
      type: 'browser',
      name: 'Firefox',
      platform: 'web',
      description: 'WebDriver Firefox browser',
      device: { browserType: 'firefox' },
    },
    {
      type: 'browser',
      name: 'Safari',
      platform: 'web',
      description: 'WebDriver Safari browser',
      device: { browserType: 'webkit' },
    },
  ];
};
