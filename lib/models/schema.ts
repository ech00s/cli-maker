import { type } from "./types";

//Nested object type names
export type type_or_ref =
  | Exclude<type, "obj" | "obj_lst" | "enum" | "enum_lst">
  | `$ref/${"obj" | "enum" | "obj_lst" | "enum_lst"}/${string}`;

//Object schema
export interface schema extends Record<string, type_or_ref> {}

export type struct_keys = "obj" | "enum" | "obj_lst" | "enum_lst";
type prim = Exclude<type, struct_keys>;
export type inline_schema = `$schema/${struct_keys}/${string}`;
type type_or_inline = prim | inline_schema;

export interface choices extends Array<string> {}
