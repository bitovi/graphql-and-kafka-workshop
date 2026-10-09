import { GraphQLError } from "graphql";
import { LocalDateResolver } from "graphql-scalars";
import type { User } from "./auth.js";
import { policies, policyholders, savePolicies, type Policy, type Policyholder, type PolicyType, type RiskTier } from "./data.js";
import type { Loaders } from "./loaders.js";

type Context = { user: User | null; loaders: Loaders };
type IssuePolicyInput = Pick<Policy, "type" | "monthlyPremium" | "policyholderId" | "riskTier"> & { effectiveDate?: string };

export const resolvers = {
  LocalDate: LocalDateResolver,

  Query: {
    policies: (_: unknown, args: { type?: PolicyType; riskTier?: RiskTier }) =>
      policies.filter((p) => (!args.type || p.type === args.type) && (!args.riskTier || p.riskTier === args.riskTier)),
    findPolicy: (_: unknown, { by }: { by: { id?: string; policyNumber?: string } }) =>
      policies.find((p) => p.id === by.id || p.policyNumber === by.policyNumber),
    policyholders: () => policyholders,
    policyholder: (_: unknown, args: { id: string }) => policyholders.find((ph) => ph.id === args.id),
  },

  Mutation: {
    issuePolicy: (_: unknown, { input }: { input: IssuePolicyInput }, contextValue: Context) => {
      if (!contextValue.user) {
        throw new GraphQLError("You must be logged in to issue a policy", {
          extensions: { code: "UNAUTHENTICATED", http: { status: 401 } },
        });
      }
      if (contextValue.user.role !== "AGENT") {
        throw new GraphQLError("Only agents can issue policies", { extensions: { code: "FORBIDDEN" } });
      }
      if (!policyholders.some((ph) => ph.id === input.policyholderId)) {
        throw new GraphQLError(`Policyholder ${input.policyholderId} not found`, { extensions: { code: "BAD_USER_INPUT" } });
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
  },

  Policy: {
    // The gateway calls this when another subgraph returns a policy by id.
    __resolveReference: (reference: { id: string }, contextValue: Context) => contextValue.loaders.policy.load(reference.id),
    annualPremium: (policy: Policy) => policy.monthlyPremium * 12,
    policyholder: (policy: Policy, _: unknown, contextValue: Context) => contextValue.loaders.policyholder.load(policy.policyholderId),
  },

  Policyholder: {
    __resolveReference: (reference: { id: string }, contextValue: Context) => contextValue.loaders.policyholder.load(reference.id),
    policies: (policyholder: Policyholder, _: unknown, contextValue: Context) =>
      contextValue.loaders.policiesByPolicyholder.load(policyholder.id),
  },
};
