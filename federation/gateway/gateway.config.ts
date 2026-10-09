import { defineConfig } from "@graphql-hive/gateway";

export const gatewayConfig = defineConfig({
  port: 4000,

  // The composed schema of every subgraph. `npm start` keeps it up to date.
  supergraph: "./supergraph.graphql",

  // Send subscriptions to subgraphs over WebSocket, the protocol Apollo Server uses.
  transportEntries: {
    "*.http": { options: { subscriptions: { kind: "ws" } } },
  },

  // Pass each client's Authorization header on to every subgraph.
  propagateHeaders: {
    fromClientToSubgraphs: ({ request }) => {
      const authorization = request.headers.get("authorization");
      return authorization ? { authorization } : {};
    },
  },
});
