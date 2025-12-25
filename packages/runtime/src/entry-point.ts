import { AppRegistry, Platform } from 'react-native';
import { getHarnessGlobal } from './globals.js';
import { UI } from './ui/index.js';

AppRegistry.registerComponent(
  getHarnessGlobal().appRegistryComponentName,
  () => UI
);

if (Platform.OS === 'web') {
  AppRegistry.runApplication(getHarnessGlobal().appRegistryComponentName, {
    rootTag: document.getElementById('root'),
  });
}
