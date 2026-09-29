import { GraphQLError } from "graphql";
import {
  claims,
  policies,
  policyholders,
  saveClaims,
  savePolicies,
  type Claim,
  type ClaimStatus,
  type Policy,
  type Policyholder,
  type PolicyType,
  type RiskTier,
} from "./data.js";
import type { Loaders } from "./loaders.js";

type IssuePolicyInput = Pick<Policy, "type" | "monthlyPremium" | "policyholderId" | "riskTier"> & { effectiveDate?: string };
type FileClaimInput = { policyId: string; amount: number };
type Context = { loaders: Loaders };

export const resolvers = {
  Query: {
    policies: (_: unknown, args: { type?: PolicyType; riskTier?: RiskTier }) =>
      policies.filter((p) => {
        if (args.type && p.type !== args.type) return false;
        if (args.riskTier && p.riskTier !== args.riskTier) return false;
        return true;
      }),
    policy: (_: unknown, args: { id: string }) => policies.find((p) => p.id === args.id),
    policyholders: () => policyholders,
    policyholder: (_: unknown, args: { id: string }) => policyholders.find((ph) => ph.id === args.id),
    claims: (_: unknown, args: { status?: ClaimStatus }) =>
      claims.filter((c) => {
        if (args.status && c.status !== args.status) return false;
        return true;
      }),
  },

  Mutation: {
    issuePolicy: (_: unknown, { input }: { input: IssuePolicyInput }) => {
      // Only the resolver can check that the policyholder exists.
      if (!policyholders.some((ph) => ph.id === input.policyholderId)) {
        throw new GraphQLError(`Policyholder ${input.policyholderId} not found`, {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      const n = policies.length + 1;
      const policy: Policy = {
        ...input,
        id: `p${n}`,
        policyNumber: `${input.type}-${100000 + n}`,
        effectiveDate: input.effectiveDate ?? new Date().toISOString().slice(0, 10),
      };

      policies.push(policy);
      savePolicies();
      return policy;
    },

    fileClaim: (_: unknown, { input }: { input: FileClaimInput }) => {
      if (!policies.some((p) => p.id === input.policyId)) {
        throw new GraphQLError(`Policy ${input.policyId} not found`, {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      // Every new claim starts OPEN.
      const n = claims.length + 1;
      const claim: Claim = {
        id: `c${n}`,
        claimNumber: `CLM-${5000 + n}`,
        amount: input.amount,
        status: "OPEN",
        filedDate: new Date().toISOString().slice(0, 10),
        policyId: input.policyId,
      };

      claims.push(claim);
      saveClaims();
      return claim;
    },
  },

  // Field resolvers: GraphQL calls these only when a query asks for the field.
  Policy: {
    policyholder: (policy: Policy, _: unknown, contextValue: Context) =>
      contextValue.loaders.policyholder.load(policy.policyholderId),
    annualPremium: (policy: Policy) => policy.monthlyPremium * 12,
    claims: (policy: Policy, _: unknown, contextValue: Context) => contextValue.loaders.claimsByPolicy.load(policy.id),
    totalClaimed: (policy: Policy) => {
      // Add up the amounts of this policy's approved claims
      let total = 0;
      for (const claim of claims) {
        if (claim.policyId === policy.id && claim.status === "APPROVED") {
          total = total + claim.amount;
        }
      }
      return total;
    },
  },
  Policyholder: {
    policies: (policyholder: Policyholder, _: unknown, contextValue: Context) =>
      contextValue.loaders.policiesByPolicyholder.load(policyholder.id),
  },
  Claim: {
    policy: (claim: Claim) => policies.find((p) => p.id === claim.policyId),
  },
};
