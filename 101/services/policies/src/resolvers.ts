import { GraphQLError } from "graphql";
import { policies, policyholders, type Policy, type Policyholder, type PolicyType } from "./data.js";

type IssuePolicyInput = Pick<Policy, "type" | "monthlyPremium" | "policyholderId"> & { effectiveDate?: string };

export const resolvers = {
  Query: {
    policies: (_: unknown, args: { type?: PolicyType }) =>
      args.type ? policies.filter((p) => p.type === args.type) : policies,
    policy: (_: unknown, args: { id: string }) => policies.find((p) => p.id === args.id),
    policyholders: () => policyholders,
    policyholder: (_: unknown, args: { id: string }) => policyholders.find((ph) => ph.id === args.id),
  },

  Mutation: {
    issuePolicy: (_: unknown, { input }: { input: IssuePolicyInput }) => {
      // 1. Check the input. The schema confirms policyholderId is an ID,
      //    but only the resolver can check that the policyholder exists.
      if (!policyholders.some((ph) => ph.id === input.policyholderId)) {
        throw new GraphQLError(`Policyholder ${input.policyholderId} not found`, {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      // 2. Fill in server-generated values. The client never chooses the
      //    id or policyNumber, and effectiveDate defaults to today.
      const n = policies.length + 1;
      const policy: Policy = {
        ...input,
        id: `p${n}`,
        policyNumber: `${input.type}-${100000 + n}`,
        effectiveDate: input.effectiveDate ?? new Date().toISOString().slice(0, 10),
      };

      // 3. Save the policy by adding it to the in-memory list.
      policies.push(policy);

      // 4. Return the new policy. GraphQL then resolves whatever fields
      //    the mutation selected (policyNumber, policyholder, ...).
      return policy;
    },
  },

  // Field resolvers: GraphQL calls these only when a query asks for the field.
  Policy: {
    policyholder: (policy: Policy) => policyholders.find((ph) => ph.id === policy.policyholderId),
  },
  Policyholder: {
    policies: (policyholder: Policyholder) => policies.filter((p) => p.policyholderId === policyholder.id),
  },
};
