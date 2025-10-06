import { coordinator, procedure } from "../lib/coordinator";
import { cmd_def, raw_argv } from "../lib/models/components";
import { def, fy_shuffle, generate_obj, test } from "./tools";
import { doesNotThrow, equal, notStrictEqual } from "assert";
import { mem } from "../lib/memory";
//FOR TESTING PARSING, NOT NORMALIZATION
//ASSUME NORMALIZED ARGUMENTS (shorthand = value are seperated in argv)
//sprinkle positional arguments among named ones
// raw_argv,cmd_def => str_args
//generate own str_args then compare

//MOCK THROW FIRST
const ctx = new coordinator();
const cmd_def = def.simple_arg_cmd;

export const test_parse = new test(() => {
  const valid_args_objs = generate_obj([], true);
  valid_args_objs.forEach((obj) => {
    let raw_argv: raw_argv = { content: [] };
    const pos = Object.entries(obj)
      .filter(([k, _]) => k.startsWith("pos n°"))
      .sort(([k1, _], [k2, __]) => {
        return +k1.replace("pos n°", "") - +k2.replace("pos n°", "");
      })
      .map(([_, v]) => v);

    //The Kansas city shuffle
    fy_shuffle(["str", "bool", "int", "float", "path", "enum"]).forEach(
      (argname, j) => {
        if (argname === "bool") {
          if (obj[argname]) {
            raw_argv.content.push(`--${argname}`);
          }
        } else {
          raw_argv.content.push(`--${argname}`);
          raw_argv.content.push(obj[argname].toString());
        }
        raw_argv.content.push(
          pos[j].toString(), //add pos j
          `--${argname}_lst`,
          obj[`${argname}_lst`].toString(), //add named argname_lst
        );
      },
    );

    raw_argv.content.push(...pos.slice(6, pos.length).map((v) => v.toString()));
    let proc: procedure = {
      init_components: {
        cmd_def: cmd_def,
        raw_argv: raw_argv,
      },
      operation: [{ do: "run", system: "parser" }],
    };

    //run test
    doesNotThrow(() => ctx.run(proc));
    const man = mem.create_mem_manager();
    const str_args = man.get("str_args");

    str_args.forEach((str_arg) => {
      const expected = obj[str_arg.name];
      //No rogue disappearing args
      notStrictEqual(expected, undefined);
      equal(str_arg.strval, expected.toString());
    });
  });
});
