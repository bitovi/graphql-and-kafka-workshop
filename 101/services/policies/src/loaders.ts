// DataLoaders batch lookups so a field resolver doesn't repeat the same work for
// every item in a list. You'll fill this in during the N+1 and DataLoader lesson.

import DataLoader from "dataloader";
import { policyholders } from "./data.js";

export function createLoaders() {
  return {
    // Add loaders here
  };
}

export type Loaders = ReturnType<typeof createLoaders>;
