import { logger_config } from "../models/config";
import { _enum } from "../models/types";
import { plugin } from "../plugin";
enum level {
  error = 1,
  warn,
  info,
  debug,
}

type lvlname = keyof typeof level;

type _stol = {
  [k in lvlname]: (typeof level)[k];
};

type _ltos = {
  [k in lvlname as (typeof level)[k]]: k;
};

const stol: _stol = {
  error: level.error,
  warn: level.warn,
  info: level.info,
  debug: level.debug,
} as const;

const ltos: _ltos = {
  1: "error",
  2: "warn",
  3: "info",
  4: "debug",
};

export interface ilogger extends Record<lvlname, Console[lvlname]> {
  throw: (text: string, code?: number) => void;
  config: logger_config;
}

export class logger extends plugin<logger_config> {
  constructor() {
    super(
      {
        where: "default-logger",
        "log-level": "info",
      },
      {
        where: "str",
        "log-level": "$ref/enum/log-level",
      },
      {},
      { "log-level": ["debug", "info", "warn", "error", "off"] },
    );
  }

  public throw: (text: string, code?: number) => void = (
    text: string,
    code?: number,
  ) => {
    this.error(text);
    process.exit(code ? code : 1);
  };

  public error: (...args: Parameters<Console["error"]>) => void = (
    ...args: Parameters<Console["error"]>
  ) => {
    if (this.get_val("log-level") === "off") return;
    if (level.error > stol[this.get_val("log-level") as lvlname]) return;
    console.error(...args);
  };
  public warn: (...args: Parameters<Console["warn"]>) => void = (
    ...args: Parameters<Console["warn"]>
  ) => {
    if (this.get_val("log-level") === "off") return;
    if (level.warn > stol[this.get_val("log-level") as lvlname]) return;
    console.warn(...args);
  };
  public info: (...args: Parameters<Console["info"]>) => void = (
    ...args: Parameters<Console["info"]>
  ) => {
    if (this.get_val("log-level") === "off") return;
    if (level.info > stol[this.get_val("log-level") as lvlname]) return;
    console.info(...args);
  };
  public debug: (...args: Parameters<Console["debug"]>) => void = (
    ...args: Parameters<Console["debug"]>
  ) => {
    if (this.get_val("log-level") === "off") return;
    if (level.debug > stol[this.get_val("log-level") as lvlname]) return;
    console.debug(...args);
  };
}

export function ts(): string {
  return new Date().toLocaleString("sv", { timeZone: "CET" }).split("+")[0];
}
export function get_anonymous(name: string): ilogger {
  let base: ilogger = {} as any;

  base.config = {
    "log-level": "info",
    where: name,
  };

  base = Object.entries(ltos).reduce((obj, [l, n]) => {
    return {
      ...obj,
      [n]: (...args: any[]) => {
        if (base.config["log-level"] === "off") return;
        if (parseInt(l) > stol[base.config["log-level"] as lvlname]) return;
        console[n](
          `|${ts()}|${(n.length === 4 ? " " : "") + n.toUpperCase()}|[${base.config.where}]: `,
          ...args,
        );
      },
    };
  }, base) as any;

  base.throw = (text: string, code?: number) => {
    (base.error(text), process.exit(code ? code : 1));
  };
  return base;
}
