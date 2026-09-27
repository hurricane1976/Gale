#!/usr/bin/env node
/* Second Kuma setup step (run after kuma_seed_monitors.mjs):
     1. Creates a Kuma API key so Prometheus can scrape Kuma's own
        /metrics endpoint. Kuma's API auth uses HTTP Basic auth where the
        PASSWORD field is the API key itself (username is ignored) --
        see server/auth.js's apiAuthorizer. The formatted key is written
        to ~/.kuma_prometheus_key (mode 600) instead of being printed, so
        Claude can pick it up over its own shell access on this same box
        and finish wiring Prometheus's scrape config -- the key never
        needs to be pasted into chat.
     2. Creates a Telegram notification using the bot token/chat id
        already in keys/telegram.env (same file Alertmanager uses) and
        applies it to every existing monitor, so a monitor going down
        pages you the same way a Prometheus alert does.

   Run this YOURSELF -- it prompts for your Kuma login the same way
   kuma_seed_monitors.mjs did. Nothing here reaches the assistant directly;
   only the file path is shared, on the same machine. */
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { readFileSync, writeFileSync, chmodSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { io } from "socket.io-client";

const KUMA_URL = "http://localhost:3002";
const KEY_OUT_PATH = join(homedir(), ".kuma_prometheus_key");
const TELEGRAM_ENV_PATH = "/home/agent/agent/keys/telegram.env";

function readTelegramEnv(path) {
  const text = readFileSync(path, "utf8");
  const vars = {};
  for (const line of text.split("\n")) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m) vars[m[1]] = m[2].trim();
  }
  return vars;
}

async function emit(socket, event, ...args) {
  return new Promise((resolve) => socket.emit(event, ...args, resolve));
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

  const loginRes = await emit(socket, "login", { username, password, token: "" });
  if (!loginRes.ok) {
    console.error("Login failed:", loginRes.msg || loginRes);
    process.exit(1);
  }
  console.log("Logged in as", username);

  // 1) API key for Prometheus
  const keyRes = await emit(socket, "addAPIKey", { name: "prometheus-scrape", active: true, expires: null });
  if (!keyRes.ok) {
    console.error("API key creation failed:", keyRes.msg);
  } else {
    writeFileSync(KEY_OUT_PATH, keyRes.key + "\n", { mode: 0o600 });
    chmodSync(KEY_OUT_PATH, 0o600);
    console.log(`API key created (id ${keyRes.keyID}), saved to ${KEY_OUT_PATH} (mode 600).`);
  }

  // 2) Telegram notification, applied to every existing monitor
  let tg;
  try {
    tg = readTelegramEnv(TELEGRAM_ENV_PATH);
  } catch (e) {
    console.error(`Could not read ${TELEGRAM_ENV_PATH}:`, e.message);
    tg = null;
  }
  if (tg && tg.TELEGRAM_BOT_TOKEN && tg.TELEGRAM_CHAT_ID) {
    const notifRes = await emit(
      socket,
      "addNotification",
      {
        name: "Kuma -> Telegram (galeagentbot)",
        type: "telegram",
        isDefault: true,
        applyExisting: true,
        telegramBotToken: tg.TELEGRAM_BOT_TOKEN,
        telegramChatID: tg.TELEGRAM_CHAT_ID,
      },
      null,
    );
    console.log(notifRes.ok ? "Telegram notification created and applied to all monitors." : `Telegram notification FAILED: ${notifRes.msg}`);
  } else {
    console.log("Skipped Telegram notification -- telegram.env missing expected keys.");
  }

  socket.disconnect();
  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
