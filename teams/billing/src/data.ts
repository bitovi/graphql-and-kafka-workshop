// The Billing team's data. Payouts are saved to payouts.json, so they survive restarts.

import { existsSync, readFileSync, writeFileSync } from "node:fs";

export interface Payout {
  id: string;
  claimId: string;
  policyId: string;
  amount: number;
  paidOn: string;
}

// Payouts for the claims that were already approved when the course starts.
const seedPayouts: Payout[] = [
  { id: "pay1", claimId: "c1", policyId: "p1", amount: 1250.0, paidOn: "2025-04-10" },
  { id: "pay2", claimId: "c3", policyId: "p2", amount: 3800.0, paidOn: "2024-11-20" },
  { id: "pay3", claimId: "c5", policyId: "p3", amount: 975.25, paidOn: "2025-05-20" },
];

const dataFile = process.env.DATA_FILE ?? new URL("../payouts.json", import.meta.url);

export const payouts: Payout[] = existsSync(dataFile) ? JSON.parse(readFileSync(dataFile, "utf8")) : seedPayouts;

export function savePayouts() {
  writeFileSync(dataFile, JSON.stringify(payouts, null, 2) + "\n");
}
