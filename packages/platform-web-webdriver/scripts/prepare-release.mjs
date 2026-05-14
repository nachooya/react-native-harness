#!/usr/bin/env node
// Bundle the package into a self-contained tarball ready for upload to a
// GitHub Release. Workspace siblings are inlined; real npm deps stay external.
//
// Usage:
//   node scripts/prepare-release.mjs           # uses package.json version
//   node scripts/prepare-release.mjs 1.2.3     # overrides version
//
// Output: packages/platform-web-webdriver/release/<name>-<version>.tgz

import { execSync } from 'node:child_process';
import {
  copyFileSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const PKG_ROOT = resolve(HERE, '..');
const OUT_DIR = resolve(PKG_ROOT, 'release');

const pkg = JSON.parse(readFileSync(resolve(PKG_ROOT, 'package.json'), 'utf8'));
const versionOverride = process.argv[2];
const version = versionOverride ?? pkg.version;

const run = (cmd, opts = {}) => {
  console.log(`$ ${cmd}`);
  execSync(cmd, { stdio: 'inherit', cwd: PKG_ROOT, ...opts });
};

// 1. Make sure tsc has emitted dist/*.d.ts for us and our workspace deps —
//    rollup-plugin-dts follows imports into those compiled .d.ts files when
//    inlining workspace-sibling types.
rmSync(OUT_DIR, { recursive: true, force: true });
mkdirSync(OUT_DIR, { recursive: true });
run('pnpm exec tsc --build tsconfig.lib.json');

// 2. Bundle JS into release/dist/ via tsup.
run('pnpm exec tsup');

// 3. Bundle types into release/dist/*.d.ts via rollup-plugin-dts.
//    External list keeps real npm deps as bare imports; everything else
//    (including @react-native-harness/*) gets inlined.
const { rollup } = await import('rollup');
const { default: dts } = await import('rollup-plugin-dts');

const externalIds = new Set(['webdriver', '@wdio/logger', 'zod', 'tslib']);
const isExternal = (id) =>
  externalIds.has(id) || [...externalIds].some((e) => id.startsWith(`${e}/`));

const bundleDts = async (input, output) => {
  const bundle = await rollup({
    input,
    plugins: [dts({ respectExternal: true })],
    external: isExternal,
  });
  await bundle.write({ file: output, format: 'es' });
  await bundle.close();
};

await bundleDts(
  resolve(PKG_ROOT, 'dist/index.d.ts'),
  resolve(OUT_DIR, 'dist/index.d.ts')
);
await bundleDts(
  resolve(PKG_ROOT, 'dist/runner.d.ts'),
  resolve(OUT_DIR, 'dist/runner.d.ts')
);

// 2. Generate publish-ready package.json (no workspace deps, no dev exports)
const publishDeps = Object.fromEntries(
  Object.entries(pkg.dependencies ?? {}).filter(
    ([name]) => !name.startsWith('@react-native-harness/')
  )
);

const publishPkg = {
  name: pkg.name,
  description: pkg.description,
  version,
  type: 'module',
  main: './dist/index.js',
  module: './dist/index.js',
  types: './dist/index.d.ts',
  exports: {
    './package.json': './package.json',
    '.': {
      types: './dist/index.d.ts',
      import: './dist/index.js',
      default: './dist/index.js',
    },
  },
  files: ['dist', 'README.md'],
  dependencies: publishDeps,
  license: pkg.license,
  repository: {
    type: 'git',
    url: 'git+https://github.com/nachooya/react-native-harness.git',
    directory: 'packages/platform-web-webdriver',
  },
};

writeFileSync(
  resolve(OUT_DIR, 'package.json'),
  JSON.stringify(publishPkg, null, 2) + '\n'
);

// 3. Bring the README along.
copyFileSync(resolve(PKG_ROOT, 'README.md'), resolve(OUT_DIR, 'README.md'));

// 4. Pack — produces release/<name>-<version>.tgz
run('pnpm pack --pack-destination .', { cwd: OUT_DIR });

const tarball = readdirSync(OUT_DIR).find((n) => n.endsWith('.tgz'));
if (!tarball) {
  console.error('[release] no tarball produced');
  process.exit(1);
}

console.log('\n[release] produced:', resolve(OUT_DIR, tarball));
