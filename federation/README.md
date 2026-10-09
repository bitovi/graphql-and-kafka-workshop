# Federated GraphQL + Kafka

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/bitovi/graphql-and-kafka-workshop?devcontainer_path=.devcontainer/federation/devcontainer.json)

You own the Claims API. The other teams' APIs, Kafka, and the Claims Desk run in Docker.

| What | Where | Port | Yours to edit? |
|---|---|---|---|
| Your Claims API | `claims/` | 4002 | Yes |
| Hive Gateway | `gateway/` | 4000 | Yes, `subgraphs.json` |
| Policies subgraph | Docker | 4001 | No |
| Billing subgraph | Docker | 4003 | No |
| Claims Desk (web app) | Docker | 3000 | No |
| Kafka | Docker | 9094 | No |

## Start everything

Use three terminals, all starting in this folder. The first two run these, and the third is for other commands:

```sh
npm start                     # Kafka, Policies, Billing, the Claims Desk, then the gateway
cd claims && npm run dev      # your Claims API
```

`npm start` also combines the subgraphs' schemas into `gateway/supergraph.graphql`, and does it again whenever a subgraph's schema changes. The gateway reloads the new supergraph on its own. Your Claims API restarts when you save its code.

Then open the **Ports** tab: **Gateway** (4000) for queries, **Claims Desk** (3000) for the app.

## Other commands

Run these in the third terminal:

| Command | What it does |
|---|---|
| `npm run topics` | Lists the Kafka topics |
| `npm run consumer-groups` | Shows each consumer group's place in each partition |
| `npm run claim-events` | Prints the events in `claim-events`, one partition at a time |
| `npm run billing:ship-v2` | Ships version 2 of the Billing subgraph |
| `npm run adjuster:assign -- c6` | The Adjusting team assigns an adjuster to claim `c6` |
| `npm run adjuster:replay -- c6` | Sends claim `c6`'s adjuster events again, with the same ids |
| `npm run watch-claims` | Prints claim status changes as they happen, through the gateway |
| `npm run traffic` | Files, assigns, and approves claims every few seconds, until Ctrl+C |

## Stop or start over

```sh
npm run stop                  # stops the Docker services and deletes Kafka's data
rm -f .env                    # goes back to Billing version 1, after npm run billing:ship-v2
cd claims && npm run reset-data
```
