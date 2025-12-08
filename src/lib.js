var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if ((from && typeof from === "object") || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, {
          get: () => from[key],
          enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable,
        });
  }
  return to;
};
var __toCommonJS = (mod) =>
  __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// index.ts
var index_exports = {};
__export(index_exports, {
  add_meta_arg: () => add_meta_arg,
  cli_builder: () => cli_builder,
  cmd_builder: () => cmd_builder,
  plugin: () => plugin,
  register_plugin: () => register_plugin,
  run_cli: () => run_cli,
  run_cmd: () => run_cmd,
});
module.exports = __toCommonJS(index_exports);

// lib/plugin.ts
var import_crypto = require("crypto");

// lib/models/config.ts
var configurable = class {
  config;
  constructor(defaults) {
    this.config = defaults;
  }
  configure(config) {
    Object.entries(config).forEach(([k, v]) => (this.config[k] = v));
  }
  get_val(key) {
    return this.config[key];
  }
  set_val(key, t) {
    this.config[key] = t;
  }
};

// lib/utils/schema_registry.ts
var schema_registry = class _schema_registry {
  static trees = {};
  static register_tree(id, opts) {
    let tree = { schemas: {}, enums: {} };
    if (opts.schemas) tree.schemas = opts.schemas;
    if (opts.enums) tree.enums = opts.enums;
    _schema_registry.trees[id] = tree;
  }
  static get_schema(id, name) {
    return _schema_registry.trees[id].schemas[name];
  }
  static get_enum(id, name) {
    return _schema_registry.trees[id].enums[name];
  }
  static register(id, name, opts) {
    if (!_schema_registry.trees[id])
      _schema_registry.trees[id] = { schemas: {}, enums: {} };
    if (opts.schema) {
      _schema_registry.trees[id].schemas[name] = opts.schema;
      return;
    }
    if (opts.enum) _schema_registry.trees[id].enums[name] = opts.enum;
  }
  static get_manager(id) {
    return {
      get_sch: (name) => {
        return _schema_registry.get_schema(id, name);
      },
      get_enum: (name) => {
        return _schema_registry.get_enum(id, name);
      },
      is_ref: (ref) => {
        return ref.startsWith("$ref");
      },
      from_ref: (ref) => {
        const [_, type, ref_name] = ref.split("/");
        if (type.startsWith("obj"))
          return _schema_registry.get_schema(id, ref_name);
        return _schema_registry.get_enum(id, ref_name);
      },
    };
  }
};

// lib/plugin.ts
var plugin = class extends configurable {
  id;
  constructor(def, config_schema, sch_tree3 = {}, enum_tree3 = {}) {
    super(def);
    this.id =
      this.constructor.name + (0, import_crypto.randomBytes)(4).toString("hex");
    schema_registry.register_tree(this.id, {
      schemas: { ...sch_tree3, [this.id]: config_schema },
      enums: enum_tree3,
    });
  }
};

// lib/plugins/logger.ts
var stol = {
  error: 1 /* error */,
  warn: 2 /* warn */,
  info: 3 /* info */,
  debug: 4 /* debug */,
};
var ltos = {
  1: "error",
  2: "warn",
  3: "info",
  4: "debug",
};
var logger = class extends plugin {
  constructor() {
    super(
      {
        where: "default-logger",
        "log-level": "info",
      },
      {
        where: "str",
        "log-level": "$ref/enum/log-level",
      },
      {},
      { "log-level": ["debug", "info", "warn", "error", "off"] },
    );
  }
  throw = (text, code) => {
    this.error(text);
    process.exit(code ? code : 1);
  };
  error = (...args) => {
    if (this.get_val("log-level") === "off") return;
    if (1 /* error */ > stol[this.get_val("log-level")]) return;
    console.error(...args);
  };
  warn = (...args) => {
    if (this.get_val("log-level") === "off") return;
    if (2 /* warn */ > stol[this.get_val("log-level")]) return;
    console.warn(...args);
  };
  info = (...args) => {
    if (this.get_val("log-level") === "off") return;
    if (3 /* info */ > stol[this.get_val("log-level")]) return;
    console.info(...args);
  };
  debug = (...args) => {
    if (this.get_val("log-level") === "off") return;
    if (4 /* debug */ > stol[this.get_val("log-level")]) return;
    console.debug(...args);
  };
};
function ts() {
  return /* @__PURE__ */ new Date()
    .toLocaleString("sv", { timeZone: "CET" })
    .split("+")[0];
}
function get_anonymous(name) {
  let base = {};
  base.config = {
    "log-level": "info",
    where: name,
  };
  base = Object.entries(ltos).reduce((obj, [l, n]) => {
    return {
      ...obj,
      [n]: (...args) => {
        if (base.config["log-level"] === "off") return;
        if (parseInt(l) > stol[base.config["log-level"]]) return;
        console[n](
          `|${ts()}|${(n.length === 4 ? " " : "") + n.toUpperCase()}|[${base.config.where}]: `,
          ...args,
        );
      },
    };
  }, base);
  base.throw = (text, code) => {
    (base.error(text), process.exit(code ? code : 1));
  };
  return base;
}

// lib/builders.ts
var import_crypto2 = require("crypto");
var builder = class {
  description;
  name;
  constructor(name, description) {
    this.name = name;
    this.description = description ? description : "No description provided.";
  }
};
var IDENT = "    ";
var cmd_builder = class _cmd_builder extends builder {
  exec;
  named;
  pos;
  counter;
  schema_tree;
  plugins;
  enum_tree;
  constructor(name, plugins2, description) {
    super(name, description);
    this.plugins = plugins2;
    this.enum_tree = {};
    this.counter = 0;
    this.named = {};
    this.pos = [];
    this.exec = () => {};
    this.schema_tree = {};
  }
  static make_builder(plugins2 = { logger }) {
    return (name, description) => {
      return new _cmd_builder(name, Object.keys(plugins2), description);
    };
  }
  //not gonna be able to ref enum here
  add_pos(type, options) {
    if (!options) options = {};
    const idx = this.counter++;
    if (!options.name) options.name = `pos n\xB0${idx}`;
    if (type.startsWith("obj")) this.schema_tree[options.name] = options.schema;
    if (type.startsWith("enum")) this.enum_tree[options.name] = options.choices;
    this.pos.push({
      name: options.name,
      idx,
      type,
      description: options.description
        ? options.description
        : "No description provided.",
      variadic: options.variadic ? options.variadic : false,
    });
    return this;
  }
  add_named(name, type, options) {
    if (!options) options = {};
    if (typeof options.optional === "undefined") options.optional = false;
    if (typeof options.variadic === "undefined") options.variadic = false;
    if (type.startsWith("obj")) this.schema_tree[name] = options.schema;
    if (type.startsWith("enum")) this.enum_tree[name] = options.choices;
    this.named[name] = {
      name,
      optional: options.optional,
      shorthands: options.shorthand
        ? [options.shorthand, `--${name}`]
        : [`--${name}`],
      type,
      description: options.description
        ? options.description
        : "No description provided.",
      variadic: options.variadic,
      ...(options.default && { default: options.default }),
    };
    return this;
  }
  add_schema(name, schema) {
    this.schema_tree[name] = schema;
    return this;
  }
  add_enum(name, choices) {
    this.enum_tree[name] = choices;
    return this;
  }
  gen_usage() {
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
  gen_help() {
    let col0 = [
      this.gen_usage(),
      "Description:",
      `${IDENT}${this.description}`,
    ];
    let col1 = ["\n", "", "\n"];
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
    let maxl = Math.max(...col0.map((s) => s.length));
    for (let i = 0; i < col0.length; i++) {
      col0[i] =
        `${col0[i]}${" ".repeat(maxl - col0[i].length)}${IDENT}${col1[i]}`;
    }
    return col0.join("\n");
  }
  add_func(func) {
    this.exec = func;
    return {
      build: () => this.build(),
    };
  }
  build() {
    const id = this.name + (0, import_crypto2.randomBytes)(4).toString("hex");
    schema_registry.register_tree(id, {
      schemas: this.schema_tree,
      enums: this.enum_tree,
    });
    return {
      execute: this.exec,
      id,
      named: this.named,
      pos: this.pos,
      name: this.name,
      description: this.description,
      help: this.gen_help(),
      plugins: this.plugins,
    };
  }
};
var cli_builder = class extends builder {
  cli_tree;
  version;
  constructor(name, description, version) {
    super(name, description);
    this.version = version ? version : "0.0.0";
    this.cli_tree = {};
  }
  add_subcli(subcli) {
    this.cli_tree[subcli.name] = subcli;
    return this;
  }
  add_subcmd(subcmd) {
    this.cli_tree[subcmd.name] = subcmd;
    return this;
  }
  gen_usage() {
    return `Usage: ${this.name} <command> [options]`;
  }
  gen_help() {
    let col0 = [
      this.gen_usage(),
      "Description:",
      `${IDENT}${this.description}`,
      "Commands:",
    ];
    let col1 = ["\n", "", "\n", ""];
    Object.values(this.cli_tree).forEach((def) => {
      col0.push(`${IDENT}${def.name}`);
      col1.push(def.description);
    });
    let maxl = Math.max(...col0.map((s) => s.length));
    for (let i = 0; i < col0.length; i++) {
      col0[i] =
        `${col0[i]}${" ".repeat(maxl - col0[i].length)}${IDENT}${IDENT}${col1[i]}`;
    }
    return col0.join("\n");
  }
  build() {
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
};

// lib/memory.ts
var builtin_meta_args = [
  {
    plugin: "logger",
    shorthands: ["--verbose", "-v"],
    name: "verbose",
    key: "log-level",
    type: "bool",
    transform: (verbose) => (verbose ? "debug" : "info"),
  },
  {
    plugin: "logger",
    shorthands: ["--silent", "-s"],
    name: "silent",
    key: "log-level",
    type: "bool",
    transform: (silent) => (silent ? "off" : "info"),
  },
  {
    plugin: "logger",
    shorthands: ["--debug"],
    name: "debug",
    key: "log-level",
    type: "bool",
    transform: (debug) => (debug ? "debug" : "info"),
  },
  {
    plugin: "logger",
    shorthands: ["--log-level", "-ll"],
    name: "log-level",
    key: "log-level",
    type: "enum",
  },
];
var builtin_meta_cmds = [
  { names: ["--help"] },
  { names: ["--version"] },
  { names: ["--config"] },
];
var mem = class _mem {
  static components = {};
  static add(key, component) {
    if (Array.isArray(component) && component.length === 0) return;
    _mem.components[key] = component;
  }
  static init_builtins() {
    _mem.add("meta_args", builtin_meta_args);
    _mem.add("meta_cmds", builtin_meta_cmds);
  }
  static get(key) {
    const result = _mem.components[key];
    if (!result) return [];
    return result;
  }
  static push(key, component) {
    _mem.components[key].push(component);
  }
  static pop(key) {
    return _mem.components[key].pop();
  }
  static create_mem_manager() {
    return {
      add: _mem.add,
      get: _mem.get,
      push: _mem.push,
      pop: _mem.pop,
      clear: () => (_mem.components = {}),
    };
  }
};
mem.init_builtins();
function add_meta_arg(meta_arg) {
  mem.create_mem_manager().push("meta_args", meta_arg);
}

// lib/plugins/cache.ts
var import_fs = require("fs");
var cache = class extends plugin {
  constructor() {
    super({ filename: "cache.json" }, { filename: "path" });
  }
  write(record) {
    (0, import_fs.writeFileSync)(
      this.get_val("filename"),
      JSON.stringify(record),
    );
  }
  read() {
    try {
      return JSON.parse(
        (0, import_fs.readFileSync)(this.get_val("filename"), "utf-8"),
      );
    } catch (_) {}
    return {};
  }
  set(key, value) {
    this.write({ ...this.read(), [key]: value });
  }
  get(key) {
    return this.read()[key];
  }
};

// lib/plugins/plugins.ts
var plugins = {
  logger: new logger(),
  cache: new cache(),
};
function register_plugin(plugin_cls) {
  plugins[plugin_cls.name] = new plugin_cls();
}

// lib/system.ts
var system = class extends configurable {
  logger;
  constructor(defaults) {
    super(defaults);
    this.logger = get_anonymous(this.constructor.name);
  }
  run(_op) {
    const op = _op ? _op : "default";
    const idx = this.config.ops.findIndex((e) => e === op);
    if (idx === -1) {
      this.logger.throw(`Unrecognized op mode: ${op}`);
    }
    const gets = this.get_val("gets")[idx].split(",");
    const sets = this.get_val("sets")[idx];
    this.post = void 0;
    const mem_man = mem.create_mem_manager();
    this.pre = () => {
      let args = [];
      gets.forEach((c) => {
        args.push(mem_man.get(c));
      });
      return args;
    };
    if (sets.length !== 0) {
      this.post = (res) => {
        const comp_names = sets.split(",");
        if (comp_names.length === 1) {
          mem_man.add(comp_names[0], res);
        } else {
          res.forEach((c, i) => {
            mem_man.add(comp_names[i], c);
          });
        }
      };
    }
    this._run(op);
  }
  find(cmd_def, name) {
    if (cmd_def.named[name]) {
      return cmd_def.named[name];
    }
    return cmd_def.pos.find((pos_arg) => pos_arg.name === name);
  }
  _run(op) {
    const args = this.pre();
    if (this.post) {
      const result = this[op](...args);
      this.post(result);
    } else {
      this.default(...args);
    }
  }
  pre;
  post;
};

// lib/systems/assigner.ts
var assigner_sys = class extends system {
  constructor() {
    super({
      gets: ["parsed_args,cmd_def,plugins"],
      sets: ["args"],
      ops: ["default"],
    });
  }
  default(parsed_args, cmd_def, plugins2) {
    let named = {};
    let pos = [];
    parsed_args.forEach((parsed_arg) => {
      if (!parsed_arg.meta) {
        const base_arg = this.find(cmd_def, parsed_arg.name);
        if (this.is_pos(base_arg)) {
          pos.push(parsed_arg);
          return;
        }
        if (cmd_def.named[parsed_arg.name].variadic) {
          if (!named[parsed_arg.name]) {
            named[parsed_arg.name] = [];
          }
          named[parsed_arg.name].push(parsed_arg.value);
        } else {
          named[parsed_arg.name] = parsed_arg.value;
        }
      }
    });
    return {
      named,
      pos: pos.map((a) => a.value),
      plugins: plugins2,
    };
  }
  is_pos(base_arg) {
    return "idx" in base_arg;
  }
};

// lib/systems/configurer.ts
var config_sys = class extends system {
  constructor() {
    super({
      gets: [
        "plugins,cmd_def",
        "parsed_args,meta_args,config_values,plugins",
        "config_values,cmd_def",
      ],
      sets: ["plugins", "plugins", "cmd_def"],
      ops: ["reduce_plugins", "configure_plugins", "default"],
    });
  }
  default(config_values, cmd_def) {
    Object.entries(config_values).forEach(([k, v]) => {
      if (k in cmd_def.named) {
        cmd_def.named[k].default = v;
      }
    });
    return cmd_def;
  }
  reduce_plugins(plugins2, cmd_def) {
    return cmd_def.plugins.reduce((obj, pname) => {
      return { ...obj, [pname]: plugins2[pname] };
    }, {});
  }
  configure_plugins(parsed_args, meta_args, config_values, plugins2) {
    Object.entries(config_values).forEach(([k, v]) => {
      if (!k.startsWith("p.")) return;
      const [_, plugin_name] = k.split(".");
      if (plugin_name in plugins2) {
        Object.entries(v).forEach(([pk, pv]) =>
          plugins2[plugin_name].set_val(pk, pv),
        );
      }
    });
    meta_args.forEach((meta_arg) => {
      const parsed_arg = parsed_args.find(
        (parsed_arg2) => parsed_arg2.name === meta_arg.name && parsed_arg2.meta,
      );
      if (parsed_arg) {
        plugins2[meta_arg.plugin].configure({
          [meta_arg.key]: meta_arg.transform
            ? meta_arg.transform(parsed_arg.value)
            : parsed_arg.value,
        });
      }
    });
    return plugins2;
  }
};

// lib/systems/converter.ts
var converter_sys = class extends system {
  constructor() {
    super({
      gets: ["cmd_def,str_args,meta_args"],
      sets: ["parsed_args"],
      ops: ["default"],
    });
  }
  default(cmd_def, str_args, meta_args) {
    return str_args.map((str_arg) => {
      if (!str_arg.meta) {
        const cmd_arg = this.find(cmd_def, str_arg.name);
        return this.convert(cmd_arg.type, cmd_arg.name, str_arg);
      }
      const meta_arg = meta_args.find((ma) => ma.name === str_arg.name);
      return this.convert(meta_arg.type, meta_arg.name, str_arg);
    });
  }
  convert(type, name, str_arg) {
    return {
      value: this.converters[`to_${type}`](str_arg.strval),
      name,
      meta: str_arg.meta,
    };
  }
  osplit(objarr) {
    if (!(objarr.startsWith("[") && objarr.endsWith("]"))) {
      objarr = `[${objarr}]`;
    }
    return JSON.parse(objarr).map((o) => JSON.stringify(o));
  }
  unity = (strval) => strval;
  to_bool = (strval) => strval === "true" || strval === "1";
  to_float = (strval) => parseFloat(strval);
  to_int = (strval) => parseInt(strval);
  to_obj = (strval) => JSON.parse(strval);
  to_str_lst = (strval) => (strval.length === 0 ? [] : strval.split(","));
  to_date = (strval) => new Date(strval);
  converters = {
    to_bool: this.to_bool,
    to_float: this.to_float,
    to_int: this.to_int,
    to_str: this.unity,
    to_path: this.unity,
    to_enum: this.unity,
    to_date: this.to_date,
    to_any: (strval) => {
      let result;
      result = new Date(strval);
      if (!isNaN(result.getTime())) {
        return result;
      }
      try {
        result = JSON.parse(strval);
      } catch (_) {
        return strval;
      }
      return result;
    },
    to_obj: this.to_obj,
    to_obj_lst: (strval) => this.osplit(strval).map((o) => this.to_obj(o)),
    to_enum_lst: this.to_str_lst,
    to_str_lst: this.to_str_lst,
    to_bool_lst: (strval) => strval.split(",").map((b) => this.to_bool(b)),
    to_float_lst: (strval) => strval.split(",").map((f) => this.to_float(f)),
    to_int_lst: (strval) => strval.split(",").map((n) => this.to_int(n)),
    to_path_lst: this.to_str_lst,
    to_date_lst: (strval) => strval.split(",").map((n) => this.to_date(n)),
  };
};

// lib/systems/executor.ts
var executor_sys = class extends system {
  constructor() {
    super({
      gets: ["args,cmd_def"],
      sets: [""],
      ops: ["default"],
    });
  }
  default(args, cmd_def) {
    cmd_def.execute(args.plugins, args.named, ...args.pos);
  }
};

// lib/utils/cursor.ts
var cursor = class {
  lst;
  idx;
  constructor(lst) {
    this.lst = lst;
    this.idx = 0;
  }
  expect(predicate) {
    if (!predicate(this.lst[this.idx])) {
      throw new Error(`Unexpected value: ${this.lst[this.idx]}`);
    }
  }
  peek() {
    return this.lst[this.idx];
  }
  pop() {
    if (this.idx === -1) {
      return void 0;
    }
    return this.lst.splice(this.idx, 1)[0];
  }
  move(predicate) {
    this.idx = this.lst.findIndex(predicate);
  }
  next() {
    const res = this.peek();
    this.idx++;
    return res;
  }
  done() {
    return this.idx >= this.lst.length;
  }
};

// lib/systems/finder.ts
var finder_sys = class extends system {
  constructor() {
    super({
      gets: ["raw_argv,cli_def,meta_cmds"],
      sets: ["context"],
      ops: ["default"],
    });
  }
  default(raw_argv, cli_def, meta_cmds) {
    let c = new cursor(raw_argv.content);
    let depth = cli_def;
    let meta_cmd = meta_cmds.find((meta_cmd2) =>
      meta_cmd2.names.some((name) => name === c.peek()),
    );
    if (meta_cmd) {
      return { value: "meta", depth: depth.name };
    }
    while (!this.is_cmd_def(depth)) {
      if (c.done()) {
        this.logger.throw(
          `No command found for subcommand chain: ${raw_argv.content}`,
        );
      }
      const term = c.next();
      if (!(term in depth.cli_tree)) {
        this.logger.throw(`Unrecognized subcommand: ${term}`);
      }
      depth = depth.cli_tree[term];
      let meta_cmd2 = meta_cmds.find((meta_cmd3) =>
        meta_cmd3.names.some((name) => name === c.peek()),
      );
      if (meta_cmd2) {
        return { value: "meta", depth: depth.name };
      }
    }
    return { value: "default", depth: depth.name };
  }
  is_cmd_def(def) {
    return "execute" in def && "named" in def && "pos" in def && "id" in def;
  }
};

// lib/utils/nested_db.ts
var import_path = require("path");
var import_fs2 = require("fs");
var ndb = class {
  root;
  logger;
  constructor(dir_name) {
    this.logger = get_anonymous("NDB");
    this.root = (0, import_path.join)(this.home(), ".cli-maker", dir_name);
    if (!this.has_data(this.root))
      (0, import_fs2.mkdirSync)(this.root, { recursive: true });
  }
  create_path(parts) {
    return (0, import_path.join)(this.root, ...parts);
  }
  to_absolute(path) {
    return path.startsWith("/") || path.slice(1).startsWith(":\\")
      ? path
      : (0, import_path.join)(process.cwd(), path);
  }
  read_data(path) {
    let result = {};
    try {
      result = JSON.parse((0, import_fs2.readFileSync)(path, "utf-8"));
    } catch (_) {
      this.logger.throw(`File at ${path} is corrupt`);
    }
    return result;
  }
  write_data(path, new_data) {
    let old = {};
    if (!this.has_data(path)) {
      this.create_data(path);
    } else {
      old = this.read_data(path);
    }
    (0, import_fs2.writeFileSync)(
      path,
      JSON.stringify({ ...old, ...new_data }),
    );
  }
  create_data(path) {
    (0, import_fs2.mkdirSync)(
      (0, import_path.join)(...path.split(import_path.sep).slice(0, -1)),
      { recursive: true },
    );
    (0, import_fs2.openSync)(path, "w");
  }
  has_data(path) {
    return (0, import_fs2.existsSync)(path);
  }
  delete_data(path) {
    (0, import_fs2.rmSync)(path, { recursive: true });
  }
  home() {
    return process.env.APPDATA || process.env.HOME || "./";
  }
};

// lib/models/build-util.ts
function is_meta(v) {
  return (
    typeof v === "object" &&
    "name" in v &&
    typeof v.name === "string" &&
    "description" in v &&
    typeof v.description === "string"
  );
}
function is_base_arg(v) {
  return (
    is_meta(v) &&
    "type" in v &&
    typeof v.type === "string" &&
    "variadic" in v &&
    typeof v.variadic === "boolean"
  );
}
function is_named_arg(v) {
  return (
    is_base_arg(v) &&
    "optional" in v &&
    typeof v.optional === "boolean" &&
    "shorthands" in v &&
    Array.isArray(v.shorthands) &&
    v.shorthands.every((sh) => typeof sh === "string")
  );
}
function is_pos_arg(v) {
  return is_base_arg(v) && "idx" in v && typeof v.idx === "number";
}
function is_cmd_def(v) {
  return (
    is_meta(v) &&
    "execute" in v &&
    typeof v.execute === "function" &&
    "named" in v &&
    typeof v.named === "object" &&
    Object.values(v.named).every((n) => is_named_arg(n)) &&
    "pos" in v &&
    Array.isArray(v.pos) &&
    v.pos.every((p) => is_pos_arg(p)) &&
    "help" in v &&
    typeof v.help === "string" &&
    "id" in v &&
    typeof v.id === "string" &&
    "plugins" in v &&
    typeof v.plugins === "object"
  );
}
function is_cli_def(v) {
  return (
    is_meta(v) &&
    "version" in v &&
    typeof v.version === "string" &&
    "help" in v &&
    typeof v.help === "string" &&
    "cli_tree" in v &&
    typeof v.cli_tree === "object" &&
    Object.values(v.cli_tree).every((_v) => is_cli_def(_v) || is_cmd_def(_v))
  );
}
var build_util_default = is_cli_def;

// lib/utils/conf.ts
var conf = class _conf {
  static cmddef_conf(default_config, cmd_def, plugin_config, path) {
    let result = {};
    if ("plugins" in default_config) {
      if (typeof default_config.plugins !== "object") {
        throw new Error(`Invalid plugins entry: ${default_config.plugins}`);
      }
      plugin_config = { ...plugin_config, ...default_config.plugins };
      delete default_config.plugins;
    }
    let sub = {};
    Object.entries(plugin_config).forEach(([pname, pconf]) => {
      if (!cmd_def.plugins.some((p2) => p2 === pname)) return;
      if (typeof pconf !== "object") {
        throw new Error(`Invalid plugin config: ${pconf}`);
      }
      if (!(pname in plugins)) {
        throw new Error(`Unrecognized plugin: ${plugins}`);
      }
      const p = plugins[pname];
      let subsub = {};
      Object.entries(pconf).forEach(([pconfk, pconfv]) => {
        if (!(pconfk in p.config)) {
          throw new Error(`Unrecognized ${pname} plugin config key: ${pconfk}`);
        }
        subsub[pconfk] = pconfv;
      });
      sub["p." + pname] = subsub;
      result = { ...result, ...sub };
    });
    Object.entries(default_config).forEach(([dconfk, dconfv]) => {
      if (!(dconfk in cmd_def.named)) {
        throw new Error(`Unrecognized ${cmd_def.name} config key: ${dconfk}`);
      }
      if (cmd_def.named[dconfk].default === void 0) {
        throw new Error(`Key ${dconfk} has no default value`);
      }
      result[dconfk] = dconfv;
    });
    return [{ defaults: result, path: [...path, cmd_def.name] }];
  }
  static clidef_conf(cli_config, cli_def, plugin_config, path) {
    let result = [];
    path = [...path, cli_def.name];
    if ("plugins" in cli_config) {
      if (typeof cli_config.plugins !== "object") {
        throw new Error(`Invalid plugins entry: ${cli_config.plugins}`);
      }
      plugin_config = { ...plugin_config, ...cli_config.plugins };
      delete cli_config.plugins;
    }
    Object.entries(cli_config).forEach(([subconfk, subconfv]) => {
      if (!(subconfk in cli_def.cli_tree)) {
        throw new Error(`Unrecognized config key: ${subconfk}`);
      }
      if (typeof subconfv !== "object") {
        throw new Error(`Invalid subdef config entry: ${subconfk}:${subconfv}`);
      }
      result.push(
        ..._conf.parse_conf(
          subconfv,
          cli_def.cli_tree[subconfk],
          plugin_config,
          path,
        ),
      );
    });
    return result;
  }
  static parse_conf(config, def, plugin_config, path) {
    if (build_util_default(def)) {
      return _conf.clidef_conf(config, def, plugin_config, path);
    }
    return _conf.cmddef_conf(config, def, plugin_config, path);
  }
  static parse_clidef(def) {
    let result = {};
    Object.values(def.cli_tree).forEach((subc) => {
      result[subc.name] = _conf.parse_def(subc);
    });
    return result;
  }
  static parse_cmddef(def) {
    return {
      ...Object.values(def.named).reduce(
        (obj, named_arg) => {
          if (!named_arg.default) return obj;
          return {
            schema: { ...obj.schema, [named_arg.name]: named_arg.type },
            defaults: { ...obj.defaults, [named_arg.name]: named_arg.default },
          };
        },
        { defaults: {}, schema: {} },
      ),
      plugins: def.plugins,
    };
  }
  static find(path, def) {
    if (!build_util_default(def)) return def;
    path.slice(1).forEach((p) => (def = def.cli_tree[p]));
    return def;
  }
  static parse_def(def) {
    if (build_util_default(def)) {
      return _conf.parse_clidef(def);
    }
    return _conf.parse_cmddef(def);
  }
  static get_parser() {
    return {
      parse_conf(config, def) {
        return _conf.parse_conf(config, def, {}, []);
      },
      parse_def(def) {
        return _conf.parse_def(def);
      },
      find: _conf.find,
    };
  }
};

// lib/systems/meta_cmd.ts
var meta_cmd_sys = class extends system {
  constructor() {
    super({
      gets: [
        "raw_argv,context,cli_def,plugins",
        "raw_argv,context",
        "context,raw_argv,cli_def",
        "",
      ],
      sets: ["cmd_def,str_args", "raw_argv", "config_values", "meta_cmds"],
      ops: ["default", "clip_rawargv", "check_defaults", "set_meta_cmds"],
    });
  }
  //checks if running command has defaults
  //writes a defaults config to components and flags the workflow
  default(raw_argv, context, cli_def, plugins2) {
    const depth_idx = raw_argv.content.indexOf(context.depth);
    const chain = raw_argv.content.slice(0, depth_idx + 1);
    const rest = new cursor(raw_argv.content.slice(depth_idx + 1));
    let depth = cli_def;
    chain.forEach((d) => (depth = depth.cli_tree[d]));
    if (context.value === "meta") {
      switch (rest.next()) {
        case "--config":
          const n = rest.next();
          return this.get_config_cmd(
            depth,
            plugins2,
            rest.next(),
            chain,
            cli_def.name,
            n,
          );
        case "--help":
          return [this.to_help(depth), []];
        case "--version":
          return [this.to_version(cli_def), []];
      }
    }
    return [depth, []];
  }
  clip_rawargv(raw_argv, context) {
    if (context.value === "meta") return { content: [] };
    return raw_argv;
  }
  check_defaults(context, raw_argv, cli_def) {
    if (context.value === "meta") {
      return {};
    }
    let chain = raw_argv.content.slice(
      0,
      raw_argv.content.indexOf(context.depth) + 1,
    );
    const db = new ndb(cli_def.name);
    let p = db.create_path(chain);
    if (!db.has_data(p)) {
      return {};
    }
    return db.read_data(p);
  }
  set_meta_cmds() {
    return [
      { names: ["--config"] },
      { names: ["--help"] },
      { names: ["--version"] },
    ];
  }
  get_config_cmd(def, plugins2, file_path, chain, cli_name, subcommand) {
    switch (subcommand) {
      case "set":
        return this.build_set_cmd(def, file_path, plugins2, cli_name);
      case "show":
        return this.build_show_cmd(def);
      case "unbind":
        return this.build_unbind_cmd(chain, cli_name);
      default:
        this.logger.throw(`Unrecognized config subcommand: ${subcommand}`);
    }
    return {};
  }
  build_show_cmd(def) {
    return [
      cmd_builder
        .make_builder()("show")
        .add_func(({ logger: logger2 }, ...__) => {
          const p = conf.get_parser();
          const unmerged = p.parse_def(def);
          logger2.info(JSON.stringify(unmerged, null, 1));
        })
        .build(),
      [],
    ];
  }
  build_unbind_cmd(chain, cli_name) {
    return [
      cmd_builder
        .make_builder()("unbind")
        .add_func(({ logger: logger2 }, _, ...__) => {
          const db = new ndb(cli_name);
          const p = db.create_path(chain);
          if (db.has_data(p)) {
            db.delete_data(p);
          } else {
            logger2.info(`No such config file: ${p}`);
          }
        })
        .build(),
      [],
    ];
  }
  build_set_cmd(def, file_path, plugins2, cli_name) {
    if (!file_path) {
      this.logger.throw("No file provided for config set");
    }
    const db = new ndb("");
    file_path = db.to_absolute(file_path);
    if (!db.has_data(file_path)) {
      this.logger.throw(`${file_path} does not exist`);
    }
    let str_args = [];
    let content;
    try {
      content = db.read_data(file_path);
    } catch (_) {
      this.logger.throw(`Object at ${file_path} is an invalid json object`);
    }
    let b = cmd_builder.make_builder()("set");
    const p = conf.get_parser();
    const res = p.parse_conf(content, def);
    res.forEach((parsed_conf) => {
      const d = p.find(parsed_conf.path, def);
      const prefix = parsed_conf.path.join(".");
      Object.entries(parsed_conf.defaults).forEach(([k, v]) => {
        if (k.startsWith("p.")) {
          const [_, pname] = k.split(".");
          const pid = plugins2[pname].id;
          const s = schema_registry.get_manager(pid);
          const config_schema = s.get_sch(pid);
          Object.entries(v).forEach(([pk, pv]) => {
            const schema = s.get_sch(pk);
            const _enum = s.get_enum(pk);
            const name = prefix + "." + k + "." + pk;
            let t = config_schema[pk];
            b = b.add_named(name, s.is_ref(t) ? t.split("/")[1] : t, {
              optional: true,
              ...(schema && { schema }),
              ...(_enum && { choices: _enum }),
            });
            str_args.push({
              strval:
                typeof pv === "object" ? JSON.stringify(pv) : pv.toString(),
              name,
              meta: false,
            });
          });
        } else {
          const name = prefix + "." + k;
          const s = schema_registry.get_manager(d.id);
          const schema = s.get_sch(k);
          const _enum = s.get_enum(k);
          b = b.add_named(name, d.named[k].type, {
            optional: true,
            ...(schema && { schema }),
            ...(_enum && { choices: _enum }),
          });
          str_args.push({
            strval: typeof v === "object" ? JSON.stringify(v) : v.toString(),
            name,
            meta: false,
          });
        }
      });
    });
    return [
      b
        .add_func(({ logger: logger2 }, args, ...__) => {
          const db2 = new ndb(cli_name);
          res.forEach((pc) => {
            if (pc.path[0] === cli_name) {
              pc.path = pc.path.slice(1);
            }
            db2.write_data(db2.create_path(pc.path), pc.defaults);
          });
          logger2.info("Wrote config: ");
          logger2.info(JSON.stringify(res, null, 1));
        })
        .build(),
      str_args,
    ];
  }
  to_version(def) {
    return {
      id: "",
      named: {},
      pos: [],
      plugins: ["logger"],
      name: "--version",
      description: `Prints ${def.name} help text`,
      help: `--version		Prints ${def.name} version`,
      execute: (plugins2, {}, ...[]) => {
        plugins2.logger.info(
          def.version
            ? def.version
            : "Version is transitive, call at top level",
        );
      },
    };
  }
  to_help(def) {
    return {
      id: "",
      named: {},
      pos: [],
      plugins: ["logger"],
      name: "--help",
      description: `Prints ${def.name} help text`,
      help: `--help		Prints ${def.name} help text`,
      execute: (plugins2, {}, ...[]) => {
        plugins2.logger.info(def.help);
      },
    };
  }
};

// lib/systems/parser.ts
var parser_sys = class extends system {
  constructor() {
    super({
      gets: ["raw_argv,cmd_def,meta_args", "raw_argv"],
      sets: ["str_args", "raw_argv"],
      ops: ["default", "normalize"],
    });
  }
  default({ content: argv }, cmd_def, meta_args) {
    let result = [];
    argv = argv.slice(argv.indexOf(cmd_def.name) + 1, argv.length);
    let argvc = new cursor(argv);
    let visited = /* @__PURE__ */ new Set();
    const handle_named = this.create_handle_named(visited, result, argvc);
    let posc = new cursor(cmd_def.pos);
    let posc_next;
    while (!argvc.done()) {
      let argvc_next = argvc.next();
      if (!handle_named(argvc_next, Object.values(cmd_def.named), false)) {
        if (handle_named(argvc_next, meta_args, true)) {
          continue;
        }
        if (!posc_next || !posc_next.variadic) posc_next = posc.next();
        if (!posc_next) {
          this.logger.throw(`Unrecognized positional argument: ${argvc_next}`);
        }
        result.push({ name: posc_next.name, strval: argvc_next, meta: false });
      }
    }
    while (!posc.done()) {
      posc_next = posc.next();
      if (posc_next && !posc_next.variadic) {
        this.logger.throw(
          `Missing required positional argument: ${posc_next.name}`,
        );
      }
    }
    Object.values(cmd_def.named).forEach((namedarg) => {
      if (visited.has(namedarg.name)) {
        return;
      }
      if (!namedarg.optional) {
        if (namedarg.type === "bool") {
          result.push({ name: namedarg.name, strval: "false", meta: false });
        } else if (!namedarg.default) {
          this.logger.throw(
            `Missing required named argument: ${namedarg.name}`,
          );
        } else {
          if (namedarg.variadic) {
            namedarg.default.forEach((v) => {
              result.push({
                name: namedarg.name,
                strval:
                  typeof v === "object" ? JSON.stringify(v) : v.toString(),
                meta: false,
              });
            });
          } else {
            result.push({
              name: namedarg.name,
              strval:
                typeof namedarg.default === "object"
                  ? JSON.stringify(namedarg.default)
                  : namedarg.default.toString(),
              meta: false,
            });
          }
        }
      }
    });
    return result;
  }
  create_handle_named(visited, result, argvc) {
    return (argvc_next, args, meta) => {
      const arg = args.find((arg2) =>
        arg2.shorthands.some((sh) => sh === argvc_next),
      );
      if (arg) {
        if (visited.has(arg.name) && !arg.variadic) {
          this.logger.throw(
            `Duplicate non variadic named argument: ${arg.name}`,
          );
        }
        visited.add(arg.name);
        if (arg.type === "bool") {
          result.push({ name: arg.name, strval: "true", meta });
        } else {
          result.push({
            name: arg.name,
            strval: argvc.next(),
            meta,
          });
        }
        return true;
      }
      return false;
    };
  }
  normalize(raw_argv) {
    let idx = 0;
    let argv = raw_argv.content;
    while (idx < argv.length) {
      let arg = argv[idx];
      if (/^--?[^\s=]+(\s|=).+$/.test(arg)) {
        const extract = arg.match(/^--?[^\s=]+(\s|=)/);
        if (extract) {
          const sh = extract[0];
          const val = arg.replace(sh, "");
          argv[idx] = sh.replace(/(\s|=)/g, "");
          argv.splice(idx + 1, 0, val);
          idx += 2;
        }
      } else {
        idx++;
      }
    }
    return { content: argv };
  }
};

// lib/systems/validator.ts
var import_path2 = require("path");
var validator_sys = class extends system {
  constructor() {
    super({
      gets: ["cmd_def,str_args,meta_args,plugins"],
      sets: [""],
      ops: ["default"],
    });
  }
  default(cmd_def, str_args, meta_args, plugins2) {
    const man = schema_registry.get_manager(cmd_def.id);
    str_args.forEach((str_arg) => {
      if (str_arg.meta) {
        const meta_arg = meta_args.find((ma) => ma.name === str_arg.name);
        this.validate(
          str_arg,
          meta_arg.type,
          meta_arg.name,
          schema_registry.get_manager(plugins2[meta_arg.plugin].id),
        );
      } else {
        const base_arg = this.find(cmd_def, str_arg.name);
        this.validate(str_arg, base_arg.type, base_arg.name, man);
      }
    });
  }
  validate(str_arg, type, name, man) {
    this.valid_simple(str_arg.strval, type);
    this.valid_specialized(str_arg.strval, type, name, man);
  }
  valid_specialized(strval, arg_type, schema_key, man) {
    switch (arg_type) {
      case "obj":
        const schema = man.get_sch(schema_key);
        this.is_valid_obj(strval, schema, man);
        break;
      case "enum":
        const choices = man.get_enum(schema_key);
        this.is_valid_enum(strval, choices, schema_key);
        break;
      case "obj_lst":
        const elem_schema = man.get_sch(schema_key);
        this.is_valid_obj_lst(strval, elem_schema, man);
        break;
      case "enum_lst":
        const elem_choices = man.get_enum(schema_key);
        this.is_valid_enum_lst(strval, elem_choices, schema_key);
        break;
      default:
        break;
    }
  }
  is_valid_obj_lst(strval, schema, man) {
    this.osplit(strval).forEach((obj) => this.is_valid_obj(obj, schema, man));
  }
  osplit(objarr) {
    if (!(objarr.startsWith("[") && objarr.endsWith("]"))) {
      objarr = `[${objarr}]`;
    }
    return JSON.parse(objarr).map((o) => JSON.stringify(o));
  }
  csplit(arrval) {
    if (arrval.startsWith("[") && arrval.endsWith("]")) {
      arrval = arrval.slice(1, arrval.length - 1);
    }
    return arrval.split(",").map((e) => e.replace(/\"/g, ""));
  }
  is_valid_enum_lst(strval, choices, name) {
    this.csplit(strval).forEach((e) => this.is_valid_enum(e, choices, name));
  }
  is_valid_enum(strval, choices, name) {
    if (!choices.some((e) => e === strval)) {
      this.logger.throw(`Expected ${name} enum value: ${strval}`);
    }
  }
  is_valid_obj = (strval, schema, man) => {
    const obj = JSON.parse(strval);
    return this.is_valid_obj_helper(obj, schema, man);
  };
  is_valid_obj_helper = (obj, schema, man) => {
    if (typeof obj !== "object") {
      this.logger.throw(`Expected object type but found: ${typeof obj}`);
    }
    for (const [k, sval] of Object.entries(schema)) {
      const v = obj[k];
      if (v === void 0) {
        this.logger.throw(`Missing key in object: ${k}`);
      }
      if (man.is_ref(sval)) {
        const [_, ref_type, ref_name] = sval.split("/");
        this.valid_specialized(
          typeof v === "string" ? v : JSON.stringify(v),
          ref_type,
          ref_name,
          man,
        );
      } else {
        this.valid_simple(v.toString(), sval);
      }
    }
    return true;
  };
  is_number = (strval) => strval.trim() !== "" && !isNaN(parseFloat(strval));
  is_bool = (strval) => ["true", "false", "0", "1"].some((e) => e === strval);
  is_int = (strval) => this.is_number(strval) && !strval.includes(".");
  is_str = (_) => true;
  is_path = (strval) => {
    const { s, b } =
      import_path2.sep === "/"
        ? { s: "\\/", b: "\\.{2}" }
        : { s: "\\\\", b: "[a-zA-Z]:" };
    const r = new RegExp(`^((${b})?${s})?([\\w\\-. ]+${s})*[\\w\\-. ]+$`);
    return r.test(strval);
  };
  is_str_lst = (strval) => /^([^,]+(,[^,]+)*)?$/.test(strval);
  is_obj = (strval) => {
    try {
      const o = JSON.parse(strval);
      return typeof o === "object";
    } catch (_) {
      return false;
    }
  };
  is_date = (strval) => !isNaN(new Date(strval).getTime());
  valid_simple(strval, typename) {
    if (!this.validators[`is_${typename}`](strval)) {
      this.logger.throw(`Validation error: ${strval} is not ${typename}`);
    }
  }
  validators = {
    is_bool: this.is_bool,
    is_float: this.is_number,
    is_int: this.is_int,
    is_str: this.is_str,
    is_path: this.is_path,
    is_str_lst: this.is_str_lst,
    is_obj: this.is_obj,
    is_enum: this.is_str,
    is_date: this.is_date,
    is_any: (_) => true,
    is_bool_lst: (strval) =>
      this.is_str_lst(strval) &&
      this.csplit(strval).every((e) => this.is_bool(e)),
    is_float_lst: (strval) =>
      this.is_str_lst(strval) &&
      this.csplit(strval).every((e) => this.is_number(e)),
    is_int_lst: (strval) =>
      this.is_str_lst(strval) &&
      this.csplit(strval).every((e) => this.is_int(e)),
    is_path_lst: (strval) =>
      this.is_str_lst(strval) &&
      this.csplit(strval).every((e) => this.is_path(e)),
    is_obj_lst: (strval) =>
      this.is_str_lst(strval) &&
      this.osplit(strval).every((e) => this.is_obj(e)),
    is_enum_lst: this.is_str_lst,
    is_date_lst: (strval) =>
      this.is_str_lst(strval) &&
      this.csplit(strval).every((e) => this.is_date(e)),
  };
};

// lib/systems/systems.ts
var systems = {
  validator: validator_sys,
  converter: converter_sys,
  finder: finder_sys,
  configurer: config_sys,
  parser: parser_sys,
  executor: executor_sys,
  assigner: assigner_sys,
  meta: meta_cmd_sys,
};

// lib/coordinator.ts
var main_operation = [
  //add all predefined meta commands
  { do: "run", system: "meta", op: "set_meta_cmds" },
  //normalize argv
  { do: "run", system: "parser", op: "normalize" },
  //find cmddef ( or inject it from meta_cmd )
  { do: "run", system: "finder", op: "default" },
  //check config file
  { do: "run", system: "meta", op: "check_defaults" },
  //alter context if needed
  { do: "run", system: "meta", op: "default" },
  //alter context if needed
  { do: "run", system: "configurer", op: "reduce_plugins" },
  //further context alteration
  { do: "run", system: "meta", op: "clip_rawargv" },
  { do: "run", system: "configurer", op: "default" },
  //do the actual parsing
  { do: "run", system: "parser", op: "default" },
  //validation
  { do: "run", system: "validator", op: "default" },
  //conversion
  { do: "run", system: "converter", op: "default" },
  //modify cli behavior from passed meta arguments
  { do: "run", system: "configurer", op: "configure_plugins" },
  //assign all the necessities to the object passed to the function
  { do: "run", system: "assigner", op: "default" },
  //execute the function representing the command
  { do: "run", system: "executor", op: "default" },
];
var coordinator = class _coordinator {
  static hard_blocker = false;
  systems;
  constructor() {
    if (_coordinator.hard_blocker) {
      throw new Error(`There can only be one`);
    }
    this.systems = this.instantiate();
  }
  instantiate() {
    return Object.entries(systems).reduce((obj, [k, v]) => {
      return { ...obj, [k]: new v() };
    }, {});
  }
  run(proc) {
    const mem_man = mem.create_mem_manager();
    Object.entries(proc.init_components).forEach(([k, c]) => mem_man.add(k, c));
    proc.operation.forEach((step) => {
      switch (step.do) {
        case "config":
          this.systems[step.system].configure(step.config);
          break;
        case "run":
          this.systems[step.system].run(step.op);
          break;
        default:
          throw new Error(`Unrecognized operation type: ${step.do}`);
      }
    });
  }
  main(init_components) {
    this.run({ init_components, operation: main_operation });
  }
};
function run_cmd(input, cmd_def) {
  run_cli(input, new cli_builder("wrapper").add_subcmd(cmd_def).build());
}
function run_cli(input, cli_def) {
  const ctx = new coordinator();
  const init_components = {
    raw_argv: { content: input },
    cli_def,
    plugins,
  };
  ctx.main(init_components);
}
// Annotate the CommonJS export names for ESM import in node:
0 &&
  (module.exports = {
    add_meta_arg,
    cli_builder,
    cmd_builder,
    plugin,
    register_plugin,
    run_cli,
    run_cmd,
  });
