const { execSync } = require("child_process");
const {
  existsSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
  mkdirSync,
} = require("fs");
const { join, sep } = require("path");
require("./ansi.extension");

const ROOT_DIR = __dirname
  .split(sep)
  .slice(0, __dirname.split(sep).length - 1)
  .join(sep);
const WORK_DIR = ROOT_DIR + sep + ".build";
const hc =
  'import def from "${PATH_NAME}"\n' +
  'import check from "${IMPORT_PATH}/lib/models/build-util.ts"\n' +
  "if(!check(def)){\n" +
  '    console.error("Object is not a valid cli definition")\n' +
  "    process.exit(1);\n" +
  "}";
const template =
  'import { run_cli } from "${IMPORT_PATH}/lib/coordinator";\n' +
  'import cli_def from "${PATH_NAME}";\n' +
  "run_cli(process.argv.slice(2),cli_def);\n";

function create_tsfile(file_path, app_name) {
  writeFileSync(
    `${join(WORK_DIR, app_name + ".ts")}`,
    template
      .replaceAll("${PATH_NAME}", file_path.replaceAll(sep, "/"))
      .replaceAll("${IMPORT_PATH}", ROOT_DIR.replaceAll(sep, "/")),
  );
}

function health_check(file_path, app_name) {
  const hc_path = join(WORK_DIR, app_name + "-hc.ts");
  writeFileSync(
    hc_path,
    hc
      .replaceAll("${PATH_NAME}", file_path.replaceAll(sep, "/"))
      .replaceAll("${IMPORT_PATH}", ROOT_DIR.replaceAll(sep, "/")),
  );
  try {
    execSync(`npx -y tsx ${hc_path}`);
  } catch (err) {
    exit("Health check failed", err);
  }
}

function external_deps(pkg_json) {
  try {
    // Exclude all production dependencies
    const dependencies = Object.keys(
      JSON.parse(readFileSync(pkg_json, "utf8")).dependencies || [],
    );
    console.log("Dependencies".bg_cyan().txt_black() + ":");
    console.log("    " + JSON.stringify(dependencies, null, 1).txt_bold());
    return dependencies.map((dep) => `--external:${dep}`).join(" ") || "";
  } catch (e) {
    exit("Invalid package.json at " + pkg_json, e.message);
  }
}

function create_jsfile(app_name, pkg_json) {
  try {
    execSync(
      `npx -y esbuild -- --bundle --platform=node --format=cjs --outfile=${join(WORK_DIR, app_name + ".js")} --external:path --external:fs ${external_deps(pkg_json)} ${join(WORK_DIR, app_name + ".ts")}`,
    );
  } catch (err) {
    exit("Could not create js file", err);
  }
}

function create_binary(app_name, output) {
  const target = `node*-${process.platform}-${process.arch}`;
  try {
    execSync(
      `npx -y pkg -- -t ${target} ${join(WORK_DIR, app_name + ".js")} -o ${join(output, app_name)}`,
    );
  } catch (err) {
    exit("Could not create binary", err);
  }
}

function run_tsfile(app_name, ...rest) {
  return execSync(
    `npx -y tsx ${join(WORK_DIR, app_name + ".ts")} -- ${rest.map((s) => `\"${s}\"`).join(" ")}`,
  );
}

function prep() {
  if (existsSync(WORK_DIR)) {
    cleanup();
  }
  mkdirSync(WORK_DIR);
}

function exit(msg, err) {
  console.error(msg);
  if (err && err.cause) console.error(err.cause);
  cleanup();
  process.exit(1);
}

function cleanup() {
  rmSync(WORK_DIR, { force: true, recursive: true });
}

function find_defs(root_path) {
  return readdirSync(root_path)
    .filter((f) => /.+\.cli-def\.(ts|js)/.test(f))
    .map((f) => {
      return {
        file_path: join(root_path, f),
        app_name: f.replace(/\.cli-def\.(ts|js)$/, ""),
      };
    });
}

module.exports = {
  find_defs: find_defs,
  create_binary: create_binary,
  create_jsfile: create_jsfile,
  create_tsfile: create_tsfile,
  health_check: health_check,
  prep: prep,
  cleanup: cleanup,
  exit: exit,
  run_tsfile: run_tsfile,
};
