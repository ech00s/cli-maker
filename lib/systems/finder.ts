import {
  cli_def,
  raw_argv,
  cmd_def,
  meta_cmds,
  context,
} from "../models/components";
import { sys_config } from "../models/config";
import { system } from "../system";
import { cursor } from "../utils/cursor";

export class finder_sys extends system {
  constructor() {
    super({
      gets: ["raw_argv,cli_def,meta_cmds"],
      sets: ["context"],
      ops: ["default"],
    });
  }

  protected default(
    raw_argv: raw_argv,
    cli_def: cli_def,
    meta_cmds: meta_cmds,
  ): context {
    let c = new cursor(raw_argv.content);
    let depth: cmd_def | cli_def = cli_def;
    let meta_cmd = meta_cmds.find((meta_cmd) =>
      meta_cmd.names.some((name) => name === c.peek()),
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
      let meta_cmd = meta_cmds.find((meta_cmd) =>
        meta_cmd.names.some((name) => name === c.peek()),
      );
      if (meta_cmd) {
        return { value: "meta", depth: depth.name };
      }
    }
    return { value: "default", depth: depth.name };
  }

  private is_cmd_def(def: cmd_def | cli_def): def is cmd_def {
    return "execute" in def && "named" in def && "pos" in def && "id" in def;
  }
}
