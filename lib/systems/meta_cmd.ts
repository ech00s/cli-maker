import { system } from "../system";
import {
  cli_def,
  cmd_def,
  context,
  meta_cmds,
  raw_argv,
  str_args,
  config_values,
  plugins,
} from "../models/components";
import { cmd_builder } from "../builders";
import { cursor } from "../utils/cursor";
import { ndb } from "../utils/nested_db";
import { schema_registry } from "../utils/schema_registry";
import { conf } from "../utils/conf";
import { obj } from "../models/types";

export class meta_cmd_sys extends system {
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
  default(
    raw_argv: raw_argv,
    context: context,
    cli_def: cli_def,
    plugins: plugins,
  ): [cmd_def, str_args] {
    const depth_idx = raw_argv.content.indexOf(context.depth);
    const chain: string[] = raw_argv.content.slice(0, depth_idx + 1);
    const rest = new cursor<string>(raw_argv.content.slice(depth_idx + 1));
    let depth: cli_def | cmd_def = cli_def;
    chain.forEach((d) => (depth = (depth as any).cli_tree[d]));
    //Override context
    if (context.value === "meta") {
      switch (rest.next()) {
        case "--config":
          const n = rest.next();
          return this.get_config_cmd(
            depth,
            plugins,
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
    return [depth as any, []];
  }

  clip_rawargv(raw_argv: raw_argv, context: context): raw_argv {
    if (context.value === "meta") return { content: [] };
    return raw_argv;
  }

  check_defaults(
    context: context,
    raw_argv: raw_argv,
    cli_def: cli_def,
  ): config_values {
    if (context.value === "meta") {
      return {};
    }
    let chain: string[] = raw_argv.content.slice(
      0,
      raw_argv.content.indexOf(context.depth) + 1,
    );
    const db = new ndb(cli_def.name);
    let p = db.create_path(chain); //default context
    if (!db.has_data(p)) {
      return {};
    }
    return db.read_data(p);
  }

  set_meta_cmds(): meta_cmds {
    return [
      { names: ["--config"] },
      { names: ["--help"] },
      { names: ["--version"] },
    ];
  }

  private get_config_cmd(
    def: cmd_def | cli_def,
    plugins: plugins,
    file_path: string,
    chain: string[],
    cli_name: string,
    subcommand: string,
  ): [cmd_def, str_args] {
    switch (subcommand) {
      case "set":
        return this.build_set_cmd(def, file_path, plugins, cli_name);
      case "show":
        return this.build_show_cmd(def);
      case "unbind":
        return this.build_unbind_cmd(chain, cli_name);
      default:
        this.logger.throw(`Unrecognized config subcommand: ${subcommand}`);
    }
    return {} as any;
  }

  private build_show_cmd(def: cmd_def | cli_def): [cmd_def, str_args] {
    return [
      cmd_builder
        .make_builder()("show")
        .add_func(({ logger }, ...__) => {
          const p = conf.get_parser();
          const unmerged = p.parse_def(def);
          logger.info(JSON.stringify(unmerged, null, 1));
        })
        .build(),
      [],
    ];
  }

  private build_unbind_cmd(
    chain: string[],
    cli_name: string,
  ): [cmd_def, str_args] {
    return [
      cmd_builder
        .make_builder()("unbind")
        .add_func(({ logger }, _, ...__) => {
          const db = new ndb(cli_name);
          const p = db.create_path(chain);
          if (db.has_data(p)) {
            db.delete_data(p);
          } else {
            logger.info(`No such config file: ${p}`);
          }
        })
        .build(),
      [],
    ];
  }

  private build_set_cmd(
    def: cmd_def | cli_def,
    file_path: string,
    plugins: plugins,
    cli_name: string,
  ): [cmd_def, str_args] {
    if (!file_path) {
      this.logger.throw("No file provided for config set");
    }
    const db = new ndb("");
    file_path = db.to_absolute(file_path);
    if (!db.has_data(file_path)) {
      this.logger.throw(`${file_path} does not exist`);
    }
    let str_args: str_args = [];
    let content!: obj;
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
          const pid = plugins[pname].id;
          const s = schema_registry.get_manager(pid);
          const config_schema = s.get_sch(pid);
          Object.entries(v).forEach(([pk, pv]) => {
            const schema = s.get_sch(pk);
            const _enum = s.get_enum(pk);
            const name = prefix + "." + k + "." + pk;
            let t = config_schema[pk];
            b = b.add_named(name, s.is_ref(t) ? t.split("/")[1] : (t as any), {
              optional: true,
              ...(schema && { schema: schema }),
              ...(_enum && { choices: _enum }),
            });
            str_args.push({
              strval:
                typeof pv === "object" ? JSON.stringify(pv) : pv!.toString(),
              name: name,
              meta: false,
            });
          });
        } else {
          const name = prefix + "." + k;
          const s = schema_registry.get_manager(d.id);
          const schema = s.get_sch(k);
          const _enum = s.get_enum(k);
          b = b.add_named(name, d.named[k].type as any, {
            optional: true,
            ...(schema && { schema: schema }),
            ...(_enum && { choices: _enum }),
          });
          str_args.push({
            strval: typeof v === "object" ? JSON.stringify(v) : v!.toString(),
            name: name,
            meta: false,
          });
        }
      });
    });
    return [
      b
        .add_func(({ logger }, args, ...__) => {
          const db = new ndb(cli_name);
          res.forEach((pc) => {
            if (pc.path[0] === cli_name) {
              pc.path = pc.path.slice(1);
            }
            db.write_data(db.create_path(pc.path), pc.defaults);
          });
          logger.info("Wrote config: ");
          logger.info(JSON.stringify(res, null, 1));
        })
        .build(),
      str_args,
    ];
  }

  private to_version(def: cli_def | cmd_def): cmd_def {
    return {
      id: "",
      named: {},
      pos: [],
      plugins: ["logger"],
      name: "--version",
      description: `Prints ${def.name} help text`,
      help: `--version\t\tPrints ${def.name} version`,
      execute: (plugins, {}, ...[]) => {
        (plugins.logger as any).info(
          (def as any).version
            ? (def as any).version
            : "Version is transitive, call at top level",
        );
      },
    };
  }

  private to_help(def: cli_def | cmd_def): cmd_def {
    return {
      id: "",
      named: {},
      pos: [],
      plugins: ["logger"],
      name: "--help",
      description: `Prints ${def.name} help text`,
      help: `--help\t\tPrints ${def.name} help text`,
      execute: (plugins, {}, ...[]) => {
        (plugins.logger as any).info(def.help);
      },
    };
  }
}
