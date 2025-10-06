#!/usr/bin/env node
const { run_cli } = require("./lib");
const { cli_maker } = require("./cli-maker.cli-def");
const input = process.argv.slice(2);
run_cli(input, cli_maker);
