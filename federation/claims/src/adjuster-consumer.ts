// Reads the Adjusting team's AdjusterAssigned events from the adjuster-events topic, as the
// `claims` consumer group, and passes each one to handleAdjusterAssigned.

import kafkaJavascript from "@confluentinc/kafka-javascript";
import { onShutdown } from "./shutdown.js";

const { KafkaJS } = kafkaJavascript;

// An AdjusterAssigned event, in the CloudEvents format.
export interface AdjusterAssignedEvent {
  specversion: "1.0";
  id: string;
  source: "/adjusting";
  type: "AdjusterAssigned";
  time: string;
  data: { claimId: string; adjuster: string };
}

// Called once for each AdjusterAssigned event. You'll write this in Consuming Events.
export function handleAdjusterAssigned(event: AdjusterAssignedEvent) {
  console.log(`[adjusting] ${event.data.adjuster} assigned to claim ${event.data.claimId} (event ${event.id})`);
}

export async function startAdjusterConsumer() {
  const brokers = (process.env.KAFKA_BROKERS ?? "localhost:9094").split(",");
  const kafka = new KafkaJS.Kafka({ kafkaJS: { brokers, logLevel: KafkaJS.logLevel.NOTHING } });
  // fromBeginning: the first time this group starts, it reads the topic from the start.
  // After that, it picks up after the last offset it committed.
  // A short session timeout means that if this server stops without leaving the group,
  // Kafka gives its partitions to another member after 6 seconds, not 45.
  const consumer = kafka.consumer({ kafkaJS: { groupId: "claims", fromBeginning: true, sessionTimeout: 6000 } });
  onShutdown(() => consumer.disconnect());

  try {
    await consumer.connect();
    await consumer.subscribe({ topics: ["adjuster-events"] });
    await consumer.run({
      eachMessage: async ({ message }) => {
        if (!message.value) return;
        try {
          const event = JSON.parse(message.value.toString());
          if (event.type === "AdjusterAssigned") handleAdjusterAssigned(event);
        } catch (error) {
          console.error("[adjusting] Skipping an event the Claims API couldn't read:", error);
        }
      },
    });
    console.log("[adjusting] Reading adjuster-events as the claims consumer group");
  } catch {
    console.log("[adjusting] Can't reach Kafka. Restart the Claims API once Kafka is running.");
  }
}
