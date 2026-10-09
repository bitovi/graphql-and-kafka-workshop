import { GraphQLError, GraphQLScalarType } from "graphql";
import { LocalDateResolver } from "graphql-scalars";
import type { User } from "./auth.js";
import { claims, saveClaims, type Claim, type ClaimStatus } from "./data.js";
import { paginate } from "./pagination.js";

export type Context = { user: User | null };

export const resolvers = {
  LocalDate: new GraphQLScalarType({
    ...LocalDateResolver.toConfig(),
    specifiedByURL: "https://www.rfc-editor.org/rfc/rfc3339#section-5.6",
  }),

  Query: {
    claims: (_: unknown, args: { status?: ClaimStatus }) => claims.filter((c) => !args.status || c.status === args.status),
    claim: (_: unknown, args: { id: string }) => claims.find((c) => c.id === args.id),
    claimsConnection: (_: unknown, args: { first: number; after?: string }) => paginate(claims, args),
  },

  Mutation: {
    fileClaim: (_: unknown, { input }: { input: { policyId: string; amount: number } }) => {
      // Claims doesn't store policies anymore, so it can't check here that the policy exists.
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

    approveClaim: (_: unknown, { id }: { id: string }) => {
      const claim = claims.find((c) => c.id === id);
      if (!claim) {
        throw new GraphQLError(`Claim ${id} not found`, { extensions: { code: "BAD_USER_INPUT" } });
      }
      if (claim.status !== "OPEN") {
        return { __typename: "ClaimNotOpen", message: `Claim ${id} is ${claim.status}, so it can't be approved`, status: claim.status };
      }
      claim.status = "APPROVED";
      saveClaims();
      return { __typename: "Claim", ...claim };
    },
  },
};
