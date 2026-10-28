// A minimal REST version of the same policies data, used only for the
// "REST vs GraphQL" comparison video in GraphQL 101.
//
// It is deliberately a *conventional* REST API: one resource per URL, the
// server decides the response shape, and related data lives behind its own
// request. That's what makes the comparison honest — the GraphQL side isn't
// being measured against a strawman.
//
// Run it alongside the GraphQL server:
//   npm run rest-demo        # http://localhost:4002
//
// Endpoints:
//   GET /policies
//   GET /policies/:id
//   GET /policyholders
//   GET /policyholders/:id

import { createServer } from "node:http";
import { policies, policyholders } from "./data.js";

const port = Number(process.env.REST_PORT ?? 4002);

const server = createServer((req, res) => {
  const url = new URL(req.url ?? "/", `http://${req.headers.host}`);
  const segments = url.pathname.split("/").filter(Boolean);

  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");

  const send = (status: number, body: unknown) => {
    res.statusCode = status;
    res.end(JSON.stringify(body, null, 2));
  };

  if (req.method !== "GET") {
    return send(405, { error: "Only GET is supported in this demo." });
  }

  const [resource, id] = segments;

  if (resource === "policies") {
    if (!id) return send(200, policies);
    const policy = policies.find((p) => p.id === id);
    return policy ? send(200, policy) : send(404, { error: `No policy ${id}` });
  }

  if (resource === "policyholders") {
    if (!id) return send(200, policyholders);
    const holder = policyholders.find((p) => p.id === id);
    return holder ? send(200, holder) : send(404, { error: `No policyholder ${id}` });
  }

  return send(404, {
    error: "Unknown resource.",
    available: ["/policies", "/policies/:id", "/policyholders", "/policyholders/:id"],
  });
});

server.listen(port, "0.0.0.0", () => {
  console.log(`🧪 REST comparison demo ready at http://0.0.0.0:${port}/`);
  console.log(`   Try: curl -s localhost:${port}/policies | head -20`);
});
