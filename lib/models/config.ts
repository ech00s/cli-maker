import { comp_name } from "./components";
import { inline_schema, struct_keys } from "./schema";
import { _enum, obj, type_map, value } from "./types";

export type partial_values<T extends obj = obj> = Partial<T>;

type comp_str_lst =
  | `${comp_name}`
  | `${comp_name},${comp_name}`
  | `${comp_name},${comp_name},${comp_name}`;

export interface sys_config extends obj {
  gets: string[];
  sets: string[];
  ops: string[];
}

export interface logger_config extends obj {
  "log-level": string;
  where: string;
}

export interface iconf {
  configure(config: partial_values): void;
  get_val(key: string): value;
  set_val(key: string, t: value): void;
  config: obj;
}

export declare interface iconf_t<T extends obj = obj> extends iconf {
  configure(config: partial_values<T>): void;
  get_val<K extends keyof T>(key: K): T[K];
  set_val<K extends keyof T>(key: K, t: T[K]): void;
  config: T;
}

export abstract class configurable<T extends obj = obj> implements iconf_t<T> {
  public config: T;
  constructor(defaults: T) {
    this.config = defaults;
  }

  public configure(config: partial_values<T>): void {
    Object.entries(config).forEach(([k, v]) => (this.config[k as keyof T] = v));
  }

  public get_val<K extends keyof T>(key: K): T[K] {
    return this.config[key];
  }

  public set_val<K extends keyof T>(key: K, t: T[K]): void {
    this.config[key] = t;
  }
}
