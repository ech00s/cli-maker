import { coordinator, procedure } from "../lib/coordinator";
import { args } from "../lib/models/components";
import {
  generate_obj,
  simple_arg_cmd,
  simple_parsed_args,
  test,
} from "./tools";
import { deepStrictEqual, doesNotThrow, equal, ok } from "assert";
import { mem } from "../lib/memory";
import { plugins } from "../lib/plugins/plugins";

//MOCK THROW FIRST
const simple_def = simple_arg_cmd;
const ctx = new coordinator();
export const test_assign_args = new test(() => {
  const objs = generate_obj([], true);
  simple_parsed_args([], true).forEach((parsed_args, idx) => {
    //pos args HAVE to be ordered in a realistic setup
    // with pos args type <=> position as far as we are concerned
    let pos = parsed_args
      .filter((a) => a.name.startsWith("pos n°"))
      .sort(
        (a, b) => +a.name.replace("pos n°", "") - +b.name.replace("pos n°", ""),
      );
    let named = parsed_args.filter((a) => !a.name.startsWith("pos n°"));
    let proc: procedure = {
      init_components: {
        parsed_args: [...named, ...pos],
        cmd_def: simple_def,
        plugins: plugins,
        args: {},
      },
      operation: [{ do: "run", system: "assigner" }],
    };
    //run test
    doesNotThrow(() => ctx.run(proc));
    const man = mem.create_mem_manager();
    const args: args = man.get("args") as any;
    deepStrictEqual(
      args.named,
      Object.entries(objs[idx]).reduce((obj, [k, v]) => {
        if (k.startsWith("pos n°")) {
          return obj;
        }
        return { ...obj, [k]: v };
      }, {}),
    );
    args.pos.forEach((p, i) => {
      const expected = parsed_args.find((pa) => pa.name === `pos n°${i}`);
      equal(p, expected!.value);
    });
    deepStrictEqual(args.plugins, plugins);
  });
});
