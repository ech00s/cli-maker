import { cli_def, cmd_def } from "../models/components";
import is_cli_def from "../models/build-util";
import { plugins } from "../plugins/plugins";
import { obj } from "../models/types";
import { schema } from "../models/schema";
interface pathed {
  path: string[];
}

export interface parsed_conf extends pathed {
  defaults: obj;
}

export interface parsed_def extends parsed_conf {
  schema: schema;
  plugins: string[];
}

export interface conf_parser {
  parse_conf(config: obj, def: cmd_def | cli_def): parsed_conf[];
  parse_def(def: cmd_def | cli_def): obj;
  find(path: string[], def: cli_def | cmd_def): cmd_def;
}

export class conf {
  private static cmddef_conf(
    default_config: obj,
    cmd_def: cmd_def,
    plugin_config: obj,
    path: string[],
  ): parsed_conf[] {
    let result: obj = {};
    if ("plugins" in default_config) {
      if (typeof default_config.plugins !== "object") {
        throw new Error(`Invalid plugins entry: ${default_config.plugins}`);
      }
      plugin_config = { ...plugin_config, ...default_config.plugins };
      delete default_config.plugins;
    }
    let sub: obj = {};
    Object.entries(plugin_config).forEach(([pname, pconf]) => {
      if (!cmd_def.plugins.some((p) => p === pname)) return;

      if (typeof pconf !== "object") {
        throw new Error(`Invalid plugin config: ${pconf}`);
      }

      if (!(pname in plugins)) {
        throw new Error(`Unrecognized plugin: ${plugins}`);
      }

      const p = plugins[pname];
      let subsub: obj = {};
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

      if (cmd_def.named[dconfk].default === undefined) {
        throw new Error(`Key ${dconfk} has no default value`);
      }

      result[dconfk] = dconfv;
    });
    return [{ defaults: result, path: [...path, cmd_def.name] }];
  }

  private static clidef_conf(
    cli_config: obj,
    cli_def: cli_def,
    plugin_config: obj,
    path: string[],
  ): parsed_conf[] {
    let result: parsed_conf[] = [];
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
        ...conf.parse_conf(
          subconfv,
          cli_def.cli_tree[subconfk],
          plugin_config,
          path,
        ),
      );
    });
    return result;
  }

  private static parse_conf(
    config: obj,
    def: cmd_def | cli_def,
    plugin_config: obj,
    path: string[],
  ) {
    if (is_cli_def(def)) {
      return conf.clidef_conf(config, def, plugin_config, path);
    }
    return conf.cmddef_conf(config, def, plugin_config, path);
  }

  private static parse_clidef(def: cli_def): Record<string, parsed_def> {
    let result: obj = {};
    Object.values(def.cli_tree).forEach((subc) => {
      result[subc.name] = conf.parse_def(subc);
    });
    return result;
  }

  private static parse_cmddef(def: cmd_def): parsed_def {
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
    } as any;
  }

  private static find(path: string[], def: cli_def | cmd_def): cmd_def {
    if (!is_cli_def(def)) return def;
    path.slice(1).forEach((p) => (def = (def as cli_def).cli_tree[p] as any));
    return def as any;
  }

  private static parse_def(def: cli_def | cmd_def): obj {
    if (is_cli_def(def)) {
      return conf.parse_clidef(def);
    }
    return conf.parse_cmddef(def);
  }

  public static get_parser(): conf_parser {
    return {
      parse_conf(config: obj, def: cmd_def | cli_def) {
        return conf.parse_conf(config, def, {}, []);
      },
      parse_def(def: cmd_def | cli_def) {
        return conf.parse_def(def);
      },
      find: conf.find,
    };
  }
}
