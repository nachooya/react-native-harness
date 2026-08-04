import type WebDriver from 'webdriver';

type WebDriverClient = Awaited<ReturnType<typeof WebDriver.newSession>>;

const W3C_ELEMENT_KEY = 'element-6066-11e4-a52e-4f735466cecf';
const ENTER_KEY = '\uE007';

type BridgeMethod =
  | 'capture_screenshot'
  | 'simulate_press'
  | 'type_char'
  | 'blur';

type BridgeCall = {
  id: number;
  method: BridgeMethod;
  args: unknown[];
};

type BridgeResponse =
  | { id: number; ok: true; value: unknown }
  | { id: number; ok: false; error: string };

type ScreenshotBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
  nativeId: string;
};

// Injected into the page on every poll tick. Idempotent: if the bridge has
// already been wired up on this window it just drains and returns the queue,
// otherwise it sets up the shims first (this happens on first tick after each
// navigation, since `window` is reset).
const SETUP_AND_DRAIN_SCRIPT = `
return (function () {
  if (!window.__RN_HARNESS_BRIDGE__) {
    var bridge = { queue: [], pending: new Map(), nextId: 1 };
    window.__RN_HARNESS_BRIDGE__ = bridge;
    var enqueue = function (method, args) {
      var id = bridge.nextId++;
      return new Promise(function (resolve, reject) {
        bridge.pending.set(id, { resolve: resolve, reject: reject });
        bridge.queue.push({ id: id, method: method, args: args });
      });
    };
    window.__RN_HARNESS_CAPTURE_SCREENSHOT__ = function (bounds) {
      return enqueue('capture_screenshot', [bounds]);
    };
    window.__RN_HARNESS_SIMULATE_PRESS__ = function (x, y) {
      return enqueue('simulate_press', [x, y]);
    };
    window.__RN_HARNESS_TYPE_CHAR__ = function (char) {
      return enqueue('type_char', [char]);
    };
    window.__RN_HARNESS_BLUR__ = function (options) {
      return enqueue('blur', [options]);
    };
    window.__RN_HARNESS_BRIDGE_RESOLVE__ = function (responses) {
      for (var i = 0; i < responses.length; i++) {
        var r = responses[i];
        var handler = bridge.pending.get(r.id);
        if (!handler) continue;
        bridge.pending['delete'](r.id);
        if (r.ok) handler.resolve(r.value);
        else handler.reject(new Error(r.error || 'bridge call failed'));
      }
    };
  }
  var drained = window.__RN_HARNESS_BRIDGE__.queue;
  window.__RN_HARNESS_BRIDGE__.queue = [];
  return drained;
})();
`;

const RESOLVE_RESPONSES_SCRIPT = `
if (window.__RN_HARNESS_BRIDGE_RESOLVE__) {
  window.__RN_HARNESS_BRIDGE_RESOLVE__(arguments[0]);
}
`;

const RESOLVE_ELEMENT_SCRIPT = `
var nativeId = arguments[0];
var registry = window.__RN_HARNESS_VIEW_REGISTRY__;
return registry ? (registry.get(nativeId) || null) : null;
`;

const BLUR_SCRIPT = `
if (
  document.activeElement &&
  (document.activeElement instanceof HTMLElement ||
    document.activeElement instanceof SVGElement)
) {
  document.activeElement.blur();
}
`;

type PerformActionsArg = Parameters<WebDriverClient['performActions']>[0];

const captureScreenshot = async (
  client: WebDriverClient,
  bounds: ScreenshotBounds | null
): Promise<string | null> => {
  if (bounds?.nativeId) {
    const elementRef = (await client.executeScript(RESOLVE_ELEMENT_SCRIPT, [
      bounds.nativeId,
    ])) as Record<string, string> | null;
    if (elementRef && typeof elementRef === 'object' && W3C_ELEMENT_KEY in elementRef) {
      try {
        return await client.takeElementScreenshot(elementRef[W3C_ELEMENT_KEY]);
      } catch {
        // Fall through to a full-page screenshot.
      }
    }
  }
  return await client.takeScreenshot();
};

const simulatePress = async (
  client: WebDriverClient,
  x: number,
  y: number
): Promise<void> => {
  await client.performActions([
    {
      type: 'pointer',
      id: 'rnh-mouse',
      parameters: { pointerType: 'mouse' },
      actions: [
        { type: 'pointerMove', duration: 0, x, y },
        { type: 'pointerDown', button: 0 },
        { type: 'pointerUp', button: 0 },
      ],
    },
  ] as unknown as PerformActionsArg);
};

const typeChar = async (
  client: WebDriverClient,
  char: string
): Promise<void> => {
  await client.performActions([
    {
      type: 'key',
      id: 'rnh-keyboard',
      actions: [
        { type: 'keyDown', value: char },
        { type: 'keyUp', value: char },
      ],
    },
  ] as unknown as PerformActionsArg);
};

const blur = async (
  client: WebDriverClient,
  options: { submitEditing?: boolean } | undefined
): Promise<void> => {
  if (options?.submitEditing) {
    await client.performActions([
      {
        type: 'key',
        id: 'rnh-keyboard',
        actions: [
          { type: 'keyDown', value: ENTER_KEY },
          { type: 'keyUp', value: ENTER_KEY },
        ],
      },
    ] as unknown as PerformActionsArg);
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  await client.executeScript(BLUR_SCRIPT, []);
};

const dispatch = async (
  client: WebDriverClient,
  call: BridgeCall
): Promise<unknown> => {
  switch (call.method) {
    case 'capture_screenshot':
      return captureScreenshot(
        client,
        (call.args[0] ?? null) as ScreenshotBounds | null
      );
    case 'simulate_press':
      return simulatePress(
        client,
        call.args[0] as number,
        call.args[1] as number
      );
    case 'type_char':
      return typeChar(client, call.args[0] as string);
    case 'blur':
      return blur(
        client,
        call.args[0] as { submitEditing?: boolean } | undefined
      );
    default: {
      const exhaustive: never = call.method;
      throw new Error(`unknown bridge method: ${String(exhaustive)}`);
    }
  }
};

export type BridgeRuntime = {
  start: () => void;
  stop: () => void;
};

export const createBridge = ({
  getClient,
  pollIntervalMs = 50,
}: {
  getClient: () => WebDriverClient | null;
  pollIntervalMs?: number;
}): BridgeRuntime => {
  let timer: NodeJS.Timeout | null = null;
  let tickInFlight = false;

  const tick = async () => {
    const client = getClient();
    if (!client || tickInFlight) return;
    tickInFlight = true;
    try {
      const drained = (await client.executeScript(
        SETUP_AND_DRAIN_SCRIPT,
        []
      )) as BridgeCall[] | null;
      if (!Array.isArray(drained) || drained.length === 0) return;

      const responses: BridgeResponse[] = await Promise.all(
        drained.map(async (call) => {
          try {
            const value = await dispatch(client, call);
            return { id: call.id, ok: true, value: value ?? null };
          } catch (err) {
            return {
              id: call.id,
              ok: false,
              error: err instanceof Error ? err.message : String(err),
            };
          }
        })
      );

      await client.executeScript(RESOLVE_RESPONSES_SCRIPT, [responses]);
    } catch {
      // Page may be mid-navigation or the session may be tearing down — skip.
    } finally {
      tickInFlight = false;
    }
  };

  const start = () => {
    if (timer) return;
    timer = setInterval(() => {
      void tick();
    }, pollIntervalMs);
  };

  const stop = () => {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  };

  return { start, stop };
};
