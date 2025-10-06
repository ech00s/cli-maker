import {
  cmd_def,
  parsed_arg,
  str_args,
  str_arg,
  parsed_args,
  meta_args,
  meta_arg,
  base_arg,
} from "../models/components";
import { system } from "../system";
import { obj, type, type_map } from "../models/types";
import { converter } from "../models/base";
import { sys_config } from "../models/config";

//converter system
export class converter_sys extends system {
  constructor() {
    super({
      gets: ["cmd_def,str_args,meta_args"],
      sets: ["parsed_args"],
      ops: ["default"],
    });
  }

  protected default(
    cmd_def: cmd_def,
    str_args: str_args,
    meta_args: meta_args,
  ): parsed_args {
    return str_args.map((str_arg) => {
      if (!str_arg.meta) {
        const cmd_arg: base_arg = this.find(cmd_def, str_arg.name) as any;
        return this.convert(cmd_arg.type, cmd_arg.name, str_arg);
      }
      const meta_arg: meta_arg = meta_args.find(
        (ma) => ma.name === str_arg.name,
      ) as any;
      return this.convert(meta_arg.type, meta_arg.name, str_arg);
    });
  }

  private convert(type: type, name: string, str_arg: str_arg): parsed_arg {
    return {
      value: this.converters[`to_${type}`](str_arg.strval),
      name: name,
      meta: str_arg.meta,
    };
  }

  private osplit(objarr: string): string[] {
    if (!(objarr.startsWith("[") && objarr.endsWith("]"))) {
      objarr = `[${objarr}]`;
    }
    return JSON.parse(objarr).map((o: any) => JSON.stringify(o));
  }

  private unity: converter = (strval: string) => strval;
  private to_bool: converter = (strval: string) =>
    strval === "true" || strval === "1";
  private to_float: converter = (strval: string) => parseFloat(strval);
  private to_int: converter = (strval: string) => parseInt(strval);
  private to_obj: converter = (strval: string) => JSON.parse(strval);
  private to_str_lst: converter = (strval: string) =>
    strval.length === 0 ? [] : strval.split(",");
  private to_date: converter = (strval: string) => new Date(strval);
  private converters: {
    [K in `to_${Extract<type, string>}`]: converter;
  } = {
    to_bool: this.to_bool,
    to_float: this.to_float,
    to_int: this.to_int,
    to_str: this.unity,
    to_path: this.unity,
    to_enum: this.unity,
    to_date: this.to_date,
    to_any: (strval: string) => {
      let result: any;
      result = new Date(strval);
      if (!isNaN(result.getTime())) {
        return result;
      }
      try {
        result = JSON.parse(strval);
      } catch (_) {
        return strval;
      }
      return result;
    },
    to_obj: this.to_obj,
    to_obj_lst: (strval: string) =>
      this.osplit(strval).map((o) => this.to_obj(o)),
    to_enum_lst: this.to_str_lst,
    to_str_lst: this.to_str_lst,
    to_bool_lst: (strval: string) =>
      strval.split(",").map((b) => this.to_bool(b)),
    to_float_lst: (strval: string) =>
      strval.split(",").map((f) => this.to_float(f)),
    to_int_lst: (strval: string) =>
      strval.split(",").map((n) => this.to_int(n)),
    to_path_lst: this.to_str_lst,
    to_date_lst: (strval: string) =>
      strval.split(",").map((n) => this.to_date(n)),
  };
}
