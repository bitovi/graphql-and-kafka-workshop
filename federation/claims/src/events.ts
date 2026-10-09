// Claim events, in the CloudEvents format: https://cloudevents.io/

import { randomUUID } from "node:crypto";
import type { Claim } from "./data.js";

export type ClaimEventType = "ClaimFiled" | "ClaimApproved";

export interface ClaimEvent {
  specversion: "1.0";
  id: string;
  source: "/claims";
  type: ClaimEventType;
  time: string;
  data: { claimId: string; policyId: string; amount: number };
}

// Builds an event about a claim. Each event gets a new, unique id.
export function claimEvent(type: ClaimEventType, claim: Claim): ClaimEvent {
  return {
    specversion: "1.0",
    id: randomUUID(),
    source: "/claims",
    type,
    time: new Date().toISOString(),
    data: { claimId: claim.id, policyId: claim.policyId, amount: claim.amount },
  };
}
