import { join, sep } from "path";
import { obj, path } from "../models/types";
import {
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "fs";
import { get_anonymous, ilogger } from "../plugins/logger";
import { cmd_def } from "../models/components";
import { schema } from "../models/schema";

export class ndb {
  readonly root: path;
  readonly logger: ilogger;

  constructor(dir_name: string) {
    this.logger = get_anonymous("NDB");
    this.root = join(this.home(), ".cli-maker", dir_name);
    if (!this.has_data(this.root)) mkdirSync(this.root, { recursive: true });
  }

  public create_path(parts: string[]): string {
    return join(this.root, ...parts);
  }

  public to_absolute(path: string): string {
    return path.startsWith("/") || path.slice(1).startsWith(":\\")
      ? path
      : join(process.cwd(), path);
  }

  public read_data(path: string): obj {
    let result: obj = {};
    try {
      result = JSON.parse(readFileSync(path, "utf-8"));
    } catch (_) {
      this.logger.throw(`File at ${path} is corrupt`);
    }
    return result;
  }

  public write_data(path: string, new_data: obj) {
    let old: obj = {};
    if (!this.has_data(path)) {
      this.create_data(path);
    } else {
      old = this.read_data(path);
    }
    writeFileSync(path, JSON.stringify({ ...old, ...new_data }));
  }

  private create_data(path: string) {
    mkdirSync(join(...path.split(sep).slice(0, -1)), { recursive: true });
    openSync(path, "w");
  }

  public has_data(path: string): boolean {
    return existsSync(path);
  }

  public delete_data(path: string) {
    rmSync(path, { recursive: true });
  }

  private home(): string {
    return process.env.APPDATA || process.env.HOME || "./";
  }
}

/*

  private update_cli_config(def: cli_def, config: object) {
    let result = this.rec(def, config, def.name);
    Object.entries(result).forEach(([chain, conf]) => {
      this.update_cmd_config(chain, def.name, conf);
    });
  }

  private rec(
    def: cli_def | cmd_def,
    config: config_values,
    chain: string,
  ): Record<string, config_values> {
    let result = {};
    Object.entries(config).forEach(([k, v]) => {
      if (!is_cmd_def(def)) {
        result = {
          ...this.rec(def.cli_tree[k], v, chain + "." + k),
          ...result,
        };
      } else {
        (result as any)[chain] = { [k]: v };
      }
    });

    return result;
  } */
