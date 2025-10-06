import {
  args,
  base_arg,
  cmd_def,
  parsed_args,
  plugins,
  pos_arg,
} from "../models/components";
import { system } from "../system";
import { obj } from "../models/types";

//structurer system
export class assigner_sys extends system {
  constructor() {
    super({
      gets: ["parsed_args,cmd_def,plugins"],
      sets: ["args"],
      ops: ["default"],
    });
  }
  protected default(
    parsed_args: parsed_args,
    cmd_def: cmd_def,
    plugins: plugins,
  ): args {
    let named: obj = {};
    let pos: parsed_args = [];
    parsed_args.forEach((parsed_arg) => {
      if (!parsed_arg.meta) {
        const base_arg: base_arg = this.find(cmd_def, parsed_arg.name);
        if (this.is_pos(base_arg)) {
          pos.push(parsed_arg);
          return;
        }
        if (cmd_def.named[parsed_arg.name].variadic) {
          if (!named[parsed_arg.name]) {
            named[parsed_arg.name] = [];
          }
          (named[parsed_arg.name] as any).push(parsed_arg.value);
        } else {
          named[parsed_arg.name] = parsed_arg.value;
        }
      }
    });

    return {
      named: named,
      pos: pos.map((a) => a.value),
      plugins: plugins,
    };
  }

  private is_pos(base_arg: base_arg): base_arg is pos_arg {
    return "idx" in base_arg;
  }
}
