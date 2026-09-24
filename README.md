# federate-graphql-on-kube

Exploring GraphQL, working toward Apollo Federation on Kubernetes.

## Stage 1: a single GraphQL service

`services/library` is an Apollo Server 5 (TypeScript) API with books and authors held in memory.

| File | What it is |
|---|---|
| `src/schema.graphql` | The schema: types, enum, input, Query, Mutation |
| `src/resolvers.ts` | Functions that produce each field's data |
| `src/data.ts` | In-memory data (resets on restart) |
| `src/index.ts` | Server bootstrap |

### Run it

```sh
# In Docker
docker compose up --build

# Or with hot reload
cd services/library && npm install && npm run dev
```

Open http://localhost:4001 in a browser to get Apollo Sandbox, an in-browser query editor with schema docs and autocomplete.

### Things to try

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

## Next stages

1. Split into subgraphs (`authors`, `books`) with `@apollo/subgraph` and put Apollo Gateway in front
2. Run the subgraphs and the gateway together with Docker Compose
3. Deploy to Kubernetes (kind)
