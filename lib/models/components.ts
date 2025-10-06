import { plugin } from "../plugin";
import { obj, type, type_map, value, values } from "./types";

export interface raw_argv {
  content: string[];
}

export interface meta {
  name: string;
  description: string;
}

export interface base_arg extends meta {
  type: type;
  variadic: boolean;
}

export interface named_arg extends base_arg {
  optional: boolean;
  shorthands: shorthand[];
  default?: value | values;
}

export interface pos_arg extends base_arg {
  idx: number;
}

export type shorthand = `-${string}`;

export interface named_args extends Record<string, named_arg> {}

export interface pos_args extends Array<pos_arg> {}

export interface plugins extends Record<string, plugin> {}

export interface cmd_def extends meta {
  execute: (plugins: plugins, args: obj, ...pos: values) => void;
  id: string;
  named: named_args;
  pos: pos_args;
  help: string;
  plugins: string[];
}

export type version = `${number}.${number}.${number}`;

export interface cli_def extends meta {
  cli_tree: Record<string, cmd_def | cli_def>;
  version: version;
  help: string;
}

export interface args {
  named: obj;
  pos: values;
  plugins: plugins;
}

export interface str_arg {
  name: string;
  strval: string;
  meta: boolean;
}

export interface str_args extends Array<str_arg> {}

export interface parsed_arg {
  name: string;
  value: value;
  meta: boolean;
}

export interface parsed_args extends Array<parsed_arg> {}

export interface meta_arg {
  plugin: string;
  shorthands: shorthand[];
  name: string;
  key: string;
  type: type;
  transform?: (value: type_map[type]) => any;
}

export interface meta_args extends Array<meta_arg> {}

export interface meta_cmd_def {
  names: string[];
}

export interface meta_cmds extends Array<meta_cmd_def> {}

export interface context {
  value: "meta" | "default";
  depth: string;
}

export interface config_values extends obj {}
//Name mapping
export interface comp_map {
  //base input components
  raw_argv: raw_argv;
  cli_def: cli_def;

  //meta components
  meta_cmds: meta_cmds;
  meta_args: meta_args;
  plugins: plugins;

  //first order transforms
  context: context;
  cmd_def: cmd_def;
  config_values: config_values;

  //second order transforms
  str_args: str_args;
  parsed_args: parsed_args;
  args: args;
}

export type component = comp_map[keyof comp_map];

export type comp_name = keyof comp_map;
