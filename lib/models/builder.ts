import { enum_tree, sch_tree } from "../utils/schema_registry";
import { schema } from "./schema";
import { obj, type, type_map, value, values } from "./types";

export type type_or_known_ref<S extends sch_tree, E extends enum_tree> =
  | Exclude<type, "obj" | "obj_lst" | "enum" | "enum_lst">
  | `$ref/obj/${Extract<keyof S, string>}`
  | `$ref/enum/${Extract<keyof E, string>}`
  | `$ref/obj_lst/${Extract<keyof S, string>}`
  | `$ref/enum_lst/${Extract<keyof E, string>}`;

export type schema_w_known_ref<
  S extends sch_tree,
  E extends enum_tree,
> = Record<string, type_or_known_ref<S, E>>;

export type schema_to_obj<
  S extends schema,
  A extends sch_tree,
  E extends enum_tree,
> = {
  [K in keyof S]: S[K] extends `$ref/obj/${infer name}`
    ? schema_to_obj<A[name], A, E>
    : S[K] extends `$ref/obj_lst/${infer name}`
      ? Array<schema_to_obj<A[name], A, E>>
      : S[K] extends `$ref/enum/${infer name}`
        ? E[name][number]
        : S[K] extends `$ref/enum_lst/${infer name}`
          ? Array<E[name][number]>
          : S[K] extends type
            ? type_map[S[K]]
            : never;
};

type extension<K extends string, V extends value | values> = { [P in K]: V };
type opt_extension<K extends string, V extends value | values> = {
  [P in K]?: V;
};
export type extend<
  T extends obj,
  K extends string,
  V extends value | values,
> = T & extension<K, V>;
type opt_extend<T extends obj, K extends string, V extends value | values> = T &
  opt_extension<K, V>;

export type maybe_extend<
  A extends obj,
  K extends string,
  V extends value | values,
  B extends boolean,
> = B extends true ? opt_extend<A, K, V> : extend<A, K, V>;

export type maybe_variadic<B extends boolean, T extends value> = B extends true
  ? T[]
  : T;

export type pextend_mvariadic<
  B extends boolean,
  T extends value,
  P extends values,
> = B extends true ? [...P, ...T[]] : [...P, T];

export type nextend_mvariadic<
  A extends obj,
  K extends string,
  V extends value,
  Opt extends boolean,
  Var extends boolean,
> = maybe_extend<A, K, maybe_variadic<Var, V>, Opt>;

export type mutex<T, K extends keyof T> = {
  [P in K]: Pick<T, P> & { [Q in Exclude<K, P>]?: never } & Omit<T, K>;
}[K];
