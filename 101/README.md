# GraphQL 101

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/bitovi/graphql-and-kafka-workshop?devcontainer_path=.devcontainer/101/devcontainer.json)

A single GraphQL service for a fictional insurance company: `services/policies` is an Apollo Server 5 (TypeScript) API with policies and policyholders. Policies and claims are saved to `services/policies/data.json` and `claims.json`, so they survive restarts; `npm run reset-data` restores the starting data.

| File | What it is |
|---|---|
| `services/policies/src/schema.graphql` | The schema: types, enum, input, Query, Mutation |
| `services/policies/src/resolvers.ts` | Functions that produce each field's data |
| `services/policies/src/data.ts` | Starting data, and saving policies and claims |
| `services/policies/src/index.ts` | Server bootstrap |

## Run it

In a Codespace (dependencies are already installed):

```sh
cd services/policies && npm run dev
```

Codespaces forwards port 4001 and opens Apollo Sandbox, an in-browser query editor with schema docs and autocomplete. If it doesn't open, use the **Ports** tab.

Running locally instead:

```sh
# Hot reload
cd services/policies && npm install && npm run dev

# Or in Docker
docker compose up --build
```

Then open http://localhost:4001.

## Things to try

```graphql
# Ask for only the fields you want
{ policies { policyNumber type } }

# Arguments + nested relationships (Policy.policyholder and Policyholder.policies are resolved lazily)
{ policies(type: AUTO) { policyNumber policyholder { name policies { policyNumber } } } }

# Mutations with an input type
mutation {
  issuePolicy(input: { type: HOME, monthlyPremium: 112.0, policyholderId: "ph2" }) {
    id policyNumber effectiveDate
  }
}

# Introspection -- how tooling discovers the schema
{ __schema { types { name } } }
```
