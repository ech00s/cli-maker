import * as find_tests from "./test_find";
import * as parse_tests from "./test_parse";
import * as validate_tests from "./test_validate";
import * as convert_tests from "./test_convert";
import * as assign_tests from "./test_assign";
import * as process_tests from "./test_process";
import { test } from "./tools";

const modules = {
  find_tests: find_tests,
  parse_tests: parse_tests,
  validate_tests: validate_tests,
  convert_tests: convert_tests,
  assign_tests: assign_tests,
  process_tests: process_tests,
};

for (const name in modules) {
  console.log("Running module: " + name);
  Object.entries<test>((modules as any)[name]).forEach(([tname, t]) => {
    console.log("\tTest: " + tname);
    t.run();
  });
}
