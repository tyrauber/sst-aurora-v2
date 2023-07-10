import { SSTConfig } from "sst";
import { Network } from "./stacks/Network";
import { Database } from "./stacks/Database";
import { API } from "./stacks/Api";

export default {
  config(_input) {
    return {
      name: "sst-aurora-v2",
      region: "us-east-1",
    };
  },
  stacks(app) {
    app.stack(Network);
    app.stack(Database);
    app.stack(API);
  }
} satisfies SSTConfig;
