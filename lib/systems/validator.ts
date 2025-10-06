import {
  str_args,
  str_arg,
  cmd_def,
  meta_args,
  meta_arg,
  base_arg,
  plugins,
} from "../models/components";
import { system } from "../system";
import { obj, type } from "../models/types";
import { predicate } from "../models/base";
import { choices, schema } from "../models/schema";
import { sep } from "path";
import { sch_manager, schema_registry } from "../utils/schema_registry";

export class validator_sys extends system {
  constructor() {
    super({
      gets: ["cmd_def,str_args,meta_args,plugins"],
      sets: [""],
      ops: ["default"],
    });
  }

  protected default(
    cmd_def: cmd_def,
    str_args: str_args,
    meta_args: meta_args,
    plugins: plugins,
  ) {
    const man = schema_registry.get_manager(cmd_def.id);
    str_args.forEach((str_arg) => {
      if (str_arg.meta) {
        const meta_arg: meta_arg = meta_args.find(
          (ma) => ma.name === str_arg.name,
        )!;
        this.validate(
          str_arg,
          meta_arg.type,
          meta_arg.name,
          schema_registry.get_manager(plugins[meta_arg.plugin].id),
        );
      } else {
        const base_arg: base_arg = this.find(cmd_def, str_arg.name) as any;
        this.validate(str_arg, base_arg.type, base_arg.name, man);
      }
    });
  }

  private validate(
    str_arg: str_arg,
    type: type,
    name: string,
    man: sch_manager,
  ) {
    //first check form
    this.valid_simple(str_arg.strval, type);
    //more specialized validation
    this.valid_specialized(str_arg.strval, type, name, man);
  }

  private valid_specialized(
    strval: string,
    arg_type: string,
    schema_key: string,
    man: sch_manager,
  ) {
    switch (arg_type) {
      case "obj":
        const schema: schema = man.get_sch(schema_key);
        this.is_valid_obj(strval, schema, man);
        break;
      case "enum":
        const choices: choices = man.get_enum(schema_key);
        this.is_valid_enum(strval, choices, schema_key);
        break;
      case "obj_lst":
        const elem_schema: schema = man.get_sch(schema_key);
        this.is_valid_obj_lst(strval, elem_schema, man);
        break;
      case "enum_lst":
        const elem_choices: choices = man.get_enum(schema_key);
        this.is_valid_enum_lst(strval, elem_choices, schema_key);
        break;
      default:
        break;
    }
  }

  private is_valid_obj_lst(strval: string, schema: schema, man: sch_manager) {
    this.osplit(strval).forEach((obj) => this.is_valid_obj(obj, schema, man));
  }

  private osplit(objarr: string): string[] {
    if (!(objarr.startsWith("[") && objarr.endsWith("]"))) {
      objarr = `[${objarr}]`;
    }
    return JSON.parse(objarr).map((o: any) => JSON.stringify(o));
  }

  private csplit(arrval: string): string[] {
    if (arrval.startsWith("[") && arrval.endsWith("]")) {
      arrval = arrval.slice(1, arrval.length - 1);
    }
    return arrval.split(",").map((e) => e.replace(/\"/g, ""));
  }

  private is_valid_enum_lst(strval: string, choices: choices, name: string) {
    this.csplit(strval).forEach((e) => this.is_valid_enum(e, choices, name));
  }

  private is_valid_enum(strval: string, choices: choices, name: string) {
    if (!choices.some((e) => e === strval)) {
      this.logger.throw(`Expected ${name} enum value: ${strval}`);
    }
  }

  private is_valid_obj: (
    strval: string,
    schema: schema,
    man: sch_manager,
  ) => void = (strval: string, schema, man: sch_manager) => {
    const obj: obj = JSON.parse(strval);
    return this.is_valid_obj_helper(obj, schema, man);
  };

  private is_valid_obj_helper: (
    obj: obj,
    schema: schema,
    man: sch_manager,
  ) => void = (obj: obj, schema: schema, man: sch_manager) => {
    //If this method is ever called recursively, it is called with a schema value
    // of $ref/, which can either be an enum, an enum_lst, an obj or an obj_lst
    // Most likely have to
    //if its not we put a primitive where a nested object should be, most likely
    if (typeof obj !== "object") {
      this.logger.throw(`Expected object type but found: ${typeof obj}`);
    }

    for (const [k, sval] of Object.entries(schema)) {
      const v = obj[k];
      //If schema key not in object
      if (v === undefined) {
        this.logger.throw(`Missing key in object: ${k}`);
      }

      if (man.is_ref(sval)) {
        const [_, ref_type, ref_name] = sval.split("/");
        this.valid_specialized(
          typeof v === "string" ? v : JSON.stringify(v),
          ref_type,
          ref_name,
          man,
        );
        //Check if nested object is valid
      } else {
        //Check primitive is valid
        this.valid_simple(v.toString(), sval as type);
      }
    }
    return true;
  };

  private is_number: predicate<string> = (strval: string) =>
    strval.trim() !== "" && !isNaN(parseFloat(strval));
  private is_bool: predicate<string> = (strval: string) =>
    ["true", "false", "0", "1"].some((e) => e === strval);
  private is_int: predicate<string> = (strval: string) =>
    this.is_number(strval) && !strval.includes(".");
  private is_str: predicate<string> = (_: string) => true;
  private is_path: predicate<string> = (strval: string) => {
    const { s, b } =
      sep === "/" ? { s: "\\/", b: "\\.{2}" } : { s: "\\\\", b: "[a-zA-Z]:" };
    const r = new RegExp(`^((${b})?${s})?([\\w\\-. ]+${s})*[\\w\\-. ]+$`);
    return r.test(strval);
  };
  private is_str_lst: predicate<string> = (strval: string) =>
    /^([^,]+(,[^,]+)*)?$/.test(strval);
  private is_obj: predicate<string> = (strval: string) => {
    try {
      const o = JSON.parse(strval);
      return typeof o === "object";
    } catch (_) {
      return false;
    }
  };
  private is_date: predicate<string> = (strval: string) =>
    !isNaN(new Date(strval).getTime());

  private valid_simple(strval: string, typename: type) {
    if (!this.validators[`is_${typename}`](strval)) {
      this.logger.throw(`Validation error: ${strval} is not ${typename}`);
    }
  }

  private validators: {
    [K in `is_${Extract<type, string>}`]: predicate<string>;
  } = {
    is_bool: this.is_bool,
    is_float: this.is_number,
    is_int: this.is_int,
    is_str: this.is_str,
    is_path: this.is_path,
    is_str_lst: this.is_str_lst,
    is_obj: this.is_obj,
    is_enum: this.is_str,
    is_date: this.is_date,
    is_any: (_: string) => true,
    is_bool_lst: (strval: string) =>
      this.is_str_lst(strval) &&
      this.csplit(strval).every((e) => this.is_bool(e)),
    is_float_lst: (strval: string) =>
      this.is_str_lst(strval) &&
      this.csplit(strval).every((e) => this.is_number(e)),
    is_int_lst: (strval: string) =>
      this.is_str_lst(strval) &&
      this.csplit(strval).every((e) => this.is_int(e)),
    is_path_lst: (strval: string) =>
      this.is_str_lst(strval) &&
      this.csplit(strval).every((e) => this.is_path(e)),
    is_obj_lst: (strval: string) =>
      this.is_str_lst(strval) &&
      this.osplit(strval).every((e) => this.is_obj(e)),
    is_enum_lst: this.is_str_lst,
    is_date_lst: (strval: string) =>
      this.is_str_lst(strval) &&
      this.csplit(strval).every((e) => this.is_date(e)),
  };
}
