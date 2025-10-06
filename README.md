# CLI-MAKER

## Overview
cli-maker is designed mainly to create cli backdoors into server side node.js applications for maintenance, probing or testing.

For this task, it needs to seemlessly integrate any given typescript/javascript code portion, in production or under development, into it's command action definitions.

For that it needs to fulfill multiple critera:
- Minimal boilerplate: Command definition with minimal syntax.
- Automatic validation: Automatic argument parsing and data validation according to type/schema.
- Systematic command behavior modification with a flexible built-in mechanism ( Plugins ) .

To achieve this, cli-maker offers multiple features that allow the fast creation of scalable cli's:
- A builder that automatically offers the correctly typed function signature according to argument definition.
- A validation and conversion pipeline for multiple data types, including structured data, that mirrors the type safety at development.
- An extensible tool for dynamic modification of command behavior ( Plugins ).

## Basic Usage

At its very basic usage, cli-maker can be used as follows:
```TS
const cmdb = cmd_builder.make_builder();

const basic = cmdb("basic")
  .add_pos("str", { variadic: true })
  .add_func((_, __, ...strs) => {
    //Do something with string[] strs
  })
  .build();
```
The first line:
```TS
const cmdb = cmd_builder.make_builder();
```
Instructs the command builder on which plugins we are intending to use in the command.
By default the only injected plugin is the logger. This is to make the usual log level meta arguments( --verbose, --silent , --debug...etc ) available.

The actual command definition:
```TS
const basic = cmdb("basic")
  .add_pos("str", { variadic: true })
  .add_func((_, __, ...strs) => {
    //Do something with string[] strs
  })
  .build();
```
Produces a pass-through command ( string acts as any in this context ) with no named arguments, and all string positional arguments.

Using other data types will guarantee their validation at runtime:
```TS
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
```
The previous command will validate all the argument input against the boolean type. 

The function signature in general, has the parameters `(plugins,named,...positional)`, where plugins is defined by what was passed to `make_builder`.

Named arguments are validated the same:
```TS
const rand_int = cmdb("int")
  .add_named("min", "int", {
    optional: false,
    shorthand: "-mn",
    description: "Minimum generated integer",
  })
  .add_named("max", "int", {
    optional: false,
    shorthand: "-mx",
    description: "Maximum generated integer",
  })
  .add_named("max", "int", { optional: true })
  .add_func(({ logger }, args) => {
    logger.info(
      Math.trunc(Math.random() * (args.max - args.min) + args.min).toString(),
    );
  })
  .build();
```

Each named argument of name `name` will posess the `--name` shorthand, and can be set using one extra shorthand, -mn and -mx in the previous case.

Commands can then be combined into a cli, and a cli can contain another cli as a subcommand tree:
```TS
const rand = new cli_builder("rand", "Generate some random values")
  .add_subcmd(rand_int)
  .add_subcmd(rand_float)
  .add_subcmd(rand_str)
  .build();

const util = new cli_builder("util", "CLI used to test cli-maker", "1.0.0")
  .add_subcmd(concat_str)
  .add_subcmd(reduce)
  .add_subcmd(binnum)
  .add_subcli(rand)
  .build();
```
In the upper example, executing `util rand int -mx 10 -mn 0` will produce a random integer between 0 and 10.

The supported data types can be found in the type models.
Every type defines how a specific argument string input is validated and converted:
```TS
// JS type : string input example
interface types {
  //boolean : "false" , "1"
  bool: boolean;
  //string : "{sss''", "hello"
  str: string;
  //number : "42","9999","-0"
  int: integer;
  //number : "4.2", "-0.321"
  float: float;
  //string : "/etc/resolv.conf", "some_local_dir"
  path: path;
  //Record<string, types[keyof types]> : '{"key":42,"other_key":{"nested_key":false}}'
  obj: obj;
  //string : "some enum choice" , "some other"
  enum: _enum;
  //Date : "2024", "December 17, 1995 03:24:00", "1995-12-17T03:24:00"
  date: Date;
  //types[keyof types] :  "hello","1995-12-17T03:24:00" 
  //any will be converted to the first type it successfully converts to
  //including Date
  any: any;
  //all list types are comma seperated elements of the underlying type
  bool_lst: boolean[];
  str_lst: string[];
  int_lst: integer[];
  float_lst: float[];
  path_lst: path[];
  obj_lst: obj[];
  enum_lst: _enum[];
}
```

## More Examples

Concatenate an arbitrary number of strings.
Deconstructing arguments in the function signature is the best way to make things clearer.
Using the provided logger allows benefiting from the previously mentioned logging meta arguments
```TS
const concat_str = cmdb("concat", "Concatenate some strings from a list")
  .add_pos("str", { variadic: true })
  .add_func(({ logger }, {}, ...strs) => {
    logger.info(strs.reduce((a: string, b: string) => a + b));
  })
  .build();
```

Generate a random string of arbitrary length.

```TS
const rand_str = cmdb("str", "Generate a random string")
  .add_named("length", "int", {
    optional: false,
    shorthand: "-l",
    description: "Length of string to generate",
  })
  .add_func(({ logger }, args) => {
    let result = "";
    for (let i = 0; i < args.length; i++) {
      result += String.fromCharCode(Math.trunc(Math.random() * 57 + 65));
    }
    logger.info(result);
  })
  .build();
```
A richer command with more argument types.
```TS
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
  //example default value usage
  .add_named("prebuilt", "enum", {
    default:"add",
    choices: ["mult", "add", "pow", "sub"],
    description: "Prebuilt accumulators",
  })
  .add_named("post", "enum", { optional: false, choices: ["store", "log"] })
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

```
The --help subcommand is provided by default at each level in the command tree.
The --version subcommand is only provided at the top level

## More About Arguments
cli-maker imposes a few restrictions on some argument types:
- A boolean named argument takes no value and will automatically take the value false
if not found in the arguments of the executed command.
- The variadic option ( on positional or named arguments ) modifies the expected type in the function signature to be the array of the underlying type, but values still have to be
given as the underlying type. All corresponding argument values from the command execution are then
collected into the corresponding array
- There are no optional positional arguments, and adding a variadic positional argument will
lock the positional argument definition, and no more positionals can be defined

### Named Arguments
A named argument's behavior is determined partly by two mutually exclusive options,optional and default:
- Optional & No default: Argument can always be undefined in the function
- Non Optional & has default: Argument is always defined in the function
- Non Optional & no default: Parser will throw if argument is not provided

### Structured Argument Types
It is possible to set the "obj" type for an argument directly, a schema is required:
```TS
.add_named("n-obj", "obj", {
    optional: true,
    schema: {
      strk: "str",
      pathk: "path",
      boolk: "bool",
      floatk: "float",
      intk: "int",
      str_lstk: "str_lst",
      path_lstk: "path_lst",
      bool_lstk: "bool_lst",
      float_lstk: "float_lst",
      int_lstk: "int_lst",
      enumk: "$ref/enum/enum",
      enum_lstk: "$ref/enum_lst/enum_lst",
      objk: "$ref/obj/obj",
      obj_lstk: "$ref/obj_lst/obj_lst",
    },
  })

```

Fields with `$ref` reference a schema already held by the builder, for nested object fields.
If an object needs a schema for a nested object field, and the schema of the nested object
does not necessarely describe an argument, it can be provided with add_schema:
```TS
.add_schema("obj", {
    str: "str",
    path: "path",
    bool: "bool",
    float: "float",
    int: "int",
    str_lst: "str_lst",
    path_lst: "path_lst",
    bool_lst: "bool_lst",
    float_lst: "float_lst",
    int_lst: "int_lst",
  })
```
And later referenced with $ref. This also applies to enums, e.g adding an enum argument directly:
```TS
.add_pos("enum_lst", { choices: ["e1", "e2", "e3"], variadic: true })
```
Or add an enum definition due to nesting:
```TS
.add_enum("enum", ["e1", "e2", "e3"])
```
Reference in object schemas take the form `$ref/<field type>/<schema name>`, because
schemas can apply to either the field type or the underlying type of an array field.

## Building The Binary
To build the binary for your cli, cli-maker also provides a platform agnostic build
script that leverages esbuild and pkg.
You need to:
1) Default export your cli definition from a *.cli-def.ts file.
2) run cli-maker as an npm script

The script will automatically detect .cli-def.ts files where it is, the user can optionally provide
an [--input|-i] directory and [--output|-o] directory.
cli-maker will then build all the binaries for all .cli-def.ts files in the input directory and
put them in the output directory.
cli-maker will automatically search in the command's cwd if no input is given, and automatically
write to input directory if no output is given.
