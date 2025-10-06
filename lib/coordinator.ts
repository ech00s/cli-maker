import { cli_def, cmd_def, comp_name, component } from "./models/components";
import { mem, mem_manager } from "./memory";
import { partial_values, sys_config } from "./models/config";
import { system } from "./system";
import { cli_builder } from "./builders";
import { systems } from "./systems/systems";
import { plugins } from "./plugins/plugins";
const main_operation: procedure["operation"] = [
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

export interface procedure {
  init_components: Record<string, component>;
  operation: (
    | {
        system: string;
        do: "run";
        op?: string;
      }
    | { system: string; do: "config"; config: partial_values<sys_config> }
  )[];
}

export class coordinator {
  static hard_blocker: boolean = false;
  private readonly systems: Record<string, system>;
  constructor() {
    if (coordinator.hard_blocker) {
      throw new Error(`There can only be one`);
    }
    this.systems = this.instantiate();
  }

  private instantiate(): Record<string, system> {
    return Object.entries(systems).reduce((obj, [k, v]) => {
      return { ...obj, [k]: new v() };
    }, {});
  }

  public run(proc: procedure) {
    const mem_man: mem_manager = mem.create_mem_manager();

    Object.entries(proc.init_components).forEach(([k, c]) =>
      mem_man.add(k as comp_name, c),
    );

    proc.operation.forEach((step) => {
      switch (step.do) {
        case "config":
          this.systems[step.system].configure(step.config);
          break;
        case "run":
          this.systems[step.system].run(step.op);
          break;
        default:
          throw new Error(`Unrecognized operation type: ${(step as any).do}`);
      }
    });
  }

  public main(init_components: procedure["init_components"]) {
    this.run({ init_components: init_components, operation: main_operation });
  }
}

export function run_cmd(input: string[], cmd_def: cmd_def) {
  run_cli(input, new cli_builder("wrapper").add_subcmd(cmd_def).build());
}

export function run_cli(input: string[], cli_def: cli_def) {
  const ctx = new coordinator();
  const init_components = {
    raw_argv: { content: input },
    cli_def: cli_def,
    plugins: plugins,
  };
  ctx.main(init_components);
}
