import { base_arg, cmd_def, comp_name, component } from "./models/components";
import { mem, mem_manager } from "./memory";
import { configurable, sys_config } from "./models/config";
import { get_anonymous, ilogger } from "./plugins/logger";

export abstract class system extends configurable<sys_config> {
  protected logger: ilogger;

  constructor(defaults: sys_config) {
    super(defaults);
    this.logger = get_anonymous(this.constructor.name);
  }

  public run(_op?: string) {
    const op = _op ? _op : "default";
    const idx = this.config.ops.findIndex((e) => e === op);
    if (idx === -1) {
      this.logger.throw(`Unrecognized op mode: ${op}`);
    }
    const gets = this.get_val("gets")[idx].split(",");
    //void => set:[""]
    //component => set:["<comp name>"]
    //component[] => set:["<comp name 1>,<comp name 2>,..."]
    const sets = this.get_val("sets")[idx];
    this.post = undefined;
    const mem_man: mem_manager = mem.create_mem_manager();
    this.pre = () => {
      let args: component[] = [];
      gets.forEach((c) => {
        args.push(mem_man.get(c as comp_name));
      });
      return args;
    };
    if (sets.length !== 0) {
      this.post = (res: component | component[]) => {
        const comp_names = sets.split(",");
        if (comp_names.length === 1) {
          mem_man.add(comp_names[0] as comp_name, res as any);
        } else {
          (res as component[]).forEach((c, i) => {
            mem_man.add(comp_names[i] as comp_name, c);
          });
        }
      };
    }
    this._run(op);
  }

  protected find(cmd_def: cmd_def, name: string): base_arg {
    if (cmd_def.named[name]) {
      return cmd_def.named[name];
    }
    return cmd_def.pos.find((pos_arg) => pos_arg.name === name)!;
  }

  private _run(op: string) {
    const args = this.pre();
    if (this.post) {
      const result = (this as any)[op](...args);
      this.post(result as any);
    } else {
      this.default(...args);
    }
  }

  private pre!: () => component[];

  private post: ((res: component) => void) | undefined;
  protected abstract default(
    ...comp_name: component[]
  ): component[] | component | void;
}
