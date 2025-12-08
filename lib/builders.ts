import {
  cli_def,
  named_args,
  pos_args,
  cmd_def,
  meta,
  shorthand,
  version,
} from "./models/components";
import { plugin } from "./plugin";
import { type_map, type, obj, values, _enum, value } from "./models/types";
import { schema } from "./models/schema";
import {
  schema_to_obj,
  schema_w_known_ref,
  extend,
  pextend_mvariadic,
  mutex,
  nextend_mvariadic,
  maybe_variadic,
} from "./models/builder";
import { logger } from "./plugins/logger";
import { schema_registry, sch_tree, enum_tree } from "./utils/schema_registry";

type pos_block<C extends cmd_builder<any, any, any, any, any, any>> =
  C extends cmd_builder<infer B, any, any, any, any, any>
    ? B extends true
      ? C & { add_pos: never }
      : C
    : never;

abstract class builder implements meta {
  public description: string;
  public name: string;
  constructor(name: string, description?: string) {
    this.name = name;
    this.description = description ? description : "No description provided.";
  }
}
const IDENT = "    ";
export class cmd_builder<
  Block extends boolean = false,
  NamedArgs extends obj = {},
  Schemas extends sch_tree = {},
  PosArgs extends values = [],
  Plugins extends Record<string, plugin> = {},
  Enums extends enum_tree = {},
> extends builder {
  exec: (args: obj, ...pos: values) => void;
  named: named_args;
  pos: pos_args;
  counter: number;
  schema_tree: sch_tree;
  plugins: string[];
  enum_tree: enum_tree;
  private constructor(name: string, plugins: string[], description?: string) {
    super(name, description);
    this.plugins = plugins;
    this.enum_tree = {};
    this.counter = 0;
    this.named = {};
    this.pos = [];
    this.exec = () => {};
    this.schema_tree = {};
  }

  public static make_builder<
    P extends Record<string, { new (): plugin }> = {
      logger: { new (): logger };
    },
  >(
    plugins: P = { logger: logger } as any,
  ): (
    name: string,
    description?: string,
  ) => cmd_builder<false, {}, {}, [], { [K in keyof P]: InstanceType<P[K]> }> {
    return (name: string, description?: string) => {
      return new cmd_builder<
        false,
        {},
        {},
        [],
        { [K in keyof P]: InstanceType<P[K]> }
      >(name, Object.keys(plugins), description);
    };
  }

  public add_pos<
    Type extends Exclude<type, "obj" | "enum" | "obj_lst" | "enum_lst">,
    Var extends boolean = false,
  >(
    type: Type,
    options?: {
      description?: string;
      variadic?: Var;
      name?: string;
    },
  ): pos_block<
    cmd_builder<
      Var,
      NamedArgs,
      Schemas,
      pextend_mvariadic<Var, type_map[Type], PosArgs>,
      Plugins,
      Enums
    >
  >;
  public add_pos<
    Sc extends schema_w_known_ref<Schemas, Enums>,
    Var extends boolean = false,
  >(
    type: "obj",
    options: {
      description?: string;
      schema: Sc;
      variadic?: Var;
      name?: string;
    },
  ): pos_block<
    cmd_builder<
      Var,
      NamedArgs,
      Schemas,
      pextend_mvariadic<Var, schema_to_obj<Sc, Schemas, Enums>, PosArgs>,
      Plugins,
      Enums
    >
  >;
  public add_pos<
    Sc extends schema_w_known_ref<Schemas, Enums>,
    Var extends boolean = false,
  >(
    type: "obj_lst",
    options: {
      description?: string;
      schema: Sc;
      variadic?: Var;
      name?: string;
    },
  ): pos_block<
    cmd_builder<
      Var,
      NamedArgs,
      Schemas,
      pextend_mvariadic<Var, schema_to_obj<Sc, Schemas, Enums>[], PosArgs>,
      Plugins,
      Enums
    >
  >;
  public add_pos<E extends string, Var extends boolean = false>(
    type: "enum",
    options: {
      description?: string;
      choices: E[];
      variadic?: Var;
      name?: string;
    },
  ): pos_block<
    cmd_builder<
      Var,
      NamedArgs,
      Schemas,
      pextend_mvariadic<Var, E, PosArgs>,
      Plugins,
      Enums
    >
  >;
  public add_pos<E extends string, Var extends boolean = false>(
    type: "enum_lst",
    options: {
      description?: string;
      choices: E[];
      variadic?: Var;
      name?: string;
    },
  ): pos_block<
    cmd_builder<
      Var,
      NamedArgs,
      Schemas,
      pextend_mvariadic<Var, E[], PosArgs>,
      Plugins,
      Enums
    >
  >; //not gonna be able to ref enum here
  public add_pos(
    type: type,
    options?: {
      description?: string;
      schema?: schema;
      variadic?: boolean;
      name?: string; //for generating help
      choices?: string[];
    },
  ) {
    if (!options) options = {};
    const idx = this.counter++;
    if (!options.name) options.name = `pos n°${idx}`;
    if (type.startsWith("obj"))
      this.schema_tree[options.name] = options.schema!;
    if (type.startsWith("enum"))
      this.enum_tree[options.name] = options.choices!;
    this.pos.push({
      name: options.name,
      idx: idx,
      type: type,
      description: options.description
        ? options.description
        : "No description provided.",
      variadic: options.variadic ? options.variadic : false,
    });

    return this as any;
  }

  public add_named<
    Type extends Exclude<
      type,
      "obj" | "bool" | "enum" | "obj_lst" | "enum_lst"
    >,
    K extends string,
    B extends boolean = false,
    Var extends boolean = false,
  >(
    name: K,
    type: Type,
    options?: mutex<
      {
        optional?: B;
        default?: maybe_variadic<Var, type_map[Type]>;
        variadic?: Var;
        shorthand?: shorthand;
        description?: string;
      },
      "optional" | "default"
    >,
  ): pos_block<
    cmd_builder<
      Block,
      nextend_mvariadic<NamedArgs, K, type_map[Type], B, Var>,
      Schemas,
      PosArgs,
      Plugins,
      Enums
    >
  >;
  public add_named<K extends string>(
    name: K,
    type: "bool",
    options?: {
      optional?: false;
      shorthand?: shorthand;
      description?: string;
    },
  ): pos_block<
    cmd_builder<
      Block,
      extend<NamedArgs, K, type_map["bool"]>,
      Schemas,
      PosArgs,
      Plugins,
      Enums
    >
  >;
  public add_named<
    K extends string,
    E extends string,
    B extends boolean = false,
    Var extends boolean = false,
  >(
    name: K,
    type: "enum",
    options: mutex<
      {
        optional?: B;
        variadic?: Var;
        default?: maybe_variadic<Var, E>;
        shorthand?: shorthand;
        description?: string;
        choices: E[];
      },
      "optional" | "default"
    >,
  ): pos_block<
    cmd_builder<
      Block,
      nextend_mvariadic<NamedArgs, K, E, B, Var>,
      Schemas,
      PosArgs,
      Plugins,
      extend<Enums, K, E[]>
    >
  >;
  public add_named<
    K extends string,
    E extends string,
    B extends boolean = false,
    Var extends boolean = false,
  >(
    name: K,
    type: "enum_lst",
    options: mutex<
      {
        optional?: B;
        variadic?: Var;
        default?: maybe_variadic<Var, E[]>;
        shorthand?: shorthand;
        description?: string;
        choices: E[];
      },
      "optional" | "default"
    >,
  ): pos_block<
    cmd_builder<
      Block,
      nextend_mvariadic<NamedArgs, K, E[], B, Var>,
      Schemas,
      PosArgs,
      Plugins,
      extend<Enums, K, E[]>
    >
  >;
  public add_named<
    Sc extends schema_w_known_ref<Schemas, Enums>,
    K extends string,
    B extends boolean = false,
    Var extends boolean = false,
  >(
    name: K,
    type: "obj",
    options: mutex<
      {
        optional?: B;
        variadic?: Var;
        default?: maybe_variadic<Var, schema_to_obj<Sc, Schemas, Enums>>;
        shorthand?: shorthand;
        description?: string;
        schema: Sc;
      },
      "optional" | "default"
    >,
  ): pos_block<
    cmd_builder<
      Block,
      nextend_mvariadic<
        NamedArgs,
        K,
        schema_to_obj<Sc, Schemas, Enums>,
        B,
        Var
      >,
      extend<Schemas, K, Sc>,
      PosArgs,
      Plugins,
      Enums
    >
  >;
  public add_named<
    Sc extends schema_w_known_ref<Schemas, Enums>,
    K extends string,
    B extends boolean = false,
    Var extends boolean = false,
  >(
    name: K,
    type: "obj_lst",
    options: mutex<
      {
        optional?: B;
        variadic?: Var;
        default?: maybe_variadic<Var, schema_to_obj<Sc, Schemas, Enums>[]>;
        shorthand?: shorthand;
        description?: string;
        schema: Sc;
      },
      "optional" | "default"
    >,
  ): pos_block<
    cmd_builder<
      Block,
      nextend_mvariadic<
        NamedArgs,
        K,
        schema_to_obj<Sc, Schemas, Enums>[],
        B,
        Var
      >,
      extend<Schemas, K, Sc>,
      PosArgs,
      Plugins,
      Enums
    >
  >;
  public add_named(
    name: string,
    type: type,
    options?: {
      optional?: boolean;
      default?: value | values;
      variadic?: boolean;
      shorthand?: shorthand;
      description?: string;
      schema?: schema;
      choices?: string[];
    },
  ) {
    if (!options) options = {};
    if (typeof options.optional === "undefined") options.optional = false;
    if (typeof options.variadic === "undefined") options.variadic = false;
    if (type.startsWith("obj")) this.schema_tree[name] = options.schema!;
    if (type.startsWith("enum")) this.enum_tree[name] = options.choices!;
    this.named[name] = {
      name: name,
      optional: options.optional,
      shorthands: options.shorthand
        ? [options.shorthand, `--${name}`]
        : [`--${name}`],
      type: type,
      description: options.description
        ? options.description
        : "No description provided.",
      variadic: options.variadic,
      ...(options.default && { default: options.default }),
    };
    return this as any;
  }

  public add_schema<
    K extends string,
    Sc extends schema_w_known_ref<Schemas, Enums>,
  >(
    name: K,
    schema: Sc,
  ): pos_block<
    cmd_builder<
      Block,
      NamedArgs,
      extend<Schemas, K, Sc>,
      PosArgs,
      Plugins,
      Enums
    >
  > {
    this.schema_tree[name] = schema;
    return this as any;
  }

  public add_enum<K extends string, E extends string>(
    name: K,
    choices: E[],
  ): pos_block<
    cmd_builder<
      Block,
      NamedArgs,
      Schemas,
      PosArgs,
      Plugins,
      extend<Enums, K, E[]>
    >
  > {
    this.enum_tree[name] = choices;
    return this as any;
  }

  private gen_usage(): string {
    let base = `Usage: ${this.name}`;
    if (this.named && Object.keys(this.named).length > 0) {
      base += " [options]";
    }
    if (this.pos.length > 0) {
      this.pos.forEach((p) => {
        base += ` <${p.type}`;
        if (p.variadic) {
          base += "s...";
        }
        base += ">";
      });
    }
    return base;
  }

  private gen_help(): string {
    let col0: string[] = [
      this.gen_usage(),
      "Description:",
      `${IDENT}${this.description}`,
    ];
    let col1: string[] = ["\n", "", "\n"];
    if (this.pos.length > 0) {
      col0.push("Arguments:");
      col1.push("");
      this.pos.forEach((p) => {
        let base = `${IDENT}`;
        base += p.type;
        if (p.variadic) {
          base += "s...";
        }
        col0.push(base);
        col1.push(p.description);
      });
      col0.push("");
      col1.push("\n");
    }
    if (this.named && Object.keys(this.named).length > 0) {
      col0.push("Options:");
      col1.push("");
      Object.values(this.named).forEach((named_arg) => {
        col0.push(
          `${IDENT}${named_arg.shorthands.join(", ")} <${named_arg.type}>`,
        );
        let base = `${named_arg.description}`;
        if (this.enum_tree[named_arg.name]) {
          base += ` (Choices: ${this.enum_tree[named_arg.name].join(", ")})`;
        }
        if (named_arg.default) {
          base += ` (Default: ${named_arg.default})`;
        } else {
          base += named_arg.optional ? " (Optional)" : " (Required)";
        }
        col1.push(base);
      });
    }

    let maxl: number = Math.max(...col0.map((s) => s.length));
    for (let i = 0; i < col0.length; i++) {
      col0[i] =
        `${col0[i]}${" ".repeat(maxl - col0[i].length)}${IDENT}${col1[i]}`;
    }
    return col0.join("\n");
  }

  public add_func(
    func: (plugins: Plugins, args: NamedArgs, ...pos: PosArgs) => void,
  ): {
    build: () => cmd_def;
  } {
    this.exec = func as any;
    return {
      build: () => this.build(),
    };
  }

  private build(): cmd_def {
    const id: string = this.name + Math.trunc(Math.random() * 9998 + 1).toString();
    schema_registry.register_tree(id, {
      schemas: this.schema_tree,
      enums: this.enum_tree,
    });
    return {
      execute: this.exec as any,
      id: id,
      named: this.named,
      pos: this.pos,
      name: this.name,
      description: this.description,
      help: this.gen_help(),
      plugins: this.plugins,
    };
  }
}

export class cli_builder extends builder {
  cli_tree: Record<string, cli_def | cmd_def>;
  version: version;
  constructor(name: string, description?: string, version?: version) {
    super(name, description);
    this.version = version ? version : "0.0.0";
    this.cli_tree = {};
  }

  public add_subcli(subcli: cli_def) {
    this.cli_tree[subcli.name] = subcli;
    return this;
  }

  public add_subcmd(subcmd: cmd_def) {
    this.cli_tree[subcmd.name] = subcmd;
    return this;
  }

  private gen_usage(): string {
    return `Usage: ${this.name} <command> [options]`;
  }

  private gen_help(): string {
    let col0: string[] = [
      this.gen_usage(),
      "Description:",
      `${IDENT}${this.description}`,
      "Commands:",
    ];
    let col1: string[] = ["\n", "", "\n", ""];
    Object.values(this.cli_tree).forEach((def) => {
      col0.push(`${IDENT}${def.name}`);
      col1.push(def.description);
    });

    let maxl: number = Math.max(...col0.map((s) => s.length));
    for (let i = 0; i < col0.length; i++) {
      col0[i] =
        `${col0[i]}${" ".repeat(maxl - col0[i].length)}${IDENT}${IDENT}${col1[i]}`;
    }
    return col0.join("\n");
  }

  public build(): cli_def {
    if (Object.values(this.cli_tree).length === 0) {
      throw new Error("Cannot have an empty cli definition");
    }
    return {
      name: this.name,
      description: this.description,
      cli_tree: this.cli_tree,
      version: this.version,
      help: this.gen_help(),
    };
  }
}
