import { meta_arg } from "../lib/models/components";
import { float } from "../lib/models/types";
import { plugin } from "../lib/plugin";
import { cli_builder, cmd_builder } from "../lib/builders";
import { add_meta_arg } from "../lib/memory";
import { register_plugin } from "../lib/plugins/plugins";

//This example is to demonstrate the meta argument implementation
//In cli maker: Every meta argument correspond to a configuration on plugin
//This allows for systematically modifying the behavior of a command, by modifying
//The behavior of the plugins that are injected into it
//For example, the builtin verbose meta argument, with the --verbose shorthand
//Triggers a change in the log level of the logger plugin ( injected by default )

//The basic usage simply requires extending the plugin class
class dummy extends plugin /*optionally put <obj> here*/ {
  constructor() {
    super(
      {
        key: "value",
        num: 42,
        obj: { n: "nval" },
        flags: [false, false, false],
      },
      {
        key: "str",
        num: "int",
        obj: "$ref/obj/sch",
        flags: "bool_lst",
      },
      {
        sch: { k: "str" },
      },
    );
  }
}

//Now we can define a meta argument that
// Theoretically changes a commands behavior
const dummy_meta: meta_arg = {
  plugin: "dummy",
  shorthands: ["--custom-name", "-cn"],
  name: "custom-name",
  key: "key",
  //The input type does not have to correspond to the actual config value type
  type: "float",
  //But if they dont, the optional transform has to transform it to the proper type
  transform: (n: float) => n.toString(),
};

//Verbose
const verbose_meta: meta_arg = {
  plugin: "logger",
  shorthands: ["--verbose", "-v"],
  name: "verbose",
  key: "log-level",
  type: "bool",
  transform: (verbose: boolean) => (verbose ? "debug" : "info"),
};
//Silent
const silent_meta: meta_arg = {
  plugin: "logger",
  shorthands: ["--verbose", "-v"],
  name: "verbose",
  key: "log-level",
  type: "bool",
  transform: (silent: boolean) => (silent ? "off" : "info"),
};
//The value passed to the command s the only one that is validated

//A more concrete example is the known --dry-run flag
//Imagine the custom plugin in this case as a wrapper around some client application

//An interface that groups actual and mock clients
interface client_delegate {
  com(data: string): void;
}

//a mock client
class _mock_client implements client_delegate {
  constructor() {}

  com(data: string) {
    console.log("Mocking " + data);
  }
}

//an actual one
class _client implements client_delegate {
  constructor() {}

  com(data: string) {
    console.log("Actually doing " + data);
  }
}

//The class that extends the plugin now acts as a wrapper around a possible delegate
class client extends plugin<{ mock: boolean }> implements client_delegate {
  constructor() {
    super(
      {
        mock: false,
      },
      {
        mock: "bool",
      },
    );
  }

  com(data: string) {
    //get_val and set_val are provided by the plugin abstract class
    let mock: boolean = this.get_val("mock");
    if (mock) {
      return new _mock_client().com(data);
    }
    return new _client().com(data);
  }
}

//Now we can define the --dry-run flag
const dry_run_meta: meta_arg = {
  plugin: "client",
  shorthands: ["--dry-run"],
  name: "dry-run",
  key: "mock",
  type: "bool",
};

//add meta argument and register plugin
add_meta_arg(dry_run_meta);
register_plugin(client);

//Using the builder:
//PLugin name has to correspond to constructor name by convention
const cli = new cli_builder(
  "meta-tester",
  "This an example cli for plugin demonstration",
)
  .add_subcmd(
    cmd_builder
      .make_builder({ client: client })(
        "test-mock",
        "This is an example command where the client can be mocked",
      )
      .add_named("data", "str", { optional: false })
      .add_func(({ client }, { data }, ...pos) => {
        client.com(data);
      })
      .build(),
  )
  .build();

export default cli;
//Can be run for example:
const cmd_str: string = 'meta-tester some-command --dry-run --data="some data"';
