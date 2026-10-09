# GraphQL & Kafka Workshop

Hands-on material for Bitovi's GraphQL and Kafka trainings. Each training has its own folder and its own GitHub Codespace.

| Training | Folder | Codespace |
|---|---|---|
| GraphQL 101: queries, mutations, schemas, and resolvers | [`101/`](101/) | [![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/bitovi/graphql-and-kafka-workshop?devcontainer_path=.devcontainer/101/devcontainer.json) |
| GraphQL 102: getting the API ready for real users | [`102/`](102/) | [![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/bitovi/graphql-and-kafka-workshop?devcontainer_path=.devcontainer/102/devcontainer.json) |
| Federated GraphQL + Kafka: one Claims API among several teams' APIs, connected by events | [`federation/`](federation/) | [![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/bitovi/graphql-and-kafka-workshop?devcontainer_path=.devcontainer/federation/devcontainer.json) |

Codespace configurations live in `.devcontainer/<training>/devcontainer.json`. Each one opens its training's folder.

`teams/` holds the source of the other teams' services in Federated GraphQL + Kafka. Learners use them through Docker, not by editing them.
