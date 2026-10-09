// The outbox relay. Every second, it publishes the events waiting in the outbox to the
// claim-events topic, oldest first, and removes each one once Kafka has accepted it.
// If Kafka can't be reached, the events stay in the outbox until it can.

import kafkaJavascript from "@confluentinc/kafka-javascript";
import { outbox, saveClaims } from "./data.js";

const { KafkaJS } = kafkaJavascript;

const brokers = (process.env.KAFKA_BROKERS ?? "localhost:9094").split(",");
const kafka = new KafkaJS.Kafka({ kafkaJS: { brokers, connectionTimeout: 3000, logLevel: KafkaJS.logLevel.NOTHING } });

let producer: ReturnType<typeof kafka.producer> | null = null;

// Fails if the operation takes longer than ms, so a down Kafka doesn't leave the relay waiting.
function withTimeout<T>(operation: Promise<T>, ms: number): Promise<T> {
  return Promise.race([operation, new Promise<T>((_, reject) => setTimeout(() => reject(new Error("timed out")), ms))]);
}
let kafkaWasDown = false;

async function publishWaitingEvents() {
  if (outbox.length === 0) return;
  try {
    if (!producer) {
      // The Kafka client drops a message it can't deliver within 5 seconds. The relay waits a
      // little longer than that, so a send it gives up on is never delivered later.
      producer = kafka.producer({ "message.timeout.ms": 5000, kafkaJS: { acks: -1 } });
      await withTimeout(producer.connect(), 5000);
    }
    while (outbox.length > 0) {
      const event = outbox[0];
      await withTimeout(producer.send({
        topic: "claim-events",
        messages: [
          {
            // Keyed by claim, so all of one claim's events stay in order.
            key: event.data.claimId,
            value: JSON.stringify(event),
            headers: { "content-type": "application/cloudevents+json" },
          },
        ],
      }), 6000);
      // Kafka has the event, so it can leave the outbox.
      outbox.shift();
      saveClaims();
      console.log(`[outbox] Published ${event.type} for claim ${event.data.claimId} (event ${event.id})`);
    }
    kafkaWasDown = false;
  } catch {
    if (!kafkaWasDown) {
      console.log(`[outbox] Can't reach Kafka. ${outbox.length} event(s) waiting in the outbox.`);
    }
    kafkaWasDown = true;
    producer?.disconnect().catch(() => {});
    producer = null;
  }
}

export function startOutboxRelay() {
  let running = false;
  setInterval(async () => {
    if (running) return;
    running = true;
    await publishWaitingEvents();
    running = false;
  }, 1000);
}
