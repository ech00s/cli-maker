import { coordinator, procedure } from "../lib/coordinator";
import { cmd_def } from "../lib/models/components";
import { def, obj_str_args, simple_str_args, test } from "./tools";
import { doesNotThrow } from "assert";

//MOCK THROW FIRST

const ctx = new coordinator();
const cmd_def = def.simple_arg_cmd;

//Test validate nested
export const test_validate_obj = new test(() => {
  obj_str_args().forEach((str_args) => {
    let proc: procedure = {
      init_components: {
        str_args: str_args,
        cmd_def: def.obj_arg_cmd,
      },
      operation: [{ do: "run", system: "validator" }],
    };
    //run test
    doesNotThrow(() => ctx.run(proc));
  });
});

//Test validate simple first
export const test_validate_simple = new test(() => {
  simple_str_args([], true).forEach((str_args) => {
    let proc: procedure = {
      init_components: {
        str_args: str_args,
        cmd_def: cmd_def,
      },
      operation: [{ do: "run", system: "validator" }],
    };

    //run test
    doesNotThrow(() => ctx.run(proc));
  });
});
