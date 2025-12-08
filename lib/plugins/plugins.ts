import { plugin } from "../plugin";
import { logger } from "./logger";
import { cache } from "./cache";
import { client } from "./client";
import { plugins as _plugins } from "../models/components";

export let plugins: _plugins = {
  logger: new logger(),
  cache: new cache(),
  client: new client(),
};

export function register_plugin<T extends plugin>(plugin_cls: { new (): T }) {
  plugins[plugin_cls.name] = new plugin_cls();
}

export {logger,cache,client};