//Primitive types
export type float = number;

export type integer = number;

export type path = string;

export type _enum = string;

interface types_wo_union {
  bool: boolean;
  str: string;
  int: integer;
  float: float;
  path: path;
  obj: obj;
  enum: _enum;
  date: Date;
  any: any;
  bool_lst: boolean[];
  str_lst: string[];
  int_lst: integer[];
  float_lst: float[];
  path_lst: path[];
  obj_lst: obj[];
  enum_lst: _enum[];
  date_lst: Date[];
}

export interface type_map extends types_wo_union {
  //union:value;
}

//type name
export type type = keyof type_map;

//value type
export type value = types_wo_union[keyof types_wo_union];

//array type
export interface values extends Array<value> {}

//object type
export interface obj extends Record<string, value> {}
