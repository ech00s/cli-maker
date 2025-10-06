import {
  comp_map,
  comp_name,
  component,
  meta_arg,
  meta_args,
  meta_cmds,
} from "./models/components";

type elem<T extends component> = T extends Array<infer C> ? C : never;
type elem_from_name<K extends comp_name> = elem<comp_map[K]>;
type component_registry = Partial<comp_map>;
export interface mem_manager {
  add<K extends comp_name>(key: K, component: comp_map[K]): void;
  get<K extends comp_name>(key: K): comp_map[K] | [];
  push<K extends comp_name>(key: K, component: elem<comp_map[K]>): void;
  pop<K extends comp_name>(key: K): elem_from_name<K>;
  clear(): void;
}

let builtin_meta_args: meta_args = [
  {
    plugin: "logger",
    shorthands: ["--verbose", "-v"],
    name: "verbose",
    key: "log-level",
    type: "bool",
    transform: (verbose: boolean) => (verbose ? "debug" : "info"),
  },
  {
    plugin: "logger",
    shorthands: ["--silent", "-s"],
    name: "silent",
    key: "log-level",
    type: "bool",
    transform: (silent: boolean) => (silent ? "off" : "info"),
  },
  {
    plugin: "logger",
    shorthands: ["--debug"],
    name: "debug",
    key: "log-level",
    type: "bool",
    transform: (debug: boolean) => (debug ? "debug" : "info"),
  },
  {
    plugin: "logger",
    shorthands: ["--log-level", "-ll"],
    name: "log-level",
    key: "log-level",
    type: "enum",
  },
];

const builtin_meta_cmds: meta_cmds = [
  { names: ["--help"] },
  { names: ["--version"] },
  { names: ["--config"] },
];

export class mem {
  private static components: component_registry = {};

  private static add<K extends comp_name>(key: K, component: comp_map[K]) {
    if (Array.isArray(component) && component.length === 0) return;
    mem.components[key] = component;
  }
  public static init_builtins() {
    mem.add("meta_args", builtin_meta_args);
    mem.add("meta_cmds", builtin_meta_cmds);
  }
  private static get<K extends comp_name>(key: K): comp_map[K] | [] {
    const result = mem.components[key];
    if (!result) return [];
    return result;
  }

  private static push<K extends comp_name>(
    key: K,
    component: elem<comp_map[K]>,
  ) {
    (mem.components[key] as any).push(component);
  }

  private static pop<K extends comp_name>(key: K): elem_from_name<K> {
    return (mem.components[key] as any).pop();
  }

  public static create_mem_manager(): mem_manager {
    return {
      add: mem.add,
      get: mem.get,
      push: mem.push,
      pop: mem.pop,
      clear: () => (mem.components = {}),
    };
  }
}

mem.init_builtins();

export function add_meta_arg(meta_arg: meta_arg) {
  mem.create_mem_manager().push("meta_args", meta_arg);
}
