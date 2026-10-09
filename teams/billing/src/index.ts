import { readFileSync } from "node:fs";
import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { ApolloServerPluginInlineTraceDisabled } from "@apollo/server/plugin/disabled";
import { ApolloServerPluginLandingPageLocalDefault } from "@apollo/server/plugin/landingPage/default";
import { buildSubgraphSchema } from "@apollo/subgraph";
import { parse } from "graphql";
import { startConsumer } from "./consumer.js";
import { resolvers } from "./resolvers.js";

// BILLING_VERSION=2 is the release that adds payouts to the Claims team's Claim type.
const version = process.env.BILLING_VERSION === "2" ? 2 : 1;
const schemaFile = version === 2 ? "./schema-v2.graphql" : "./schema.graphql";
const typeDefs = parse(readFileSync(new URL(schemaFile, import.meta.url), "utf8"));

// Version 1's schema has no Claim type, so it doesn't get Claim's resolvers.
const { Claim, ...versionOneResolvers } = resolvers;

const server = new ApolloServer({
  schema: buildSubgraphSchema([{ typeDefs, resolvers: version === 2 ? resolvers : versionOneResolvers }]),
  introspection: true,
  plugins: [ApolloServerPluginLandingPageLocalDefault(), ApolloServerPluginInlineTraceDisabled()],
});

const port = Number(process.env.PORT ?? 4003);
const { url } = await startStandaloneServer(server, { listen: { port, host: "0.0.0.0" } });
console.log(`Billing subgraph version ${version} ready at ${url}`);

await startConsumer();
