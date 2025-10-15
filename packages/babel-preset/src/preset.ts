import globalRnHarnessPlugin from './global-plugin';
import resolveWeakPlugin from './resolve-weak-plugin';

export const rnHarnessPreset = () => {
  // Unfortunately, the Babel preset must be enabled at all times (at least for now).
  return {
    plugins: [
      '@babel/plugin-transform-class-static-block',
      globalRnHarnessPlugin,
      resolveWeakPlugin,
    ],
  };
};
