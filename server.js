const { createServer } = require("http");
const { URL } = require("url");
const next = require("next");
const { ExpressPeerServer } = require("peer");

const dev = process.env.NODE_ENV !== "production";
const hostname = "0.0.0.0";
const port = parseInt(process.env.PORT, 10) || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const upgradeHandler = app.getUpgradeHandler();
  const express = require("express");
  const server = express();

  const httpServer = createServer(server);

  const peerServer = ExpressPeerServer(httpServer, {
    path: "/signaling",
    allow_discovery: true,
  });
  server.use(peerServer);

  // PeerJS registers a single 'upgrade' listener on httpServer (via ws).
  // Capture it, remove it, and install our own router so Next.js HMR
  // upgrades (/_next/) don't get swallowed by PeerJS in dev mode.
  const peerUpgradeListeners = httpServer.listeners("upgrade");
  const peerUpgradeHandler = peerUpgradeListeners[0];
  httpServer.removeAllListeners("upgrade");

  httpServer.on("upgrade", (req, socket, head) => {
    const { pathname } = new URL(req.url || "", "http://localhost");
    if (pathname.startsWith("/_next/")) {
      upgradeHandler(req, socket, head).catch(() => socket.destroy());
    } else if (pathname.startsWith("/signaling")) {
      peerUpgradeHandler(req, socket, head);
    } else {
      socket.destroy();
    }
  });

  server.all("*", (req, res) => {
    if (req.url?.startsWith("/signaling")) return;
    handle(req, res);
  });

  httpServer.listen(port, hostname, () => {
    console.log(`Countdown server running on http://${hostname}:${port}`);
  });
});
