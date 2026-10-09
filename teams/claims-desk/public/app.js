// The Claims Desk asks the gateway what the graph can answer, then builds one query from it.
// As more subgraphs join the graph, the same page shows more. It refreshes every 5 seconds.

const REFRESH_MS = 5000;

async function graphql(query, variables) {
  const response = await fetch("/graphql", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  return response.json();
}

// Which fields does the gateway's Policy type have, and what do they return?
async function inspectGraph() {
  const result = await graphql(`{
    __type(name: "Policy") {
      fields { name args { name } type { kind name ofType { kind name ofType { kind name } } } }
    }
    __schema { queryType { fields { name } } }
  }`);
  if (result.errors) throw new Error(result.errors[0].message);
  const fields = new Map((result.data.__type?.fields ?? []).map((f) => [f.name, f]));
  const claimsField = fields.get("claims");
  const namedType = (t) => (t.name ? t.name : namedType(t.ofType));
  const queryFields = new Set(result.data.__schema.queryType.fields.map((f) => f.name));
  return {
    claimsInGraph: queryFields.has("claims"),
    payouts: fields.has("payouts"),
    claims: Boolean(claimsField),
    claimsIsConnection: claimsField ? namedType(claimsField.type).endsWith("Connection") : false,
    claimsTakesFirst: claimsField ? claimsField.args.some((a) => a.name === "first") : false,
  };
}

function buildQuery(graph) {
  const claimFields = "id claimNumber amount status";
  let claims = "";
  if (graph.claims) {
    const args = graph.claimsTakesFirst ? "(first: 20)" : "";
    claims = graph.claimsIsConnection ? `claims${args} { edges { node { ${claimFields} } } }` : `claims${args} { ${claimFields} }`;
  }
  const payouts = graph.payouts ? "totalPaidOut payouts { claimId amount }" : "";
  return `query ClaimsDesk {
    policies { id policyNumber type annualPremium policyholder { name } ${payouts} ${claims} }
  }`;
}

const money = (n) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });
const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

function renderSources(graph) {
  const chips = [
    { label: "Policies team: policies", on: true },
    { label: "Billing team: payouts", on: graph.payouts },
    {
      label: graph.claims
        ? "Your Claims API: claims on every policy"
        : graph.claimsInGraph
          ? "Your Claims API: in the graph, not linked to policies yet"
          : "Your Claims API: not in the graph yet",
      on: graph.claimsInGraph,
    },
  ];
  document.getElementById("sources").innerHTML = chips
    .map((c) => `<span class="source ${c.on ? "on" : ""}">${escapeHtml(c.label)}</span>`)
    .join("");
}

const lastStatus = new Map();

function renderPolicies(graph, policies) {
  const rows = policies.map((p) => {
    let claimsCell = graph.claimsInGraph
      ? '<span class="waiting">Waiting for claims to be linked to policies</span>'
      : '<span class="waiting">Waiting for the Claims API</span>';
    if (graph.claims) {
      const claims = graph.claimsIsConnection ? p.claims.edges.map((e) => e.node) : p.claims;
      claimsCell = claims.length
        ? claims
            .map((c) => {
              const changed = lastStatus.has(c.id) && lastStatus.get(c.id) !== c.status;
              lastStatus.set(c.id, c.status);
              return `<div class="claim ${changed ? "flash" : ""}">
                <span class="claim-number">${escapeHtml(c.claimNumber)}</span>
                <span>${money(c.amount)}</span>
                <span class="status ${escapeHtml(c.status)}">${escapeHtml(c.status)}</span>
              </div>`;
            })
            .join("")
        : '<span class="sub">No claims</span>';
    }
    const paidOut = graph.payouts ? money(p.totalPaidOut) : "";
    return `<tr>
      <td><div class="policy-number">${escapeHtml(p.policyNumber)}</div><div class="sub">${escapeHtml(p.type)}</div></td>
      <td>${escapeHtml(p.policyholder.name)}</td>
      <td class="num">${money(p.annualPremium)}</td>
      <td>${claimsCell}</td>
      <td class="num">${paidOut}</td>
    </tr>`;
  });
  document.querySelector("#policies tbody").innerHTML = rows.join("");
  document.getElementById("policies").hidden = false;
}

function showError(message) {
  const el = document.getElementById("error");
  el.textContent = message;
  el.hidden = !message;
}

async function refresh() {
  try {
    const graph = await inspectGraph();
    renderSources(graph);
    const result = await graphql(buildQuery(graph));
    if (result.errors && !result.data) {
      showError(`The gateway rejected the Claims Desk's query: ${result.errors[0].message}`);
      document.getElementById("policies").hidden = true;
      return;
    }
    renderPolicies(graph, result.data.policies);
    showError(result.errors ? `Some data is missing: ${result.errors[0].message}` : "");
    document.getElementById("updated").textContent = `Updated ${new Date().toLocaleTimeString()}`;
  } catch (error) {
    showError(`Can't load data from the gateway: ${error.message}. Is the gateway running on port 4000?`);
  }
}

refresh();
setInterval(refresh, REFRESH_MS);
