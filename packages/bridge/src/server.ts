import { WebSocketServer, type WebSocket } from 'ws';
import { type BirpcGroup, createBirpcGroup } from 'birpc';
import { logger } from '@react-native-harness/tools';
import { EventEmitter } from 'node:events';
import type {
  BridgeServerFunctions,
  BridgeClientFunctions,
  DeviceDescriptor,
  BridgeEvents,
  ImageSnapshotOptions,
} from './shared.js';
import { deserialize, serialize } from './serializer.js';
import { DeviceNotRespondingError } from './errors.js';
import { createPlatformBridgeFunctions } from './platform-bridge.js';
import type {
  FileReference,
  HarnessPlatformRunner,
} from '@react-native-harness/platforms';
import { matchImageSnapshot } from './image-snapshot.js';

export type BridgeServerOptions = {
  port: number;
  timeout?: number;
};

export type BridgeServerEvents = {
  ready: (device: DeviceDescriptor) => void;
  event: (event: BridgeEvents) => void;
};

export type BridgeServer = {
  ws: WebSocketServer;
  rpc: BirpcGroup<BridgeClientFunctions, BridgeServerFunctions>;
  on: <T extends keyof BridgeServerEvents>(
    event: T,
    listener: BridgeServerEvents[T]
  ) => void;
  once: <T extends keyof BridgeServerEvents>(
    event: T,
    listener: BridgeServerEvents[T]
  ) => void;
  off: <T extends keyof BridgeServerEvents>(
    event: T,
    listener: BridgeServerEvents[T]
  ) => void;
  updatePlatformFunctions: (platformRunner: HarnessPlatformRunner) => void;
  dispose: () => void;
};

export const getBridgeServer = async ({
  port,
  timeout,
}: BridgeServerOptions): Promise<BridgeServer> => {
  const wss = await new Promise<WebSocketServer>((resolve) => {
    const server = new WebSocketServer({ port, host: '0.0.0.0' }, () => {
      resolve(server);
    });
  });
  const emitter = new EventEmitter();
  const clients = new Set<WebSocket>();

  const baseFunctions: BridgeServerFunctions = {
    reportReady: (device) => {
      emitter.emit('ready', device);
    },
    emitEvent: (_, data) => {
      emitter.emit('event', data);
    },
    'platform.actions.tap': async () => {
      throw new Error('Platform functions not initialized');
    },
    'platform.actions.inputText': async () => {
      throw new Error('Platform functions not initialized');
    },
    'platform.actions.tapElement': async () => {
      throw new Error('Platform functions not initialized');
    },
    'platform.queries.getUiHierarchy': async () => {
      throw new Error('Platform functions not initialized');
    },
    'platform.queries.findByTestId': async () => {
      throw new Error('Platform functions not initialized');
    },
    'platform.queries.findAllByTestId': async () => {
      throw new Error('Platform functions not initialized');
    },
    'platform.actions.screenshot': async () => {
      throw new Error('Platform functions not initialized');
    },
    'test.matchImageSnapshot': async (
      screenshot: FileReference,
      testPath: string,
      options: ImageSnapshotOptions
    ) => {
      return await matchImageSnapshot(screenshot, testPath, options);
    },
  };

  const group = createBirpcGroup<BridgeClientFunctions, BridgeServerFunctions>(
    baseFunctions,
    [],
    {
      timeout,
      onTimeoutError(functionName, args) {
        throw new DeviceNotRespondingError(functionName, args);
      },
    }
  );

  const updatePlatformFunctions = (
    platformRunner: HarnessPlatformRunner
  ): void => {
    const platformFunctions = createPlatformBridgeFunctions(platformRunner);
    Object.assign(baseFunctions, platformFunctions);
  };

  wss.on('connection', (ws: WebSocket) => {
    logger.debug('Client connected to the bridge');
    ws.on('close', () => {
      logger.debug('Client disconnected from the bridge');

      // TODO: Remove channel when connection is closed.
      clients.delete(ws);
    });

    group.updateChannels((channels) => {
      channels.push({
        post: (data) => ws.send(data),
        on: (handler) => {
          ws.on('message', (event: Buffer | ArrayBuffer | Buffer[]) => {
            const message = event.toString();
            handler(message);
          });
        },
        serialize,
        deserialize,
      });
    });
  });

  const dispose = () => {
    wss.close();
    emitter.removeAllListeners();
  };

  return {
    ws: wss,
    rpc: group,
    on: emitter.on.bind(emitter),
    once: emitter.once.bind(emitter),
    off: emitter.off.bind(emitter),
    updatePlatformFunctions,
    dispose,
  };
};
