// Feeds the claimStatusChanged subscription from Kafka.
//
// Every copy of the Claims API reads claim-events with a consumer group of its own, so every
// copy sees every status change, wherever it happened. Each copy then passes the change to its
// own subscribers through `pubsub`, which only works inside one process.

import { randomUUID } from "node:crypto";
import kafkaJavascript from "@confluentinc/kafka-javascript";
import { PubSub } from "graphql-subscriptions";
import { claims } from "./data.js";
import type { ClaimEvent } from "./events.js";
import { onShutdown } from "./shutdown.js";

const { KafkaJS } = kafkaJavascript;

// The subscription resolver listens here. The trigger name is CLAIM_STATUS_CHANGED.
export const pubsub = new PubSub();

export async function startLiveUpdates() {
  const brokers = (process.env.KAFKA_BROKERS ?? "localhost:9094").split(",");
  const kafka = new KafkaJS.Kafka({ kafkaJS: { brokers, logLevel: KafkaJS.logLevel.NOTHING } });
  // A group of its own for each copy of the API. It only needs new events, so it doesn't
  // keep a place in the topic: fromBeginning is false, and nothing is committed.
  const consumer = kafka.consumer({
    kafkaJS: { groupId: `claims-live-${randomUUID()}`, fromBeginning: false, autoCommit: false, sessionTimeout: 6000 },
  });
  onShutdown(() => consumer.disconnect());

  try {
    await consumer.connect();
    await consumer.subscribe({ topics: ["claim-events"] });
    await consumer.run({
      eachMessage: async ({ message }) => {
        if (!message.value) return;
        const event: ClaimEvent = JSON.parse(message.value.toString());
        if (event.type !== "ClaimStatusChanged") return;
        const claim = claims.find((c) => c.id === event.data.claimId);
        if (!claim) return;
        console.log(`[live] Claim ${claim.id} is now ${claim.status}`);
        await pubsub.publish("CLAIM_STATUS_CHANGED", { claimStatusChanged: claim });
      },
    });
    console.log("[live] Reading claim-events for live updates");
  } catch {
    console.log("[live] Can't reach Kafka. Restart the Claims API once Kafka is running.");
  }
}
