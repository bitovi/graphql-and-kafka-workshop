// Serves the Claims Desk and forwards /graphql, including WebSocket upgrades, to the gateway.
// The browser only talks to this server, so the Desk works behind Codespaces' port forwarding.

import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";

const gatewayUrl = process.env.GATEWAY_URL ?? "http://localhost:4000";
const port = Number(process.env.PORT ?? 3000);

const app = express();
const graphqlProxy = createProxyMiddleware({
  target: gatewayUrl,
  ws: true,
  changeOrigin: true,
  pathFilter: "/graphql",
  on: {
    error: (_err, _req, res) => {
      if ("writeHead" in res && !res.headersSent) {
        res.writeHead(502, { "content-type": "application/json" });
        res.end(JSON.stringify({ errors: [{ message: "The Claims Desk can't reach the gateway", extensions: { code: "GATEWAY_UNREACHABLE" } }] }));
      }
    },
  },
});

app.use(graphqlProxy);
app.use(express.static(new URL("./public", import.meta.url).pathname));

const server = app.listen(port, "0.0.0.0", () => {
  console.log(`Claims Desk ready at http://localhost:${port}, using the gateway at ${gatewayUrl}`);
});
server.on("upgrade", graphqlProxy.upgrade);
