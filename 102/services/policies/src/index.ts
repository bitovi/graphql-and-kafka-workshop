import { readFileSync } from "node:fs";
import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { ApolloServerPluginLandingPageLocalDefault } from "@apollo/server/plugin/landingPage/default";
import { createLoaders } from "./loaders.js";
import { resolvers } from "./resolvers.js";

const typeDefs = readFileSync(new URL("./schema.graphql", import.meta.url), "utf8");

const server = new ApolloServer({
  typeDefs,
  resolvers,
  // Apollo disables both of these when NODE_ENV=production (as in the Docker image).
  // Enabled explicitly since this project is for exploration.
  introspection: true,
  plugins: [ApolloServerPluginLandingPageLocalDefault()],
});

const port = Number(process.env.PORT ?? 4001);
const { url } = await startStandaloneServer(server, {
  listen: { port, host: "0.0.0.0" },
  // Runs once per request. Every resolver in that request receives this as contextValue.
  context: async () => ({ loaders: createLoaders() }),
});

console.log(`🚀 Policies service ready at ${url}`);
