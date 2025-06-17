import path from 'node:path';
import { spawn } from '@react-native-harness/tools';

export type VegaBuildTarget = 'sim_tv_x86_64' | 'sim_tv_aarch64';
export type VegaBuildType = 'Debug' | 'Release';

/**
 * Build Vega app and produce .vpkg file
 */
export const buildVegaApp = async (
  buildType: VegaBuildType = 'Release',
  target?: VegaBuildTarget
): Promise<void> => {
  const args = ['run', 'build:app'];

  if (buildType) {
    args.push('-b', buildType);
  }

  if (target) {
    args.push('-t', target);
  }

  await spawn('npm', args);
};

/**
 * Clean build artifacts
 */
export const cleanBuild = async (): Promise<void> => {
  await spawn('kepler', ['clean']);
};

/**
 * Get the expected .vpkg file path based on build configuration
 */
export const getVpkgPath = (
  appName: string,
  buildType: VegaBuildType = 'Release',
  target: VegaBuildTarget = 'sim_tv_x86_64'
): string => {
  const buildTypeStr = buildType.toLowerCase();
  const vpkgFileName = `${appName}_${target}.vpkg`;

  return path.join(
    process.cwd(),
    'build',
    `${target}-${buildTypeStr}`,
    vpkgFileName
  );
};

/**
 * Launch an already installed app on specified Vega virtual device
 */
export const runApp = async (
  deviceId: string,
  bundleId: string
): Promise<void> => {
  await spawn('kepler', [
    'device',
    'launch-app',
    '--device',
    deviceId,
    '--appName',
    bundleId,
  ]);
};

/**
 * Kill/terminate app on specified Vega virtual device
 */
export const killApp = async (
  deviceId: string,
  bundleId: string
): Promise<void> => {
  await spawn('kepler', [
    'device',
    'terminate-app',
    '--device',
    deviceId,
    '--appName',
    bundleId,
  ]);
};
