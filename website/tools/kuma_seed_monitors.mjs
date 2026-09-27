#!/usr/bin/env node
/* Seeds Uptime Kuma (http://localhost:3002) with one monitor per health
   check gale already tracks in sysmon.py's TARGETS list -- the 14 local
   gale-host agents plus one hub health check per remote host (Tidal,
   Beacon, Mountain), all hitting the same /health endpoint peer_server.py
   already exposes.

   Run this YOURSELF, from a shell on gale-agent (or over SSH) -- it asks
   for your Uptime Kuma username/password interactively (never passed as a
   CLI arg, never sent anywhere but straight into the same login socket
   event the web UI itself uses). Nothing here reaches the assistant.

   Usage:
     cd /home/agent/agent/website/tools
     npm install socket.io-client   # one-time, only needed for this script
     node kuma_seed_monitors.mjs
*/
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { io } from "socket.io-client";

const KUMA_URL = "http://localhost:3002";

const MONITORS = [
  { name: "Gale (local)", addr: "100.66.39.59", port: 8787 },
  { name: "Zephyr (local)", addr: "100.66.39.59", port: 8788 },
  { name: "Squall (local)", addr: "100.66.39.59", port: 8789 },
  { name: "Tempest (local)", addr: "100.66.39.59", port: 8790 },
  { name: "Vortex (local)", addr: "100.66.39.59", port: 8792 },
  { name: "Chinook (local)", addr: "100.66.39.59", port: 8793 },
  { name: "Cyclone (local)", addr: "100.66.39.59", port: 8794 },
  { name: "Maistral (local)", addr: "100.66.39.59", port: 8795 },
  { name: "Sirocco (local)", addr: "100.66.39.59", port: 8796 },
  { name: "Bora (local)", addr: "100.66.39.59", port: 8797 },
  { name: "Tramontane (local)", addr: "100.66.39.59", port: 8791 },
  { name: "Ostro (local)", addr: "100.66.39.59", port: 8798 },
  { name: "Poniente (local)", addr: "100.66.39.59", port: 8800 },
  { name: "Levante (local)", addr: "100.66.39.59", port: 8799 },
  { name: "Tidal (remote hub)", addr: "100.91.42.51", port: 8787 },
  { name: "Beacon (remote hub)", addr: "100.99.217.90", port: 8787 },
  { name: "Mountain (remote hub)", addr: "100.114.14.116", port: 8787 },
];

function monitorPayload(name, addr, port) {
  return {
    type: "http",
    name,
    url: `http://${addr}:${port}/health`,
    method: "GET",
    interval: 60,
    retryInterval: 60,
    resendInterval: 0,
    maxretries: 2,
    notificationIDList: {},
    accepted_statuscodes: ["200-299"],
    ignoreTls: false,
    upsideDown: false,
    maxredirects: 10,
    dns_resolve_type: "A",
    dns_resolve_server: "1.1.1.1",
    parent: null,
    // `conditions` is NOT NULL in the schema, and server.js unconditionally
    // does `monitor.conditions = JSON.stringify(monitor.conditions)` on add
    // regardless of whether the caller supplied it -- omit this and that
    // becomes JSON.stringify(undefined) -> JS `undefined` -> NULL -> a NOT
    // NULL constraint failure at insert time. Same risk in principle for
    // kafkaProducerBrokers/kafkaProducerSaslOptions/rabbitmqNodes, but those
    // three columns are nullable, so leaving them out is fine.
    conditions: [],
    // NOT `tags: []` -- tags aren't a column on the monitor table itself in
    // this version (they're a separate relation, added via a different
    // socket event); including it here throws "no column named tags".
  };
}

async function main() {
  const rl = createInterface({ input: stdin, output: stdout });
  const username = await rl.question("Uptime Kuma username: ");
  const password = await rl.question("Uptime Kuma password: ");
  rl.close();

  const socket = io(KUMA_URL, { transports: ["websocket"] });

  await new Promise((resolve, reject) => {
    socket.on("connect_error", reject);
    socket.on("connect", resolve);
  });

  const loginRes = await new Promise((resolve) => {
    socket.emit("login", { username, password, token: "" }, resolve);
  });
  if (!loginRes.ok) {
    console.error("Login failed:", loginRes.msg || loginRes);
    process.exit(1);
  }
  console.log("Logged in as", username);

  for (const m of MONITORS) {
    const payload = monitorPayload(m.name, m.addr, m.port);
    const res = await new Promise((resolve) => {
      socket.emit("add", payload, resolve);
    });
    console.log(res.ok ? `  added: ${m.name}` : `  FAILED: ${m.name} -- ${res.msg}`);
  }

  socket.disconnect();
  console.log("Done. Refresh the Uptime Kuma dashboard to see them.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
