import {
  cmd_def,
  meta_args,
  parsed_args,
  config_values,
  plugins,
} from "../models/components";
import { system } from "../system";

//config system
export class config_sys extends system {
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

  default(config_values: config_values, cmd_def: cmd_def): cmd_def {
    Object.entries(config_values).forEach(([k, v]) => {
      if (k in cmd_def.named) {
        cmd_def.named[k].default = v;
      }
    });

    return cmd_def;
  }

  private reduce_plugins(plugins: plugins, cmd_def: cmd_def): plugins {
    return cmd_def.plugins.reduce((obj, pname) => {
      return { ...obj, [pname]: plugins[pname] };
    }, {});
  }

  private configure_plugins(
    parsed_args: parsed_args,
    meta_args: meta_args,
    config_values: config_values,
    plugins: plugins,
  ): plugins {
    Object.entries(config_values).forEach(([k, v]) => {
      if (!k.startsWith("p.")) return;
      const [_, plugin_name] = k.split(".");
      if (plugin_name in plugins) {
        Object.entries(v).forEach(([pk, pv]) =>
          plugins[plugin_name].set_val(pk, pv),
        );
      }
    });

    meta_args.forEach((meta_arg) => {
      const parsed_arg = parsed_args.find(
        (parsed_arg) => parsed_arg.name === meta_arg.name && parsed_arg.meta,
      );
      if (parsed_arg) {
        plugins[meta_arg.plugin].configure({
          [meta_arg.key]: meta_arg.transform
            ? meta_arg.transform(parsed_arg.value)
            : parsed_arg.value,
        });
      }
    });
    return plugins;
  }
}
