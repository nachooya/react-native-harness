import { spawn, SubprocessError } from '@react-native-harness/tools';

export type IOSSimulatorStatus = 'stopped' | 'loading' | 'running';

export const getSimulatorDeviceId = async (
  simulatorName: string,
  systemVersion: string
): Promise<string | null> => {
  try {
    const { stdout } = await spawn('xcrun', [
      'simctl',
      'list',
      'devices',
      '--json',
    ]);
    const devices = JSON.parse(stdout);
    const expectedRuntimeId = `com.apple.CoreSimulator.SimRuntime.iOS-${systemVersion.replace(
      /\./,
      '-'
    )}`;

    const runtime = devices.devices[expectedRuntimeId];

    if (!runtime) {
      return null;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const device = runtime.find((d: any) => d.name === simulatorName);

    if (device) {
      return device.udid;
    }

    return null;
  } catch {
    return null;
  }
};

export const getAvailableSimulators = async (): Promise<
  Array<{ name: string; udid: string; runtime: string }>
> => {
  try {
    const { stdout } = await spawn('xcrun', [
      'simctl',
      'list',
      'devices',
      '--json',
    ]);
    const devices = JSON.parse(stdout);
    const simulators: Array<{
      name: string;
      udid: string;
      runtime: string;
    }> = [];

    for (const runtime in devices.devices) {
      if (runtime.includes('iOS')) {
        const runtimeDevices = devices.devices[runtime];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        runtimeDevices.forEach((device: any) => {
          if (device.isAvailable) {
            simulators.push({
              name: device.name,
              udid: device.udid,
              runtime: runtime,
            });
          }
        });
      }
    }

    return simulators;
  } catch {
    return [];
  }
};

export const getSimulatorStatus = async (
  udid: string
): Promise<IOSSimulatorStatus> => {
  try {
    const { stdout } = await spawn('xcrun', [
      'simctl',
      'list',
      'devices',
      '--json',
    ]);
    const devices = JSON.parse(stdout);

    for (const runtime in devices.devices) {
      if (runtime.includes('iOS')) {
        const runtimeDevices = devices.devices[runtime];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const device = runtimeDevices.find((d: any) => d.udid === udid);

        if (device) {
          switch (device.state) {
            case 'Booted':
              return 'running';
            case 'Booting':
              return 'loading';
            default:
              return 'stopped';
          }
        }
      }
    }

    return 'stopped';
  } catch {
    return 'stopped';
  }
};

export const runSimulator = async (udid: string): Promise<void> => {
  try {
    await spawn('xcrun', ['simctl', 'boot', udid]);
  } catch (bootError) {
    // Ignore if simulator is already booted
    if (
      bootError instanceof SubprocessError &&
      !bootError.stderr?.includes(
        'Unable to boot device in current state: Booted'
      )
    ) {
      throw bootError;
    }
  }

  await spawn('open', ['-a', 'Simulator']);

  let attempts = 0;

  while (true) {
    attempts++;

    const status = await getSimulatorStatus(udid);

    if (status === 'running') {
      break;
    }

    if (attempts > 10) {
      throw new Error('Simulator not running');
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
};

export const stopSimulator = async (udid: string): Promise<void> => {
  await stopSimulatorById(udid);
};

const stopSimulatorById = async (udid: string): Promise<void> => {
  try {
    await spawn('xcrun', ['simctl', 'shutdown', udid]);
  } catch (shutdownError) {
    // Ignore if simulator is already shut down
    if (
      shutdownError instanceof SubprocessError &&
      !shutdownError.stderr?.includes(
        'Unable to shutdown device in current state: Shutdown'
      )
    ) {
      throw shutdownError;
    }
  }
};
