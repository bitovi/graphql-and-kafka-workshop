// The Adjusting team's script. It assigns adjusters to claims by sending AdjusterAssigned
// events to the adjuster-events topic, keyed by claim id.
//
//   npm run adjuster:assign -- c6     assign an adjuster to claim c6
//   npm run adjuster:replay           send every event this script has sent again, unchanged
//   npm run adjuster:replay -- c6     send claim c6's events again, unchanged
//
// It remembers what it sent in scripts/.adjusting-sent.json, so it can replay it.

import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const here = new URL(".", import.meta.url).pathname;
const sentFile = `${here}.adjusting-sent.json`;
const adjusters = ["Dana Kim", "Luis Ortega", "Amara Nwosu"];

const sent = existsSync(sentFile) ? JSON.parse(readFileSync(sentFile, "utf8")) : [];

// Sends events with Kafka's console producer, inside the Kafka container.
export function send(events) {
  const lines = events.map((event) => `${event.data.claimId}|${JSON.stringify(event)}`).join("\n") + "\n";
  const result = spawnSync(
    "docker",
    [
      "compose", "exec", "-T", "kafka", "/opt/kafka/bin/kafka-console-producer.sh",
      "--bootstrap-server", "kafka:9092", "--topic", "adjuster-events",
      "--reader-property", "parse.key=true", "--reader-property", "key.separator=|",
    ],
    { cwd: `${here}..`, input: lines, encoding: "utf8" },
  );
  if (result.status !== 0) {
    console.error(result.stderr || "Couldn't send to Kafka. Is npm start running?");
    process.exit(1);
  }
}

// Each claim always gets the same adjuster, unless you name one.
const adjusterFor = (claimId) => adjusters[[...claimId].reduce((sum, c) => sum + c.charCodeAt(0), 0) % adjusters.length];

export function assign(claimId, adjuster = adjusterFor(claimId)) {
  const event = {
    specversion: "1.0",
    id: randomUUID(),
    source: "/adjusting",
    type: "AdjusterAssigned",
    time: new Date().toISOString(),
    data: { claimId, adjuster },
  };
  send([event]);
  sent.push(event);
  writeFileSync(sentFile, JSON.stringify(sent, null, 2) + "\n");
  return event;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [command, claimId, ...name] = process.argv.slice(2);
  if (command === "assign" && claimId) {
    const event = assign(claimId, name.length ? name.join(" ") : undefined);
    console.log(`Assigned ${event.data.adjuster} to claim ${claimId} (event ${event.id})`);
  } else if (command === "replay") {
    const events = claimId ? sent.filter((event) => event.data.claimId === claimId) : sent;
    if (!events.length) {
      console.log("No events to replay yet. Assign an adjuster first.");
    } else {
      send(events);
      console.log(`Sent ${events.length} event(s) again, with the same ids:`);
      for (const event of events) console.log(`  ${event.data.adjuster} assigned to claim ${event.data.claimId} (event ${event.id})`);
    }
  } else {
    console.log("Usage: npm run adjuster:assign -- <claim id>   or   npm run adjuster:replay [-- <claim id>]");
  }
}
