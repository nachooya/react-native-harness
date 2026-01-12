import type { CodeFrame } from '@react-native-harness/bridge';
import { Platform } from 'react-native';
import parseErrorStack from 'react-native/Libraries/Core/Devtools/parseErrorStack';
import symbolicateStackTrace from 'react-native/Libraries/Core/Devtools/symbolicateStackTrace';

export const getCodeFrame = async (error: Error): Promise<CodeFrame | null> => {
  if (Platform.OS === 'web') {
    return null;
  }
  const parsedStack = parseErrorStack(error.stack);
  const symbolicatedStack = await symbolicateStackTrace(parsedStack);

  if (!('codeFrame' in symbolicatedStack) || !symbolicatedStack.codeFrame) {
    return null;
  }

  const codeFrame = symbolicatedStack.codeFrame as CodeFrame;

  // Normalize optionality (null -> undefined)
  return {
    ...codeFrame,
    location: codeFrame.location
      ? {
          ...codeFrame.location,
        }
      : undefined,
  };
};
