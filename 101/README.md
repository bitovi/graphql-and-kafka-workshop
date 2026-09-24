# GraphQL 101

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/bitovi/graphql-and-kafka-workshop?devcontainer_path=.devcontainer/101/devcontainer.json)

A single GraphQL service: `services/library` is an Apollo Server 5 (TypeScript) API with books and authors held in memory.

| File | What it is |
|---|---|
| `services/library/src/schema.graphql` | The schema: types, enum, input, Query, Mutation |
| `services/library/src/resolvers.ts` | Functions that produce each field's data |
| `services/library/src/data.ts` | In-memory data (resets on restart) |
| `services/library/src/index.ts` | Server bootstrap |

## Run it

In a Codespace (dependencies are already installed):

```sh
cd services/library && npm run dev
```

Codespaces forwards port 4001 and opens Apollo Sandbox, an in-browser query editor with schema docs and autocomplete. If it doesn't open, use the **Ports** tab.

Running locally instead:

```sh
# Hot reload
cd services/library && npm install && npm run dev

# Or in Docker
docker compose up --build
```

Then open http://localhost:4001.

## Things to try

```graphql
# Ask for only the fields you want
{ books { title } }

# Arguments + nested relationships (Book.author and Author.books are resolved lazily)
{ books(genre: SCIENCE_FICTION) { title author { name books { title } } } }

# Mutations with an input type
mutation {
  addBook(input: { title: "Parable of the Sower", year: 1993, genre: SCIENCE_FICTION, authorId: "a3" }) {
    id title
  }
}

# Introspection -- how tooling discovers the schema
{ __schema { types { name } } }
```
