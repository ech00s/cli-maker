import { coordinator, procedure } from "../lib/coordinator";
import { cmd_def, parsed_args } from "../lib/models/components";
import {
  def,
  obj_parsed_args,
  obj_str_args,
  simple_parsed_args,
  simple_str_args,
  test,
} from "./tools";
import { deepStrictEqual, doesNotThrow } from "assert";
import { mem } from "../lib/memory";

//MOCK THROW FIRST

const ctx = new coordinator();
const cmd_def = def.simple_arg_cmd;
//Test convert simple first
export const test_convert_simple = new test(() => {
  let parsed_args = simple_parsed_args();
  simple_str_args().forEach((str_args, idx) => {
    //mimic named
    let proc: procedure = {
      init_components: {
        str_args: str_args,
        cmd_def: cmd_def,
      },
      operation: [{ do: "run", system: "converter" }],
    };

    //run test
    doesNotThrow(() => ctx.run(proc));
    const man = mem.create_mem_manager();
    const converted = man.get("parsed_args");
    converted.forEach((c) =>
      deepStrictEqual(
        c,
        parsed_args[idx].find((p) => p.name === c.name),
      ),
    );
  });
});

//Test convert nested
export const test_convert_obj = new test(() => {
  let parsed_args = obj_parsed_args();
  obj_str_args().forEach((str_args, idx) => {
    let proc: procedure = {
      init_components: {
        str_args: str_args,
        cmd_def: def.obj_arg_cmd,
      },
      operation: [{ do: "run", system: "converter" }],
    };
    //run test
    doesNotThrow(() => ctx.run(proc));
    const man = mem.create_mem_manager();
    const converted = man.get("parsed_args");
    converted.forEach((c) =>
      deepStrictEqual(
        c,
        parsed_args[idx].find((p) => p.name === c.name),
      ),
    );
  });
});
