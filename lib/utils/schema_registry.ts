import { choices, schema } from "../models/schema";
import { mutex } from "../models/builder";
export type sch_tree = Record<string, schema>;
export type enum_tree = Record<string, choices>;

interface mod_tree {
  schemas: sch_tree;
  enums: enum_tree;
}

export interface sch_manager {
  get_sch(name: string): schema;
  get_enum(name: string): choices;
  is_ref(ref: string): boolean;
  from_ref(ref: string): schema | choices;
}

export class schema_registry {
  static trees: Record<string, mod_tree> = {};

  public static register_tree(
    id: string,
    opts: { schemas?: sch_tree; enums?: enum_tree },
  ): void {
    let tree = { schemas: {}, enums: {} };
    if (opts.schemas) tree.schemas = opts.schemas;
    if (opts.enums) tree.enums = opts.enums;
    schema_registry.trees[id] = tree;
  }

  private static get_schema(id: string, name: string): schema {
    return schema_registry.trees[id].schemas[name];
  }

  private static get_enum(id: string, name: string): choices {
    return schema_registry.trees[id].enums[name];
  }

  public static register(
    id: string,
    name: string,
    opts: mutex<{ schema: schema; enum: choices }, "enum" | "schema">,
  ): void {
    if (!schema_registry.trees[id])
      schema_registry.trees[id] = { schemas: {}, enums: {} };
    if (opts.schema) {
      schema_registry.trees[id].schemas[name] = opts.schema;
      return;
    }
    if (opts.enum) schema_registry.trees[id].enums[name] = opts.enum;
  }

  public static get_manager(id: string): sch_manager {
    return {
      get_sch: (name: string) => {
        return schema_registry.get_schema(id, name);
      },
      get_enum: (name: string) => {
        return schema_registry.get_enum(id, name);
      },

      is_ref: (ref: string) => {
        return ref.startsWith("$ref");
      },

      from_ref: (ref: string) => {
        const [_, type, ref_name] = ref.split("/");
        if (type.startsWith("obj"))
          return schema_registry.get_schema(id, ref_name);
        return schema_registry.get_enum(id, ref_name);
      },
    };
  }
}
