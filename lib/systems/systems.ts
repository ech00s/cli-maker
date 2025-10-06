import { system } from "../system";
import { assigner_sys } from "./assigner";
import { config_sys } from "./configurer";
import { converter_sys } from "./converter";
import { executor_sys } from "./executor";
import { finder_sys } from "./finder";
import { meta_cmd_sys } from "./meta_cmd";
import { parser_sys } from "./parser";
import { validator_sys } from "./validator";

export const systems: Record<string, { new (): system }> = {
  validator: validator_sys,
  converter: converter_sys,
  finder: finder_sys,
  configurer: config_sys,
  parser: parser_sys,
  executor: executor_sys,
  assigner: assigner_sys,
  meta: meta_cmd_sys,
};
