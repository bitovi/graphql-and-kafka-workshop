# GraphQL 102

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/bitovi/graphql-and-kafka-workshop?devcontainer_path=.devcontainer/102/devcontainer.json)

GraphQL 102 starts where 101 ends. `services/policies` is the 101 Apollo Server 5 (TypeScript) API for a fictional insurance company, with every 101 exercise already done: policies, policyholders, and claims, batched with DataLoader. Policies and claims are saved to `services/policies/data.json` and `claims.json`, so they survive restarts; `npm run reset-data` restores the starting data.

| File | What it is |
|---|---|
| `services/policies/src/schema.graphql` | The schema: types, enums, inputs, Query, Mutation |
| `services/policies/src/resolvers.ts` | Functions that produce each field's data |
| `services/policies/src/loaders.ts` | DataLoaders that batch lookups for nested fields |
| `services/policies/src/auth.ts` | Fake tokens and users for the Authorization lesson |
| `services/policies/src/data.ts` | Starting data, and saving policies and claims |
| `services/policies/src/index.ts` | Server bootstrap |

## Run it

In a Codespace (dependencies are already installed):

```sh
cd services/policies && npm run dev
```

Codespaces forwards port 4001 and opens Apollo Sandbox. If it doesn't open, use the **Ports** tab.

Running locally instead:

```sh
# Hot reload
cd services/policies && npm install && npm run dev

# Or in Docker
docker compose up --build
```

Then open http://localhost:4001.
