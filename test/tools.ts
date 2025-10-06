import { cmd_builder } from "../lib/builders";
import { logger } from "../lib/plugins/logger";
import { cache } from "../lib/plugins/cache";
import { obj } from "../lib/models/types";
import { mem } from "../lib/memory";
import { parsed_args, str_args } from "../lib/models/components";
import { sep } from "path";

export const base_valid = {
  str: [
    "string_val_1",
    "undefined",
    "      some spaces",
    "-41**4-//;{",
    "null",
  ],
  bool: [false, true, false, true, false],
  int: [-441, 42, 999999999, 0, 0],
  float: [0.0000000001, 4.2, -2.04, 0.0, 0],
  path: [
    [".", "data", "test0.log"].join(sep),
    [".", "data", "test1.log"].join(sep),
    [".", "data", "test2.log"].join(sep),
    "31",
    "  some weird stuff that should pass",
  ],
  enum: ["e1", "e2", "e3", "e1", "e2"],
};

export const base_invalid = {
  str: [""],
  bool: [42, null, undefined, "some text", ""],
  int: [1.0, -42.0, 0.0, -0.0, "some text", false],
  float: [null, undefined, "some text", true],
  path: ["//data.log", "../t.//test.log"],
  enum: ["f1", "41", "e12"],
};

const cmdb = cmd_builder.make_builder({ logger: logger, cache: cache });
const simple_arg_nofunc = cmdb("simple", "Some simple types")
  .add_pos("str")
  .add_pos("bool")
  .add_pos("int")
  .add_pos("float")
  .add_pos("path")
  .add_pos("enum", { choices: ["e1", "e2", "e3"] })
  .add_pos("str_lst")
  .add_pos("bool_lst")
  .add_pos("int_lst")
  .add_pos("float_lst")
  .add_pos("path_lst")
  .add_pos("enum_lst", { choices: ["e1", "e2", "e3"] })
  .add_named("str", "str", { optional: true })
  .add_named("bool", "bool", { optional: false })
  .add_named("int", "int", { optional: true })
  .add_named("float", "float", { optional: true })
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
  });
export const simple_arg_cmd = simple_arg_nofunc.add_func((_) => {}).build();
const obj_arg_nofunc = cmdb("obj", "obj type")
  .add_enum("enum", ["e1", "e2", "e3"])
  .add_enum("enum_lst", ["e1", "e2", "e3"])
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
    obj: "$ref/obj/obj",
    obj_lst: "$ref/obj_lst/obj",
  })
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
  });
export const obj_arg_cmd = obj_arg_nofunc.add_func((_) => {}).build();

export const def = {
  simple_arg_nofunc: simple_arg_nofunc,
  simple_arg_cmd: simple_arg_cmd,
  obj_arg_cmd: obj_arg_cmd,
  obj_arg_nofunc: obj_arg_nofunc,
};

export function fy_shuffle(arr: any[]) {
  for (let i = arr.length - 1; i > 0; i--) {
    let j = Math.trunc(Math.random() * i);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function generate_obj(omit: string[] = [], pos: boolean = false): obj[] {
  let result: obj[] = [];
  for (let i: number = 0; i < 5; i++) {
    let obj: obj = {};
    Object.entries(base_valid).forEach(([name, values], j) => {
      if (omit.some((k) => name === k)) return;
      obj[name] = values[i];
      obj[`${name}_lst`] = values;

      if (pos) {
        obj[`pos n°${j}`] = values[i];
        obj[`pos n°${j + 6}`] = values.toString();
      }
    });
    result.push(obj);
  }
  return result;
}

export function merge(obj1: any, obj2: any) {
  return Object.assign(obj2, obj1);
}

export function simple_str_args(
  omit: string[] = [],
  pos: boolean = false,
): str_args[] {
  return generate_obj(omit, pos).map((o) =>
    Object.entries(o).map(([k, v]) => {
      return {
        strval: v.toString(),
        name: k,
        meta: false,
      };
    }),
  );
}

export function simple_parsed_args(
  omit: string[] = [],
  pos: boolean = false,
): parsed_args[] {
  return generate_obj(omit, pos).map((o) =>
    Object.entries(o).map(([k, v]) => {
      return {
        value: v,
        name: k,
        meta: false,
      };
    }),
  );
}

export function obj_str_args(): str_args[] {
  const base_objs = generate_obj([]);
  const nested_objs = generate_obj(["enum", "enum_lst"]);
  let nobj_lst: obj[] = nested_objs.map((nobj) => {
    return {
      ...structuredClone(nobj),
      obj: structuredClone(nobj),
      obj_lst: structuredClone(nested_objs),
    };
  });
  let arg_objs = base_objs.map((base_obj, idx) => {
    return {
      ...structuredClone(base_obj),
      obj: structuredClone(nobj_lst[idx]),
      obj_lst: structuredClone(nobj_lst),
    };
  });

  return arg_objs.map((arg_obj) => {
    return [
      {
        name: "n-obj",
        strval: JSON.stringify(arg_obj),
        meta: false,
      },
      {
        name: "n-objlst",
        strval: JSON.stringify(arg_objs),
        meta: false,
      },
      {
        name: "pos n°0",
        strval: JSON.stringify(arg_obj),
        meta: false,
      },
      {
        name: "pos n°1",
        strval: JSON.stringify(arg_objs),
        meta: false,
      },
    ];
  });
}

export function obj_parsed_args(): parsed_args[] {
  const base_objs = generate_obj([]);
  const nested_objs = generate_obj(["enum", "enum_lst"]);
  let nobj_lst: obj[] = nested_objs.map((nobj) => {
    return {
      ...nobj,
      obj: structuredClone(nobj),
      obj_lst: structuredClone(nested_objs),
    };
  });
  let arg_objs = base_objs.map((base_obj, idx) => {
    return {
      ...base_obj,
      obj: nobj_lst[idx],
      obj_lst: nobj_lst,
    };
  });

  return arg_objs.map((arg_obj) => {
    return [
      {
        name: "n-obj",
        value: arg_obj,
        meta: false,
      },
      {
        name: "n-objlst",
        value: arg_objs,
        meta: false,
      },
      {
        name: "pos n°0",
        value: arg_obj,
        meta: false,
      },
      {
        name: "pos n°1",
        value: arg_objs,
        meta: false,
      },
    ];
  });
}

export class test {
  private readonly _run: Function;
  constructor(run: Function) {
    this._run = run;
  }

  teardown() {
    mem.create_mem_manager().clear();
  }

  run() {
    this._run();
    this.teardown();
  }
}
