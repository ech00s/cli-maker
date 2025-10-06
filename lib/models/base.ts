import { value } from "./types";

//system utility

export interface converter {
  (strval: string): value;
}

export interface predicate<T> {
  (strval: T): boolean;
}
