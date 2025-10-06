import { plugin } from "../plugin";
import { logger } from "./logger";
import { cache } from "./cache";
import { plugins as _plugins } from "../models/components";

export let plugins: _plugins = {
  logger: new logger(),
  cache: new cache(),
};

export function register_plugin<T extends plugin>(plugin_cls: { new (): T }) {
  plugins[plugin_cls.name] = new plugin_cls();
}
