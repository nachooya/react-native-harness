import type { ComponentType } from 'react';

/**
 * Returns the React Native Harness component for injection.
 *
 * This function dynamically requires the harness component to avoid bundling
 * issues and ensure it's loaded when needed.
 */
const getHarnessComponent = (): ComponentType<unknown> => {
  return require('@react-native-harness/runtime').ReactNativeHarness;
};

/**
 * Patches React Native CLI's AppRegistry to inject the harness component.
 *
 * This function intercepts the standard React Native component registration process
 * and substitutes the user's app component with the React Native Harness component.
 * The original registration flow is preserved, but the harness takes control
 * of the app initialization to provide testing/development capabilities.
 */
const hijackReactNativeAppRegistry = (): void => {
  // Dynamically import React Native to avoid bundling issues
  const { AppRegistry } =
    require('react-native') as typeof import('react-native');

  // Store reference to the original registration method
  const originalRegisterComponent =
    AppRegistry.registerComponent.bind(AppRegistry);

  // Override the registerComponent method to substitute the harness component
  // while preserving the original registration behavior
  AppRegistry.registerComponent = (key, _, section) => {
    return originalRegisterComponent(key, getHarnessComponent, section);
  };
};

/**
 * Patches Expo's registerRootComponent to inject the harness component.
 *
 * This function attempts to intercept Expo's root component registration process
 * and substitutes the user's app component with the React Native Harness component.
 * The original registration flow is preserved, but the harness takes control
 * of the app initialization. Since Expo may not be installed in all environments,
 * this is wrapped in a try-catch block.
 */
const hijackExpoRootComponent = (): void => {
  try {
    // Dynamically import Expo to check if it's available
    const expoModule = require('expo') as {
      registerRootComponent: (component: ComponentType<unknown>) => void;
    };

    // Store reference to the original registration method
    const originalRegisterRootComponent =
      expoModule.registerRootComponent.bind(expoModule);

    // Override Expo's registerRootComponent to use the harness component
    // while preserving the original registration behavior
    expoModule.registerRootComponent = () => {
      return originalRegisterRootComponent(getHarnessComponent());
    };
  } catch {
    // Silently ignore if Expo is not installed
    // This is expected behavior when Expo is not present in the project
  }
};

/**
 * Injects the React Native Harness into the app initialization process.
 *
 * This function performs the necessary patches to hijack both React Native CLI
 * and Expo component registration mechanisms, ensuring that the harness
 * takes control of the app startup regardless of which platform tooling is used.
 * The harness component is substituted for the user's original component while
 * preserving the original registration flow.
 */
const injectHarness = (): void => {
  hijackReactNativeAppRegistry();
  hijackExpoRootComponent();
};

// Execute the harness injection immediately when this module is loaded
injectHarness();
