import { use, StackContext, Api } from "sst/constructs";
import { Database } from "./Database.ts";

export function API({ stack }: StackContext) {
  const api = new Api(stack, "api", {
    routes: {
      "GET /": {
        function: {
          handler: "packages/functions/src/lambda.main",
        }
      }
    },
  });

  stack.addOutputs({
    ApiEndpoint: api.url,
  });
}
