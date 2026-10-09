// The Claims API's database. Claims and the outbox are saved together to claims.json,
// so they survive restarts. Run `npm run reset-data` to go back to the starting data below.

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import type { ClaimEvent } from "./events.js";

export type ClaimStatus = "OPEN" | "APPROVED" | "DENIED";

export interface Claim {
  id: string;
  claimNumber: string;
  amount: number;
  status: ClaimStatus;
  filedDate: string;
  policyId: string;
}

const seedClaims: Claim[] = [
  { id: "c1", claimNumber: "CLM-5001", amount: 1250.0, status: "APPROVED", filedDate: "2025-04-02", policyId: "p1" },
  { id: "c2", claimNumber: "CLM-5002", amount: 430.5, status: "DENIED", filedDate: "2025-06-18", policyId: "p1" },
  { id: "c3", claimNumber: "CLM-5003", amount: 3800.0, status: "APPROVED", filedDate: "2024-11-05", policyId: "p2" },
  { id: "c4", claimNumber: "CLM-5004", amount: 2200.0, status: "OPEN", filedDate: "2025-08-21", policyId: "p3" },
  { id: "c5", claimNumber: "CLM-5005", amount: 975.25, status: "APPROVED", filedDate: "2025-05-09", policyId: "p3" },
  { id: "c6", claimNumber: "CLM-5006", amount: 640.0, status: "OPEN", filedDate: "2025-09-12", policyId: "p5" },
];

const claimsFile = process.env.CLAIMS_FILE ?? new URL("../claims.json", import.meta.url);

function load(): { claims: Claim[]; outbox: ClaimEvent[] } {
  if (!existsSync(claimsFile)) return { claims: seedClaims, outbox: [] };
  const saved = JSON.parse(readFileSync(claimsFile, "utf8"));
  // Files saved before the outbox existed hold just the list of claims.
  return Array.isArray(saved) ? { claims: saved, outbox: [] } : saved;
}

const saved = load();

export const claims: Claim[] = saved.claims;

// Events waiting to be published to Kafka. The outbox relay (outbox-relay.ts) publishes them.
export const outbox: ClaimEvent[] = saved.outbox;

// Writes the claims and the outbox to claims.json, in one write. Call this after changing
// a claim, or adding an event to the outbox.
export function saveClaims() {
  writeFileSync(claimsFile, JSON.stringify({ claims, outbox }, null, 2) + "\n");
}
