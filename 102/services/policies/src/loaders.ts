// DataLoaders batch lookups so a field resolver doesn't repeat the same work for
// every item in a list. Resolvers reach them through contextValue.loaders.

import DataLoader from "dataloader";
import { claims, policies, policyholders } from "./data.js";

export function createLoaders() {
  return {
    // Loads many policyholders at once, by id
    policyholder: new DataLoader(async (ids: readonly string[]) =>
      // DataLoader needs one result per id, in the same order as ids
      ids.map((id) => policyholders.find((ph) => ph.id === id)),
    ),

    // Loads the policies for many policyholders at once, by policyholder id
    policiesByPolicyholder: new DataLoader(async (policyholderIds: readonly string[]) =>
      policyholderIds.map((id) => policies.filter((p) => p.policyholderId === id)),
    ),

    // Loads the claims for many policies at once, by policy id
    claimsByPolicy: new DataLoader(async (policyIds: readonly string[]) =>
      policyIds.map((id) => claims.filter((c) => c.policyId === id)),
    ),
  };
}

export type Loaders = ReturnType<typeof createLoaders>;
