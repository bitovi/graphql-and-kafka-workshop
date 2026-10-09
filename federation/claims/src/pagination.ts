// Turns a list into one page of a connection: edges with cursors, plus pageInfo.
// Cursors are base64-encoded ids, so YzI= means "after c2".

import { GraphQLError } from "graphql";

const toCursor = (id: string) => Buffer.from(id, "utf8").toString("base64");

export function paginate<T extends { id: string }>(items: T[], args: { first: number; after?: string }) {
  if (args.first < 1 || args.first > 100) {
    throw new GraphQLError("first must be between 1 and 100", { extensions: { code: "BAD_USER_INPUT" } });
  }
  let start = 0;
  if (args.after) {
    const afterId = Buffer.from(args.after, "base64").toString("utf8");
    const index = items.findIndex((item) => item.id === afterId);
    if (index === -1) {
      throw new GraphQLError(`Invalid cursor: ${args.after}`, { extensions: { code: "BAD_USER_INPUT" } });
    }
    start = index + 1;
  }
  const page = items.slice(start, start + args.first);
  return {
    edges: page.map((item) => ({ cursor: toCursor(item.id), node: item })),
    pageInfo: {
      startCursor: page.length ? toCursor(page[0].id) : null,
      endCursor: page.length ? toCursor(page[page.length - 1].id) : null,
      hasPreviousPage: start > 0,
      hasNextPage: start + args.first < items.length,
    },
  };
}
