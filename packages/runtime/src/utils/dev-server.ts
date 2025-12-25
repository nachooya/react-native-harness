import { Platform } from 'react-native';
import getDevServer from 'react-native/Libraries/Core/Devtools/getDevServer';

export const getDevServerUrl = (): string => {
  if (Platform.OS === 'web') {
    return `${window.location.origin}/`;
  } else {
    const devServer = getDevServer();
    return devServer.url;
  }
};
