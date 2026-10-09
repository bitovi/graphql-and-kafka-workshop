import { readFileSync } from "node:fs";
import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { ApolloServerPluginInlineTraceDisabled } from "@apollo/server/plugin/disabled";
import { ApolloServerPluginLandingPageLocalDefault } from "@apollo/server/plugin/landingPage/default";
import { buildSubgraphSchema } from "@apollo/subgraph";
import { parse } from "graphql";
import { getUser } from "./auth.js";
import { createLoaders } from "./loaders.js";
import { resolvers } from "./resolvers.js";

const typeDefs = parse(readFileSync(new URL("./schema.graphql", import.meta.url), "utf8"));

const server = new ApolloServer({
  schema: buildSubgraphSchema([{ typeDefs, resolvers }]),
  introspection: true,
  plugins: [ApolloServerPluginLandingPageLocalDefault(), ApolloServerPluginInlineTraceDisabled()],
});

const port = Number(process.env.PORT ?? 4001);
const { url } = await startStandaloneServer(server, {
  listen: { port, host: "0.0.0.0" },
  context: async ({ req }) => ({ user: getUser(req.headers.authorization), loaders: createLoaders() }),
});

console.log(`Policies subgraph ready at ${url}`);
