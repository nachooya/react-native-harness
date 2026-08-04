import { defineConfig } from 'tsup';

// Produces a self-contained bundle of @react-native-harness/platform-web-webdriver
// where the two workspace siblings (@react-native-harness/platforms and
// @react-native-harness/tools) are inlined into the output. Everything else is
// kept external so the consumer installs it from their own registry.
export default defineConfig({
  // Two entries — runner.ts must ship as a sibling of index.js because
  // factory.ts looks it up via `import.meta.resolve('./runner.js')`.
  entry: ['src/index.ts', 'src/runner.ts'],
  outDir: 'release/dist',
  format: ['esm'],
  target: 'node20',
  platform: 'node',
  bundle: true,
  // Types are bundled separately by dts-bundle-generator (see prepare-release.mjs)
  // because tsup's `dts.resolve` does not actually inline workspace-sibling types.
  dts: false,
  tsconfig: 'tsconfig.lib.json',
  clean: true,
  sourcemap: false,
  splitting: false,
  treeshake: true,
  noExternal: [/^@react-native-harness\//],
  external: ['webdriver', '@wdio/logger', 'zod', 'tslib'],
});
