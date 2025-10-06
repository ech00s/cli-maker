import { readFileSync, writeFileSync } from "fs";
import { plugin } from "../plugin";
import { path } from "../models/types";

export class cache extends plugin<{
  filename: path;
}> {
  constructor() {
    super({ filename: "cache.json" }, { filename: "path" });
  }

  private write(record: Record<string, string>) {
    writeFileSync(this.get_val("filename"), JSON.stringify(record));
  }

  private read(): Record<string, string> {
    try {
      return JSON.parse(readFileSync(this.get_val("filename"), "utf-8"));
    } catch (_) {}

    return {};
  }

  public set(key: string, value: string) {
    this.write({ ...this.read(), [key]: value });
  }

  public get(key: string): string {
    return this.read()[key];
  }
}
