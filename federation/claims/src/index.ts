// The Claims API runs on Express, with a WebSocket server next to it, so it can serve
// subscriptions later in the course. Queries and mutations arrive over HTTP; subscriptions
// arrive over WebSocket. Both use the same schema.

import { readFileSync } from "node:fs";
import { createServer } from "node:http";
import { ApolloServer } from "@apollo/server";
import { ApolloServerPluginInlineTraceDisabled } from "@apollo/server/plugin/disabled";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { ApolloServerPluginLandingPageLocalDefault } from "@apollo/server/plugin/landingPage/default";
import { expressMiddleware } from "@as-integrations/express5";
import { makeExecutableSchema } from "@graphql-tools/schema";
import cors from "cors";
import express from "express";
import { useServer } from "graphql-ws/use/ws";
import { WebSocketServer } from "ws";
import { getUser } from "./auth.js";
import { startOutboxRelay } from "./outbox-relay.js";
import { resolvers, type Context } from "./resolvers.js";

const typeDefs = readFileSync(new URL("./schema.graphql", import.meta.url), "utf8");
const schema = makeExecutableSchema({ typeDefs, resolvers });

const app = express();
const httpServer = createServer(app);

// Subscriptions: a WebSocket server on the same port and path.
const wsServer = new WebSocketServer({ server: httpServer, path: "/graphql" });
const wsCleanup = useServer(
  { schema, context: (ctx): Context => ({ user: getUser(ctx.connectionParams?.authorization as string | undefined) }) },
  wsServer,
);

const server = new ApolloServer<Context>({
  schema,
  introspection: true,
  plugins: [
    ApolloServerPluginLandingPageLocalDefault(),
    ApolloServerPluginInlineTraceDisabled(),
    // Shut down the HTTP server and the WebSocket server cleanly.
    ApolloServerPluginDrainHttpServer({ httpServer }),
    { async serverWillStart() { return { async drainServer() { await wsCleanup.dispose(); } }; } },
  ],
});
await server.start();

// The API lives at /graphql. Send anyone who opens the root there, to Apollo Sandbox.
app.get("/", (_req, res) => res.redirect("/graphql"));

// Queries and mutations: Apollo Server as Express middleware.
app.use(
  "/graphql",
  cors(),
  express.json(),
  expressMiddleware(server, { context: async ({ req }) => ({ user: getUser(req.headers.authorization) }) }),
);

const port = Number(process.env.PORT ?? 4002);
httpServer.listen(port, "0.0.0.0", () => {
  console.log(`🚀 Claims API ready at http://localhost:${port}/graphql`);
});

// Publishes the events in the outbox to Kafka. Nothing adds events to it yet.
startOutboxRelay();
