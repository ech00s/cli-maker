import { cmd_builder } from "../lib/builders";
import { logger } from "../lib/plugins/logger";
import { cache } from "../lib/plugins/cache";

//This example is to show the argument type support
//The type hinting at development is mirrored by a validation/conversion
//Pipeline at runtime
const cmdb = cmd_builder.make_builder({ logger: logger, cache: cache });

//This one is for primitives
const simple_args = cmdb("simple", "Some simple types")
  //Positionals also have to correspond to the same order
  //That expected to be given when running the command
  //String
  .add_pos("str")
  //Boolean
  .add_pos("bool")
  //Integer (regex + parse validated)
  .add_pos("int")
  //Float
  .add_pos("float")
  //Path (regex validated)
  .add_pos("path")
  //Enums require an additional choices config
  .add_pos("enum", { choices: ["e1", "e2", "e3"] })
  //All the corresponding list types
  //Lists are always comma seperated values of the underlying type
  //e.g bool_lst => false,true,true,false or 0,1,1,0
  .add_pos("str_lst")
  .add_pos("bool_lst")
  .add_pos("int_lst")
  .add_pos("float_lst")
  .add_pos("path_lst")
  //variadic positional locks positional arguments
  .add_pos("enum_lst", { choices: ["e1", "e2", "e3"], variadic: true })
  //.add_pos() will not work here
  //The default shorthand for named will be --name
  .add_named("str", "str", { optional: true, shorthand: "-s" })
  //Optional is forced to false on named boolean arguments
  //Because their value is always added as false, if they are
  //Not present in the command call
  .add_named("bool", "bool", { optional: false })
  .add_named("int", "int", { optional: true })
  //variadic
  .add_named("floats", "float", { optional: true, variadic: true })
  .add_named("path", "path", { optional: true })
  .add_named("enum", "enum", {
    optional: true,
    choices: ["e1", "e2", "e3"],
  })
  .add_named("str_lst", "str_lst", { optional: true })
  .add_named("bool_lst", "bool_lst", { optional: true })
  .add_named("int_lst", "int_lst", { optional: true })
  .add_named("float_lst", "float_lst", { optional: true })
  .add_named("path_lst", "path_lst", { optional: true })
  .add_named("enum_lst", "enum_lst", {
    optional: true,
    choices: ["e1", "e2", "e3"],
  })
  .add_func(
    (
      { logger, cache },
      { str, bool, int, floats /*variadic=>list*/, path, ...rest },
      ...[pstr, pbool, pint, pfloat, ppath, ...prest]
    ) => {
      //All the arguments will be typed as built
    },
  )
  .build();

//Object argument support
const obj_args = cmdb("obj", "obj type")
  //If an object has a nested object or enum field
  //That has to be provided with the add_enum/schema methods first
  //Add an enum
  .add_enum("enum", ["e1", "e2", "e3"])
  .add_enum("enum_lst", ["e1", "e2", "e3"])
  //Add an object schema
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
  .add_schema("obj_lst", {
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
    //Reference the added enums/schemas with $ref/<field_type>/<ref_name>
    //Where field type refers to the expected type of this very field
    obj: "$ref/obj/obj",
    obj_lst: "$ref/obj_lst/obj",
  })
  //Positional object argument
  .add_pos("obj", {
    schema: {
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
      enum: "$ref/enum/enum",
      enum_lst: "$ref/enum_lst/enum_lst",
      obj: "$ref/obj/obj",
      obj_lst: "$ref/obj_lst/obj_lst",
    },
  })
  //Positional object list argument
  .add_pos("obj_lst", {
    schema: {
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
      enum: "$ref/enum/enum",
      enum_lst: "$ref/enum_lst/enum_lst",
      obj: "$ref/obj/obj",
      obj_lst: "$ref/obj_lst/obj_lst",
    },
  })
  //Object schemas are registered by argument name
  //They will overwrite one another
  .add_named("n-obj", "obj", {
    optional: true,
    schema: {
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
      enum: "$ref/enum/enum",
      enum_lst: "$ref/enum_lst/enum_lst",
      obj: "$ref/obj/obj",
      obj_lst: "$ref/obj_lst/obj_lst",
    },
  })
  .add_named("n-objlst", "obj_lst", {
    optional: true,
    schema: {
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
      enum: "$ref/enum/enum",
      enum_lst: "$ref/enum_lst/enum_lst",
      obj: "$ref/obj/obj",
      obj_lst: "$ref/obj_lst/obj_lst",
    },
  })
  .add_func((plugins, args, ...pos) => {
    //Nested fields will also be typed according to the argument
    //Type definitions, regardless of nesting
    // ! because n-objlst is optional
    const obj_str_lst: string[] = args["n-objlst"]![0].str_lst;
  })
  .build();
