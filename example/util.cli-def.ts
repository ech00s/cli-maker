import { cli_builder, cmd_builder } from "../lib/builders";
import { logger } from "../lib/plugins/logger";
import { cache } from "../lib/plugins/cache";

//This Example is meant to go through the most important supported features

//By using make_builder, we are instructing the cli-maker explicitely on which plugins
//Are going to be required at runtime
const cmdb = cmd_builder.make_builder({ logger: logger, cache: cache });
//You can of course use no plugins, but the logger plugin is always injected by default
//To benefit from logging meta arguments (--verbose, --silent, --debug...etc)
const logger_only = cmd_builder.make_builder();

//Basic usage can be as simple as:
const basic = cmdb("basic")
  //Positionals are not allowed to be optional
  //Variadic positional will lock the positional arguments
  .add_pos("str", { variadic: true })
  .add_func((_, __, ...strs) => {
    //Do something with string[] strs
  })
  .build();

//Simple command to concatenate an arbitrary number of strings
const concat_str = cmdb("concat", "Concatenate some strings from a list")
  .add_pos("str", { variadic: true })
  //Deconstructing is the best way to use the builder
  //The function arguments always take the form: (plugins:object,named:object,...pos:array)
  .add_func(({ logger }, {}, ...strs) => {
    logger.info(strs.reduce((a: string, b: string) => a + b));
  })
  .build();

//Convert a boolean array to a natural number
const binnum = cmdb("binnum", "Convert a boolean list to an integer")
  .add_pos("bool", { variadic: true })
  .add_func(({ logger }, {}, ...bits) => {
    //Boolean arguments are accepted as true/false or 1/0
    logger.info(
      bits
        .reverse()
        .reduce<number>((a, b, i) => a + (b ? Math.pow(2, i) : 0), 0)
        .toString(),
    );
  })
  .build();

//Command to generate a random int in an interval
const rand_int = cmdb("int")
  .add_named("min", "int", {
    optional: true,
    shorthand: "-mn",
    description: "Minimum generated integer",
  })
  .add_named("max", "int", {
    default: 10,
    shorthand: "-mx",
    description: "Maximum generated integer",
  })
  .add_named("max", "int", { optional: true })
  .add_func(({ logger }, args) => {
    if (!args.min) args.min = 0;
    if (args.max < args.min) {
      args.max = args.max - args.min;
      args.min = args.max + args.min;
      args.max = args.min - args.max;
    }
    logger.info(
      Math.trunc(Math.random() * (args.max - args.min) + args.min).toString(),
    );
  })
  .build();

//Generate a random float ( with an optional named maximum flag )
const rand_float = cmdb("float", "Generate a random float")
  .add_named("max", "float", {
    optional: true,
    description: "Maximum generated float",
  })
  .add_func(({ logger }, args) => {
    if (args.max) {
      logger.info((Math.random() * args.max).toString());
    } else {
      logger.info(Math.random().toString());
    }
  })
  .build();

//Generate a random string of a specific length
const rand_str = cmdb("str", "Generate a random string")
  .add_named("length", "int", {
    optional: false,
    shorthand: "-l",
    description: "Length of string to generate",
  })
  .add_named("post", "enum", { choices: ["store", "log"], default: "log" })
  .add_func(({ logger, cache }, args) => {
    let result = "";
    for (let i = 0; i < args.length; i++) {
      result += String.fromCharCode(Math.trunc(Math.random() * 57 + 65));
    }
    if (args.post === "log") {
      logger.info(result);
    } else {
      logger.info("Storing");
      cache.set("result", result);
    }
  })
  .build();

//Group everything into a single rand cli
// e.g rand int --min 0 --max 99
// rand str -l=42
//rand float
const rand = new cli_builder("rand", "Generate some random values")
  .add_subcmd(rand_int)
  .add_subcmd(rand_float)
  .add_subcmd(rand_str)
  .build();

//A richer command
const reduce = cmdb("reduce", "Reduce a float list using a one line function")
  .add_pos("float", {
    variadic: true,
    description: "List of numbers to accumulate",
  })
  .add_named("init", "float", {
    optional: true,
    description: "Initial value",
  })
  .add_named("print-steps", "bool", {
    optional: false,
    description: "Print reduce steps",
  })
  .add_named("prebuilt", "enum", {
    default: "add",
    choices: ["mult", "add", "pow", "sub"],
    description: "Prebuilt accumulators",
  })
  .add_named("post", "enum", { default: "log", choices: ["store", "log"] })
  .add_func(
    (
      { cache, logger },
      { init, prebuilt, post, "print-steps": print_steps },
      ...floats
    ) => {
      let op: (a: number, b: number) => number = {
        mult: (a: number, b: number) => a * b,
        add: (a: number, b: number) => a + b,
        pow: (a: number, b: number) => Math.pow(b, a),
        sub: (a: number, b: number) => a - b,
      }[prebuilt];

      let result = floats
        .reduce(
          (a: number, b: number) => {
            if (print_steps) {
              logger.info("Accumulator: " + a.toString());
              logger.info("Current value: " + b.toString());
            }
            return op(a, b);
          },
          init ? init : 0,
        )
        .toString();
      switch (post) {
        case "store":
          //Example cache plugin usage to persist context between command
          cache.set("result", result);
          break;
        case "log":
          logger.info(result);
          break;
      }
    },
  )
  .build();

//One can then mix gather clis and cmds in a single cli tree
//This can be arbitrarely nested, a cli is an object of the type {string:cli|cmd}
const util = new cli_builder("util", "CLI used to test cli-maker", "1.0.0")
  .add_subcmd(concat_str)
  .add_subcmd(reduce)
  .add_subcmd(binnum)
  .add_subcmd(
    cmdb("print-obj")
      .add_schema("n-obj", { k: "str", b: "bool_lst", f: "date" })
      .add_enum("n-enum", ["e1", "e2", "e3"])
      .add_pos("obj", {
        schema: { "n-obj": "$ref/obj/n-obj", "n-enum": "$ref/enum_lst/n-enum" },
        variadic: true,
      })
      .add_func(({ logger }, _, ...objs) => {
        objs.forEach((o) => logger.info(JSON.stringify(o)));
      })
      .build(),
  )
  .add_subcli(rand)
  .build();

//There is no default command mechanism
const single_command = new cli_builder(
  "exec",
  "A cli with a single command",
).add_subcmd(
  cmdb("cmd", "The one command")
    .add_func(({ logger }, _, ...__) => {
      logger.info("Executing");
    })
    .build(),
);

//--help and --version are generated automatically
export default util;
