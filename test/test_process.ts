import { coordinator, procedure } from "../lib/coordinator";
import { def, generate_obj, test } from "./tools";
import { deepStrictEqual, doesNotThrow, ok } from "assert";
import { mem } from "../lib/memory";

//MOCK THROW FIRST

const ctx = new coordinator();
//Test execute basic function
export const test_exec_main = new test(() => {
  generate_obj().forEach((obj, idx) => {
    const pos = Object.entries(generate_obj([], true)[idx])
      .filter(([k, _]) => k.startsWith("pos n°"))
      .sort(([k1, _], [k2, __]) => {
        return +k1.replace("pos n°", "") - +k2.replace("pos n°", "");
      })
      .map(([_, v]) => v);

    const cmd_def = def.simple_arg_nofunc
      .add_func((plugins, named, ...fpos) => {
        //plugins have to be undefined
        //args have to resemble the generate obj object without the pos args
        //pos args have to resemble the values of the arg obj filtered with 'pos n°'
        //and sorted
        ok(!plugins);
        deepStrictEqual(named, obj);
        deepStrictEqual(pos, fpos);
      })
      .build();
    let proc: procedure = {
      init_components: {
        cmd_def: cmd_def,
        args: {
          named: obj,
          pos: pos,
          //because apparently {} is not falsy
          plugins: undefined as any,
        },
      },
      operation: [{ do: "run", system: "executor" }],
    };

    //run test
    doesNotThrow(() => ctx.run(proc));
    const man = mem.create_mem_manager();
    man.clear();
  });
});
