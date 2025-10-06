import {
  str_args,
  cmd_def,
  raw_argv,
  meta_args,
  shorthand,
  pos_arg,
} from "../models/components";
import { type } from "../models/types";
import { system } from "../system";
import { cursor } from "../utils/cursor";

export class parser_sys extends system {
  constructor() {
    super({
      gets: ["raw_argv,cmd_def,meta_args", "raw_argv"],
      sets: ["str_args", "raw_argv"],
      ops: ["default", "normalize"],
    });
  }

  protected default(
    { content: argv }: raw_argv,
    cmd_def: cmd_def,
    meta_args: meta_args,
  ): str_args {
    let result: str_args = [];
    argv = argv.slice(argv.indexOf(cmd_def.name) + 1, argv.length);
    let argvc = new cursor(argv);
    let visited: Set<string> = new Set<string>();
    const handle_named = this.create_handle_named(visited, result, argvc);
    let posc = new cursor(cmd_def.pos);
    let posc_next: pos_arg | undefined;
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
            (namedarg.default as any).forEach((v: any) => {
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

  private create_handle_named(
    visited: Set<string>,
    result: str_args,
    argvc: cursor<string>,
  ) {
    return (
      argvc_next: string,
      args: {
        shorthands: shorthand[];
        name: string;
        type: type;
        variadic?: boolean;
      }[],
      meta: boolean,
    ) => {
      const arg = args.find((arg) =>
        arg.shorthands.some((sh) => sh === argvc_next),
      );
      if (arg) {
        if (visited.has(arg.name) && !arg.variadic) {
          //this line for variadic
          this.logger.throw(
            `Duplicate non variadic named argument: ${arg.name}`,
          );
        }
        visited.add(arg.name);
        if (arg.type === "bool") {
          result.push({ name: arg.name, strval: "true", meta: meta });
        } else {
          result.push({
            name: arg.name,
            strval: argvc.next(),
            meta: meta,
          });
        }
        return true;
      }
      return false;
    };
  }

  private normalize(raw_argv: raw_argv): raw_argv {
    let idx = 0;
    let argv = raw_argv.content;
    while (idx < argv.length) {
      let arg = argv[idx];
      if (/^--?[^\s=]+(\s|=).+$/.test(arg)) {
        const extract = arg.match(/^--?[^\s=]+(\s|=)/);
        if (extract) {
          //extract shorthand
          const sh = extract[0];

          //extract value
          const val = arg.replace(sh, "");

          //put sh in current pos
          argv[idx] = sh.replace(/(\s|=)/g, "");

          //put val right after
          argv.splice(idx + 1, 0, val);

          //advance by two due to split
          idx += 2;
        }
      } else {
        idx++;
      }
    }
    return { content: argv };
  }
}
