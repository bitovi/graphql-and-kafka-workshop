// Data store for a fictional insurance company.
// Policies are saved to data.json, so they survive server restarts.
// Run `npm run reset-data` to go back to the starting policies below.

import { existsSync, readFileSync, writeFileSync } from "node:fs";

export type PolicyType = "AUTO" | "HOME" | "LIFE" | "RENTERS";
export type RiskTier = "LOW" | "MEDIUM" | "HIGH";

export interface Policyholder {
  id: string;
  name: string;
  email: string;
}

export interface Policy {
  id: string;
  policyNumber: string;
  type: PolicyType;
  monthlyPremium: number;
  effectiveDate: string;
  riskTier?: RiskTier;
  policyholderId: string;
}

export const policyholders: Policyholder[] = [
  { id: "ph1", name: "Maria Alvarez", email: "maria.alvarez@example.com" },
  { id: "ph2", name: "James Okafor", email: "james.okafor@example.com" },
  { id: "ph3", name: "Priya Raman", email: "priya.raman@example.com" },
];

// The starting policies, used when data.json doesn't exist yet.
const seedPolicies: Policy[] = [
  { id: "p1", policyNumber: "AUTO-100001", type: "AUTO", monthlyPremium: 142.5, effectiveDate: "2025-01-15", riskTier: "MEDIUM", policyholderId: "ph1" },
  { id: "p2", policyNumber: "HOME-100002", type: "HOME", monthlyPremium: 98.0, effectiveDate: "2024-06-01", riskTier: "LOW", policyholderId: "ph1" },
  { id: "p3", policyNumber: "AUTO-100003", type: "AUTO", monthlyPremium: 210.75, effectiveDate: "2025-03-10", riskTier: "HIGH", policyholderId: "ph2" },
  { id: "p4", policyNumber: "LIFE-100004", type: "LIFE", monthlyPremium: 45.0, effectiveDate: "2023-11-20", riskTier: "LOW", policyholderId: "ph3" },
  { id: "p5", policyNumber: "RENTERS-100005", type: "RENTERS", monthlyPremium: 18.25, effectiveDate: "2025-08-01", riskTier: "MEDIUM", policyholderId: "ph3" },
];

const dataFile = process.env.DATA_FILE ?? new URL("../data.json", import.meta.url);

function loadPolicies(): Policy[] {
  if (existsSync(dataFile)) {
    return JSON.parse(readFileSync(dataFile, "utf8"));
  }
  return seedPolicies;
}

export const policies: Policy[] = loadPolicies();

// Writes the current policies to data.json. Call this after changing a policy.
export function savePolicies() {
  writeFileSync(dataFile, JSON.stringify(policies, null, 2) + "\n");
}
