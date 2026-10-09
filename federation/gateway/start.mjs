// Runs the course's stand-in for a schema registry, and the gateway.
//
// 1. Composes the subgraphs listed in subgraphs.json into supergraph.graphql, using the
//    Hive CLI. Whenever a subgraph's schema changes, it composes again and prints the result.
// 2. Runs Hive Gateway, which serves supergraph.graphql and reloads it when it changes.
//
// When you edit subgraphs.json, both restart. You don't need to change this file.

import { spawn } from "node:child_process";
import { existsSync, readFileSync, watch, writeFileSync } from "node:fs";
import { parse } from "graphql";

const here = new URL(".", import.meta.url).pathname;
const bin = (name) => `${here}node_modules/.bin/${name}`;
const composedFile = ".composed.graphql";
const supergraphFile = `${here}supergraph.graphql`;
const subgraphsFile = `${here}subgraphs.json`;

let composer;
let gateway;

// Retry chatter from the Hive CLI that repeats every second while a subgraph is unreachable.
const noise = /Abort retry|retry limit exceeded|failed with status \d+ \(\d+ms\)|failed \(\d+ms\)/;
let lastLine = "";

// When a subgraph can't be reached, the Hive CLI prints a long error dump. Show one line
// instead, and skip the dump until composing starts again.
const unreachable = /network error occurred|Failed to find any GraphQL type definitions/;
const resumes = /^(ℹ|✔|✖ Local composition failed|Waiting for)/;
let skippingDump = false;

function log(source, line) {
  const plain = line.replace(/\x1b\[[0-9;]*m/g, "").trim();
  if (source === "compose") {
    if (unreachable.test(plain)) {
      if (!skippingDump) say(source, "Can't reach a subgraph right now (it may be restarting). Trying again...");
      skippingDump = true;
      return;
    }
    if (skippingDump && !resumes.test(plain)) return;
    skippingDump = false;
  }
  if (!plain || noise.test(plain)) return;
  say(source, line);
}

function say(source, line) {
  if (line === lastLine) return;
  lastLine = line;
  console.log(`[${source}] ${line}`);
}

function pipe(source, child) {
  for (const stream of [child.stdout, child.stderr]) {
    let buffer = "";
    stream.on("data", (chunk) => {
      buffer += chunk;
      const lines = buffer.split("\n");
      buffer = lines.pop();
      for (const line of lines) log(source, line);
    });
  }
}

function composeArgs() {
  const subgraphs = JSON.parse(readFileSync(subgraphsFile, "utf8"));
  const args = ["dev"];
  for (const [name, url] of Object.entries(subgraphs)) args.push("--service", name, "--url", url);
  return [...args, "--write", composedFile];
}

// Copies a newly composed schema to supergraph.graphql, which the gateway watches.
// The Hive CLI writes to .composed.graphql first, so the gateway never sees a file that's
// still being written, and only a complete, valid schema is copied.
function publish() {
  try {
    const sdl = readFileSync(`${here}${composedFile}`, "utf8");
    parse(sdl);
    if (existsSync(supergraphFile) && readFileSync(supergraphFile, "utf8") === sdl) return;
    writeFileSync(supergraphFile, sdl);
  } catch {
    // Not finished writing yet; the next change will publish it.
  }
}

// Each (re)start gets a new generation number. Processes from an older generation never
// restart themselves, so a restart can't leave two gateways fighting over port 4000.
let generation = 0;

function startComposer(gen) {
  if (gen !== generation) return;
  const child = spawn(bin("hive"), [...composeArgs(), "--watch"], { cwd: here, env: { ...process.env, HIVE_NO_ERROR_TIP: "1" } });
  composer = child;
  pipe("compose", child);
  child.on("exit", () => {
    if (gen !== generation) return;
    setTimeout(async () => {
      await waitForSubgraphs(gen);
      startComposer(gen);
    }, 3000);
  });
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Waits until every subgraph in subgraphs.json answers, so composing doesn't fail
// just because a server is still starting.
async function waitForSubgraphs(gen) {
  let lastMessage = "";
  while (gen === generation) {
    const subgraphs = JSON.parse(readFileSync(subgraphsFile, "utf8"));
    const waiting = [];
    for (const [name, url] of Object.entries(subgraphs)) {
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: '{"query":"{ _service { sdl } }"}',
        });
        const body = await response.json();
        if (!body.data?._service) waiting.push(`${name} to become a subgraph (${url} has no _service field)`);
      } catch {
        waiting.push(`${name} to start (${url})`);
      }
    }
    if (!waiting.length) return;
    const message = `Waiting for ${waiting.join(", and ")}...`;
    if (message !== lastMessage) log("compose", message);
    lastMessage = message;
    await sleep(3000);
  }
}

function startGateway(gen) {
  if (gen !== generation) return;
  const child = spawn(bin("hive-gateway"), ["supergraph", "-c", "gateway.config.ts"], { cwd: here });
  gateway = child;
  pipe("gateway", child);
  child.on("exit", () => {
    if (gen === generation) setTimeout(() => startGateway(gen), 2000);
  });
}

async function composeOnce() {
  const once = spawn(bin("hive"), composeArgs(), { cwd: here, env: { ...process.env, HIVE_NO_ERROR_TIP: "1" } });
  pipe("compose", once);
  const code = await new Promise((resolve) => once.on("exit", resolve));
  if (code === 0) publish();
  if (!existsSync(supergraphFile)) {
    log("compose", "No supergraph yet. Check that every subgraph in subgraphs.json is running, then save subgraphs.json.");
  }
}

async function start() {
  const gen = generation;
  // Serve the last supergraph right away, if there is one.
  if (existsSync(supergraphFile)) startGateway(gen);
  await waitForSubgraphs(gen);
  if (gen !== generation) return;
  await composeOnce();
  if (gen !== generation) return;
  startComposer(gen);
  if (!gateway) startGateway(gen);
}

// Stops this generation's processes, and waits until they've exited.
async function stopAll() {
  generation++;
  const children = [composer, gateway].filter(Boolean);
  composer = undefined;
  gateway = undefined;
  await Promise.all(
    children.map((child) =>
      child.exitCode !== null || child.signalCode !== null
        ? undefined
        : new Promise((resolve) => {
            child.once("exit", resolve);
            child.kill();
          }),
    ),
  );
}

let debounce;
let restartTimer;
let subgraphsText = readFileSync(subgraphsFile, "utf8");

watch(here, (_event, file) => {
  if (file === ".composed.graphql") {
    clearTimeout(debounce);
    debounce = setTimeout(publish, 300);
  }
  if (file === "subgraphs.json") {
    // One save can fire several events. Wait for them to settle, then restart once,
    // and only if the list really changed.
    clearTimeout(restartTimer);
    restartTimer = setTimeout(async () => {
      let text;
      try {
        text = readFileSync(subgraphsFile, "utf8");
        JSON.parse(text);
      } catch {
        log("compose", "subgraphs.json isn't valid JSON yet. Fix it and save again.");
        return;
      }
      if (text === subgraphsText) return;
      subgraphsText = text;
      log("compose", "subgraphs.json changed. Restarting.");
      await stopAll();
      start();
    }, 500);
  }
});

process.on("SIGINT", async () => {
  await stopAll();
  process.exit(0);
});

start();
