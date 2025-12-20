import fs from 'node:fs';
import type { MetroConfig } from 'metro-config';
import type { Module, MixedOutput } from 'metro/private/DeltaBundler/types';
import CountingSet from 'metro/private/lib/CountingSet';

const getInjectorCode = (): string => {
  const path = require.resolve('@react-native-harness/metro/injector');
  return fs.readFileSync(path, 'utf8');
};

export type Serializer = NonNullable<
  NonNullable<MetroConfig['serializer']>['customSerializer']
>;

const getBaseSerializer = (): Serializer => {
  const baseJSBundle = require('metro/private/DeltaBundler/Serializers/baseJSBundle');
  const bundleToString = require('metro/private/lib/bundleToString');

  return (entryPoint, prepend, graph, bundleOptions) =>
    bundleToString(baseJSBundle(entryPoint, prepend, graph, bundleOptions));
};

const getAllFiles = require('metro/private/DeltaBundler/Serializers/getAllFiles');

export const getHarnessSerializer = (
  unstable__skipAlreadyIncludedModules: boolean
): Serializer => {
  const baseSerializer = getBaseSerializer();
  let mainEntryPointModules = new Set<string>();
  const code = getInjectorCode();

  return async (entryPoint, preModules, graph, options) => {
    // Always inject the harness-injector code
    const newPreModules = [
      ...preModules,
      {
        dependencies: new Map(),
        inverseDependencies: new CountingSet(),
        output: [
          {
            type: 'js/script/virtual',
            data: {
              code,
            },
          },
        ],
        path: 'harness-injector',
        getSource: () => Buffer.from(''),
      } as Module<MixedOutput>,
    ];

    if (!unstable__skipAlreadyIncludedModules) {
      // This is the default behavior, we don't need to do anything.
      return baseSerializer(entryPoint, newPreModules, graph, options);
    }

    if (options.modulesOnly) {
      // This is most likely a test file - apply filtering
      return baseSerializer(entryPoint, newPreModules, graph, {
        ...options,
        processModuleFilter: (mod) => {
          if (
            options.processModuleFilter &&
            !options.processModuleFilter(mod)
          ) {
            // If the module is not allowed by the processModuleFilter, skip it
            return false;
          }

          // If the module is in the main entry point, skip it
          return !mainEntryPointModules.has(mod.path);
        },
      });
    }

    mainEntryPointModules = new Set(
      await getAllFiles(newPreModules, graph, options)
    );

    return baseSerializer(entryPoint, newPreModules, graph, options);
  };
};
