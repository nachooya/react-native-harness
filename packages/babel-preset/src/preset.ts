import globalRnHarnessPlugin from './global-plugin';
import resolveWeakPlugin from './resolve-weak-plugin';

export const rnHarnessPreset = (api: import('@babel/core').ConfigAPI) => {
  const isEnabled = !!process.env.RN_HARNESS;

  api.cache.using(() => isEnabled);

  if (!isEnabled) {
    // Not a Harness build, so we don't need to do anything
    return { plugins: [] };
  }

  return {
    plugins: [
      '@babel/plugin-transform-class-static-block',
      globalRnHarnessPlugin,
      resolveWeakPlugin,
    ],
  };
};
