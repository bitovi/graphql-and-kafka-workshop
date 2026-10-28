# REST vs GraphQL comparison demo

Supporting material for the short GraphQL 101 video: *the same screen's data, fetched two ways*.

It exists because of feedback from the Oct 27 dry run — several people said the course jumps into schema structuring before making the case for why GraphQL is worth the extra work. This demo makes that case in under three minutes, with both sides actually running.

## What's here

`src/rest-demo.ts` is a conventional REST API over the **same data** the GraphQL server uses. One resource per URL, server-decided response shape, related data behind its own request. It's deliberately not a strawman — it's what a reasonable REST API of this shape looks like.

## Running both sides

Two terminals, from `101/services/policies`:

```shell
npm run dev        # GraphQL  → http://localhost:4001
npm run rest-demo  # REST     → http://localhost:4002
```

## The scenario

A screen lists every policy with its policyholder's name. Two fields per row: `policyNumber`, and the holder's `name`.

### The REST path — 4 requests

```shell
curl -s localhost:4002/policies
curl -s localhost:4002/policyholders/ph1
curl -s localhost:4002/policyholders/ph2
curl -s localhost:4002/policyholders/ph3
```

`/policies` returns every field of every policy — including `riskTier`, `effectiveDate`, `monthlyPremium`, none of which the screen uses — and the owner only as a `policyholderId`. Resolving three distinct ids means three more round trips, then the client joins them itself.

### The GraphQL path — 1 request

```shell
curl -s localhost:4001/ -H 'Content-Type: application/json' \
  -d '{"query":"{ policies { policyNumber policyholder { name } } }"}'
```

Returns exactly the two fields per row, already joined.

### Measured on the starting data

| | Requests | Bytes returned |
|---|---|---|
| REST | 4 | 1231 |
| GraphQL | 1 | 377 |

That's a quarter of the requests and roughly a third of the bytes. Re-measure before recording if the data has changed:

```shell
R=$(( $(curl -s localhost:4002/policies | wc -c) \
    + $(curl -s localhost:4002/policyholders/ph1 | wc -c) \
    + $(curl -s localhost:4002/policyholders/ph2 | wc -c) \
    + $(curl -s localhost:4002/policyholders/ph3 | wc -c) ))
G=$(curl -s localhost:4001/ -H 'Content-Type: application/json' \
    -d '{"query":"{ policies { policyNumber policyholder { name } } }"}' | wc -c)
echo "REST: $R bytes / 4 calls — GraphQL: $G bytes / 1 call"
```

---

## Recording script

**Target: 2:45.** Narration is ~400 words. Two terminal panes side by side, REST left, GraphQL right, font large enough to read at 1080p.

### 0:00 – 0:18 — The task

> Here's a screen from an insurance app. Every policy, with the name of the person who owns it. Two pieces of information per row. Let's fetch that twice — once from a REST API, once from GraphQL — against the same data.

*Screen: the scenario, two fields highlighted. Both terminals idle.*

### 0:18 – 1:05 — REST

> REST first. I ask for the policies.

*Run `curl -s localhost:4002/policies`. Let the full response scroll.*

> I got all five, and every field of each one. Risk tier, effective date, monthly premium — the screen doesn't use any of that. And the owner is here only as an id: `policyholderId: ph1`. No name.
>
> So the name costs another request. Three distinct owners across these five policies, so three more.

*Run the three `policyholders` calls in sequence. Pause on the third.*

> Four requests, and the client still has to join them together itself.

### 1:05 – 1:50 — GraphQL

> Same data, GraphQL. One endpoint, and I describe what I want.

*Switch to the right pane. Type the query so the shape is visible, then run it.*

> I asked for `policyNumber`, and inside each policy, the policyholder's `name`.

*Response appears.*

> That's it. One request. Exactly the two fields, already joined. The response has the same shape as the query — which is the thing to notice: I described the result I wanted, and that's what came back.

### 1:50 – 2:25 — The numbers, honestly

*Show the comparison table.*

> Four requests down to one. About twelve hundred bytes down to under four hundred.
>
> Now the honest part. A well-designed REST API can narrow this gap — specs like JSON:API let clients ask for sparse fields and include related resources. If that's all you need, you may not need GraphQL.

### 2:25 – 2:45 — Where it actually wins

> Where this becomes hard to argue with is when the data lives behind *many* services. One query, one graph, and the client never knows how many backends answered it. That's federation, and it's built on exactly the mechanics you just saw.
>
> That's what GraphQL 101 teaches — on one small service, so the ideas are clear before the architecture gets big.

---

## Recording notes

- Run `npm run reset-data` before recording so the byte counts match the table.
- Pre-type the GraphQL query in the right pane and clear it, so the on-camera typing is clean.
- The over-fetching point lands hardest if the `/policies` response is visibly long — don't pipe it through `head`.
- Keep the 1:50–2:25 caveat in. The dry-run feedback was specifically that the course oversells GraphQL before establishing the baseline; cutting the caveat recreates that problem in video form.
