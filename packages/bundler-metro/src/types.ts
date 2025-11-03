import { EventEmitter } from './emitter.js';

export type MetroEvents =
  | { type: 'initialize_started' }
  | { type: 'initialize_failed' }
  | { type: 'initialize_done' }
  | { type: 'server_listening' }
  | { type: 'dep_graph_loading' }
  | { type: 'dep_graph_loaded' }
  | { type: 'bundle_build_started' }
  | { type: 'bundle_build_failed ' }
  | { type: 'bundle_build_done' }
  | { type: 'bundling_error' };

export type MetroInstance = {
  events: EventEmitter<MetroEvents>;
  dispose: () => Promise<void>;
};

export type MetroFactory = (isExpo: boolean) => Promise<MetroInstance>;
