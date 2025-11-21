export type UIElement = {
  type: string;
  id?: string;
  text?: string;
  rect: { x: number; y: number; width: number; height: number };
  children: UIElement[];
  attributes: Record<string, unknown>;
};

export type PlatformActions = {
  tap: (x: number, y: number) => Promise<void>;
  inputText: (text: string) => Promise<void>;
  tapElement: (element: ElementReference) => Promise<void>;
  screenshot: () => Promise<FileReference>;
};

export type PlatformQueries = {
  getUiHierarchy: () => Promise<UIElement>;
  findByTestId: (testId: string) => Promise<ElementReference>;
  findAllByTestId: (testId: string) => Promise<ElementReference[]>;
};

export type HarnessPlatformRunner = {
  startApp: () => Promise<void>;
  restartApp: () => Promise<void>;
  stopApp: () => Promise<void>;
  dispose: () => Promise<void>;
  actions: PlatformActions;
  queries: PlatformQueries;
};

export type HarnessPlatform<TConfig = Record<string, unknown>> = {
  name: string;
  config: TConfig;
  runner: string;
};

export type ElementReference = {
  id: string;
};

export type FileReference = {
  path: string;
};
