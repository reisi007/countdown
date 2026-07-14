const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { ExpressPeerServer } = require("peer");

const dev = process.env.NODE_ENV !== "production";
const hostname = "0.0.0.0";
const port = parseInt(process.env.PORT, 10) || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const express = require("express");
  const server = express();

  const httpServer = createServer(server);

  const peerServer = ExpressPeerServer(httpServer, {
    path: "/signaling",
    allow_discovery: true,
  });

  server.use(peerServer);

  server.all("*", (req, res) => {
    if (req.url?.startsWith("/signaling")) return;
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  httpServer.listen(port, hostname, () => {
    console.log(`Countdown server running on http://${hostname}:${port}`);
  });
});
