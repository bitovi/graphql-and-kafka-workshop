// Billing reads claim events from Kafka and records a payout for every approved claim.
// Events are CloudEvents in structured mode: the whole envelope is the JSON message value.

import kafkaJavascript from "@confluentinc/kafka-javascript";
import { payouts, savePayouts } from "./data.js";

const { KafkaJS } = kafkaJavascript;

interface ClaimEvent {
  id: string;
  type: string;
  data: { claimId: string; policyId: string; amount: number };
}

export function handleClaimEvent(event: ClaimEvent) {
  if (event.type !== "ClaimApproved") return;
  // A claim is paid once, even if its ClaimApproved event arrives more than once.
  if (payouts.some((p) => p.claimId === event.data.claimId)) return;
  const payout = {
    id: `pay${payouts.length + 1}`,
    claimId: event.data.claimId,
    policyId: event.data.policyId,
    amount: event.data.amount,
    paidOn: new Date().toISOString().slice(0, 10),
  };
  payouts.push(payout);
  savePayouts();
  console.log(`Recorded payout ${payout.id} of $${payout.amount} for claim ${payout.claimId}`);
}

export async function startConsumer() {
  const brokers = (process.env.KAFKA_BROKERS ?? "localhost:9092").split(",");
  const kafka = new KafkaJS.Kafka({ kafkaJS: { brokers, logLevel: KafkaJS.logLevel.NOTHING } });
  const consumer = kafka.consumer({ kafkaJS: { groupId: "billing", fromBeginning: true } });

  await consumer.connect();
  await consumer.subscribe({ topics: ["claim-events"] });
  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) return;
      try {
        handleClaimEvent(JSON.parse(message.value.toString()));
      } catch (error) {
        console.error("Skipping a claim event Billing couldn't read:", error);
      }
    },
  });
  console.log(`Billing is reading claim-events from ${brokers.join(",")}`);
}
