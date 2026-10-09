// Plays the rest of the company: every few seconds it files a claim, has the Adjusting team
// assign an adjuster to an open claim, or approves a claim that's in review.
// It talks to the gateway on port 4000, like any app. Stop it with Ctrl+C.
//
//   npm run traffic

import { assign } from "./adjusting.mjs";

const gateway = process.env.GATEWAY_URL ?? "http://localhost:4000/graphql";
const policyIds = ["p1", "p2", "p3", "p4", "p5"];
const pick = (list) => list[Math.floor(Math.random() * list.length)];

async function graphql(query, variables) {
  const response = await fetch(gateway, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  const result = await response.json();
  if (result.errors) throw new Error(result.errors[0].message);
  return result.data;
}

async function step() {
  const { claims } = await graphql("{ claims { id claimNumber status } }");
  const open = claims.filter((c) => c.status === "OPEN");
  const inReview = claims.filter((c) => c.status === "IN_REVIEW");

  const actions = ["file"];
  if (open.length) actions.push("assign", "assign");
  if (inReview.length) actions.push("approve", "approve");
  const action = pick(actions);

  if (action === "file") {
    const amount = Math.round(100 + Math.random() * 4900);
    const { fileClaim } = await graphql(
      "mutation ($input: FileClaimInput!) { fileClaim(input: $input) { claimNumber } }",
      { input: { policyId: pick(policyIds), amount } },
    );
    console.log(`Filed ${fileClaim.claimNumber} for $${amount}`);
  } else if (action === "assign") {
    const claim = pick(open);
    const event = assign(claim.id);
    console.log(`Adjusting assigned ${event.data.adjuster} to ${claim.claimNumber}`);
  } else {
    const claim = pick(inReview);
    await graphql("mutation ($id: ID!) { approveClaim(id: $id) { __typename } }", { id: claim.id });
    console.log(`Approved ${claim.claimNumber}`);
  }
}

console.log(`Sending traffic to ${gateway}. Press Ctrl+C to stop.`);
for (;;) {
  try {
    await step();
  } catch (error) {
    console.log(`Couldn't do that: ${error.message}`);
  }
  await new Promise((resolve) => setTimeout(resolve, 4000));
}
