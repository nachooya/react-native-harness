import { spawn } from '@react-native-harness/tools';

export const launchEmulator = async (
  avdName: string,
  options: string[] = []
): Promise<void> => {
  const subProcess = spawn('emulator', ['-avd', avdName, ...options]);
  const childProcess = await subProcess.nodeChildProcess;
  childProcess.unref();
};

export const listEmulatorSnapshots = async (
  avdName: string
): Promise<string[]> => {
  const { stdout } = await spawn('emulator', ['-snapshot-list']);
  const lines = stdout.split('\n').filter((line) => line.trim() !== '');
  const snapshots: string[] = [];

  for (const line of lines) {
    const [snapshotDevice, snapshotName] = line
      .split(':')
      .map((segment) => segment.trim());

    if (snapshotDevice === avdName) {
      snapshots.push(snapshotName);
    }
  }

  return snapshots;
};

export const hasEmulatorSnapshot = async (
  avdName: string,
  snapshotName: string
): Promise<boolean> => {
  const snapshots = await listEmulatorSnapshots(avdName);
  return snapshots.includes(snapshotName);
};

export const listExistingEmulators = async (): Promise<string[]> => {
  const { stdout } = await spawn('emulator', ['-list-avds']);
  return stdout.split('\n').filter((line) => line.trim() !== '');
};

export const doesEmulatorExist = async (avdName: string): Promise<boolean> => {
  const emulators = await listExistingEmulators();
  return emulators.includes(avdName);
};

export const createEmulator = async (
  avdName: string,
  systemName: string,
  hardwareProfileName: string
): Promise<void> => {
  await spawn('avdmanager', [
    'create',
    'avd',
    '--name',
    avdName,
    '--device',
    hardwareProfileName,
    '--package',
    systemName,
  ]);
};
