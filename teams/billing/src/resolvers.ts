import { LocalDateResolver } from "graphql-scalars";
import { payouts, type Payout } from "./data.js";

export const resolvers = {
  LocalDate: LocalDateResolver,

  Query: {
    payouts: () => payouts,
  },

  Payout: {
    __resolveReference: (reference: { id: string }) => payouts.find((p) => p.id === reference.id),
    // Billing only knows the policy's id. Returning { id } is enough: the gateway gets the
    // policy's other fields from the Policies subgraph.
    policy: (payout: Payout) => ({ id: payout.policyId }),
  },

  // Billing only knows a policy's id. The gateway asks the Policies subgraph for everything else.
  Policy: {
    __resolveReference: (reference: { id: string }) => ({ id: reference.id }),
    payouts: (policy: { id: string }) => payouts.filter((p) => p.policyId === policy.id),
    totalPaidOut: (policy: { id: string }) =>
      payouts.filter((p) => p.policyId === policy.id).reduce((total, p) => total + p.amount, 0),
  },

  // Version 2 only: the schema declares Claim when BILLING_VERSION is 2.
  Claim: {
    __resolveReference: (reference: { id: string }) => ({ id: reference.id }),
    payout: (claim: { id: string }) => payouts.find((p) => p.claimId === claim.id) ?? null,
  },
};
