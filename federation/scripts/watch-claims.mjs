// Subscribes to claimStatusChanged through the gateway, and prints each change as it arrives.
// It uses Server-Sent Events: one HTTP request that the gateway keeps open. Stop it with Ctrl+C.
//
//   npm run watch-claims          every claim
//   npm run watch-claims -- c6    only claim c6

const gateway = process.env.GATEWAY_URL ?? "http://localhost:4000/graphql";
const claimId = process.argv[2];

const query = `subscription WatchClaims($claimId: ID) {
  claimStatusChanged(claimId: $claimId) {
    claimNumber
    status
    policy {
      policyNumber
    }
  }
}`;

const url = new URL(gateway);
url.searchParams.set("query", query);
url.searchParams.set("variables", JSON.stringify({ claimId }));

const response = await fetch(url, { headers: { accept: "text/event-stream" } });
if (!response.ok) {
  console.log(`The gateway answered ${response.status}: ${await response.text()}`);
  process.exit(1);
}
console.log(`Watching ${claimId ? `claim ${claimId}` : "every claim"}. Press Ctrl+C to stop.`);

const decoder = new TextDecoder();
let buffer = "";
for await (const chunk of response.body) {
  buffer += decoder.decode(chunk, { stream: true });
  const lines = buffer.split("\n");
  buffer = lines.pop();
  for (const line of lines) {
    if (!line.startsWith("data:")) continue;
    const result = JSON.parse(line.slice(5));
    if (result.errors) console.log(`Error: ${result.errors[0].message}`);
    const claim = result.data?.claimStatusChanged;
    if (claim) console.log(`${claim.claimNumber} is now ${claim.status} (policy ${claim.policy.policyNumber})`);
  }
}
