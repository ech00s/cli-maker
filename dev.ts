/*
*****************TODO******************
- NPM Package ( )
- Improve docs ( )
- CI mirror ( )
*/

import { run_cli } from "./lib/coordinator";
import cli from "./example/util.cli-def";
run_cli(process.argv.slice(2), cli);
