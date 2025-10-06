import { args, cmd_def } from "../models/components";
import { sys_config } from "../models/config";
import { system } from "../system";

//executor system
export class executor_sys extends system {
  constructor() {
    super({
      gets: ["args,cmd_def"],
      sets: [""],
      ops: ["default"],
    });
  }

  protected default(args: args, cmd_def: cmd_def) {
    cmd_def.execute(args.plugins, args.named, ...args.pos);
  }
}
