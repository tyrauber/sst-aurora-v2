import { use, StackContext, Api } from "sst/constructs";
import { Database } from "./Database.ts";

export function API({ stack }: StackContext) {
  const { policies } = use(Database);
  const api = new Api(stack, "api", {
    routes: {
      "GET /": {
        function: {
          handler: "packages/functions/src/status.main",
        }
      }
    },
  });

  api.attachPermissions(policies)
  stack.addOutputs({
    ApiEndpoint: api.url,
  });
}
