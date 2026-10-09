import DataLoader from "dataloader";
import { policies, policyholders } from "./data.js";

export function createLoaders() {
  return {
    policy: new DataLoader(async (ids: readonly string[]) => ids.map((id) => policies.find((p) => p.id === id))),
    policyholder: new DataLoader(async (ids: readonly string[]) => ids.map((id) => policyholders.find((ph) => ph.id === id))),
    policiesByPolicyholder: new DataLoader(async (ids: readonly string[]) =>
      ids.map((id) => policies.filter((p) => p.policyholderId === id)),
    ),
  };
}

export type Loaders = ReturnType<typeof createLoaders>;
