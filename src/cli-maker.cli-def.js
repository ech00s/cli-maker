const { statSync, existsSync } = require("fs");
const { join, sep } = require("path");
const { cli_builder, cmd_builder } = require("./lib");
const {
  find_defs,
  health_check,
  create_jsfile,
  create_tsfile,
  create_binary,
  prep,
  cleanup,
  exit,
  run_tsfile,
} = require("./cli-maker.functions");
require("./ansi.extension");

const cli_maker = new cli_builder("cli-maker", "Cli maker builder")
  .add_subcmd(
    cmd_builder
      .make_builder()("run", "run a cli")
      .add_named("file", "path", {
        optional: false,
        shorthand: "-f",
        description: "File containing cli definition to run",
      })
      .add_named("skip-validate", "bool", {
        shorthand: "-u",
        description: "Skip definition validation",
      })
      .add_pos("str", {
        variadic: true,
        description: "Arguments passed to the subcommand",
      })
      .add_func(
        (
          { logger },
          { file: input, "skip-validate": skip_validate },
          ...rest
        ) => {
          const cwd = process.cwd();
          input = input ? input : cwd;
          input =
            input.startsWith("/") || input.slice(1).startsWith(":\\")
              ? input
              : join(cwd, input);

          if (!existsSync(input) || statSync(input).isDirectory()) {
            exit(`${input} is a directory or does not exist`);
          }
          let s = input.split(sep);
          let app_name = s[s.length - 1].split(".")[0];
          if (!app_name) app_name = "app";
          prep();
          if (!skip_validate) {
            logger.info(
              app_name + ": " + "Healthcheck".bg_yellow().txt_black(),
            );
            health_check(input);
            logger.info(app_name + ": " + "Validated".bg_green().txt_black());
          }
          logger.info(app_name + ": " + "Running".bg_yellow().txt_black());

          try {
            create_tsfile(input, app_name);
            logger.info(run_tsfile(app_name, ...rest).toString());
          } catch (e) {
            exit("Run " + app_name + " failed: ", e);
          }
          cleanup();
        },
      )
      .build(),
  )
  .add_subcmd(
    cmd_builder
      .make_builder()("build", "Builds the cli")
      .add_named("input", "path", {
        optional: true,
        shorthand: "-i",
        description: "Directory containing cli definition files",
      })
      .add_named("output", "path", {
        optional: true,
        shorthand: "-o",
        description: "Directory to output the binaries",
      })
      .add_named("pkg-json", "path", {
        default: "package.json",
        shorthand: "-p",
        description: "package.json path to detect external dependencies",
      })
      .add_func(({ logger }, { "pkg-json": pkg_json, input, output }) => {
        const cwd = process.cwd();
        input = input ? input : cwd;
        input =
          input.startsWith("/") || input.slice(1).startsWith(":\\")
            ? input
            : join(cwd, input);
        output = output ? output : input;
        for (const path of [input, output]) {
          if (!existsSync(path) || !statSync(path).isDirectory()) {
            exit(`${path} is not a directory or does not exist`);
          }
        }

        pkg_json =
          pkg_json.startsWith("/") || pkg_json.slice(1).startsWith(":\\")
            ? pkg_json
            : join(cwd, pkg_json);
        if (!existsSync(pkg_json) || statSync(pkg_json).isDirectory()) {
          exit(`${pkg_json} is a directory or does not exist`);
        }
        prep();
        find_defs(input).forEach((f) => {
          logger.info(
            f.app_name + ": " + "Healthcheck".bg_yellow().txt_black(),
          );
          health_check(f.file_path, f.app_name);
          logger.info(f.app_name + ": " + "Validated".bg_green().txt_black());
          create_tsfile(f.file_path, f.app_name);
          create_jsfile(f.app_name, pkg_json);
          logger.info(
            f.app_name + ": " + "Creating binary".bg_yellow().txt_black(),
          );
          create_binary(f.app_name, output);
          logger.info(
            f.app_name + ": " + "Binary created".bg_green().txt_black(),
          );
        });

        cleanup();
      })
      .build(),
  )
  .build();

module.exports = {
  cli_maker: cli_maker,
};
