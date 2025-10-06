import { randomBytes } from "crypto";
import { configurable } from "./models/config";
import { schema } from "./models/schema";
import { enum_tree, sch_tree, schema_registry } from "./utils/schema_registry";
import { obj } from "./models/types";

export abstract class plugin<T extends obj = obj> extends configurable<T> {
  readonly id: string;
  constructor(
    def: T,
    config_schema: schema,
    sch_tree: sch_tree = {},
    enum_tree: enum_tree = {},
  ) {
    super(def);
    this.id = this.constructor.name + randomBytes(4).toString("hex");
    schema_registry.register_tree(this.id, {
      schemas: { ...sch_tree, [this.id]: config_schema },
      enums: enum_tree,
    });
  }
}
