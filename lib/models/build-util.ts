import {
  base_arg,
  cli_def,
  cmd_def,
  meta,
  named_arg,
  pos_arg,
} from "./components";

function is_meta(v: any): v is meta {
  return (
    typeof v === "object" &&
    "name" in v &&
    typeof v.name === "string" &&
    "description" in v &&
    typeof v.description === "string"
  );
}

function is_base_arg(v: any): v is base_arg {
  return (
    is_meta(v) &&
    "type" in v &&
    typeof v.type === "string" &&
    "variadic" in v &&
    typeof v.variadic === "boolean"
  );
}

function is_named_arg(v: any): v is named_arg {
  return (
    is_base_arg(v) &&
    "optional" in v &&
    typeof v.optional === "boolean" &&
    "shorthands" in v &&
    Array.isArray(v.shorthands) &&
    v.shorthands.every((sh) => typeof sh === "string")
  );
}

function is_pos_arg(v: any): v is pos_arg {
  return is_base_arg(v) && "idx" in v && typeof v.idx === "number";
}

export function is_cmd_def(v: any): v is cmd_def {
  return (
    is_meta(v) &&
    "execute" in v &&
    typeof v.execute === "function" &&
    "named" in v &&
    typeof v.named === "object" &&
    Object.values(v.named as any).every((n) => is_named_arg(n)) &&
    "pos" in v &&
    Array.isArray(v.pos) &&
    v.pos.every((p) => is_pos_arg(p)) &&
    "help" in v &&
    typeof v.help === "string" &&
    "id" in v &&
    typeof v.id === "string" &&
    "plugins" in v &&
    typeof v.plugins === "object"
  );
}

function is_cli_def(v: any): v is cli_def {
  return (
    is_meta(v) &&
    "version" in v &&
    typeof v.version === "string" &&
    "help" in v &&
    typeof v.help === "string" &&
    "cli_tree" in v &&
    typeof v.cli_tree === "object" &&
    Object.values(v.cli_tree as any).every(
      (_v) => is_cli_def(_v) || is_cmd_def(_v),
    )
  );
}

export default is_cli_def;
