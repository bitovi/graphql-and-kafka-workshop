// Data store for a fictional insurance company.
// Policies are saved to data.json and claims to claims.json, so they survive server restarts.
// Run `npm run reset-data` to go back to the starting data below.

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

export type ClaimStatus = "OPEN" | "APPROVED" | "DENIED";

export interface Claim {
  id: string;
  claimNumber: string;
  amount: number;
  status: ClaimStatus;
  filedDate: string;
  policyId: string;
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

// The starting claims, used when claims.json doesn't exist yet.
const seedClaims: Claim[] = [
  { id: "c1", claimNumber: "CLM-5001", amount: 1250.0, status: "APPROVED", filedDate: "2025-04-02", policyId: "p1" },
  { id: "c2", claimNumber: "CLM-5002", amount: 430.5, status: "DENIED", filedDate: "2025-06-18", policyId: "p1" },
  { id: "c3", claimNumber: "CLM-5003", amount: 3800.0, status: "APPROVED", filedDate: "2024-11-05", policyId: "p2" },
  { id: "c4", claimNumber: "CLM-5004", amount: 2200.0, status: "OPEN", filedDate: "2025-08-21", policyId: "p3" },
  { id: "c5", claimNumber: "CLM-5005", amount: 975.25, status: "APPROVED", filedDate: "2025-05-09", policyId: "p3" },
  { id: "c6", claimNumber: "CLM-5006", amount: 640.0, status: "OPEN", filedDate: "2025-09-12", policyId: "p5" },
];

const claimsFile = process.env.CLAIMS_FILE ?? new URL("../claims.json", import.meta.url);

function loadClaims(): Claim[] {
  if (existsSync(claimsFile)) {
    return JSON.parse(readFileSync(claimsFile, "utf8"));
  }
  return seedClaims;
}

export const claims: Claim[] = loadClaims();

// Writes the current claims to claims.json. Call this after changing a claim.
export function saveClaims() {
  writeFileSync(claimsFile, JSON.stringify(claims, null, 2) + "\n");
}
