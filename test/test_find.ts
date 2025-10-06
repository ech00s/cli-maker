import { coordinator, procedure } from "../lib/coordinator";
import { cli_builder, cmd_builder } from "../lib/builders";
import { mem } from "../lib/memory";
import { cmd_def, context } from "../lib/models/components";
import { equal } from "assert";
import { test } from "./tools";

export const test_find_cmddef = new test(() => {
  const ctx = new coordinator();
  let v: boolean = false;
  const input = ["s0", "s1", "s2", "s3", "s4", "s5"];
  let clis = input.map((s) =>
    new cli_builder(s).add_subcmd(
      cmd_builder
        .make_builder({})(s)
        .add_func(() => {
          if (s === "s0") {
            v = true;
          }
        })
        .build(),
    ),
  );
  const cli_def = clis.reduce((a, b) => b.add_subcli(a.build())).build();
  const proc: procedure = {
    init_components: {
      raw_argv: { content: [...input.reverse().slice(1), "s0"] },
      cli_def: cli_def,
    },
    operation: [{ do: "run", system: "finder" }],
  };
  ctx.run(proc);
  const context = mem.create_mem_manager().get("context") as context;
  equal("default", context.value);
});
