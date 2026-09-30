// Stand-in for real authentication, used in the Authorization lesson.
// A real API would check a signed token (for example, a JWT from an identity
// provider). Here, each fake token maps straight to a user.

export type Role = "AGENT" | "ADJUSTER";

export interface User {
  id: string;
  name: string;
  role: Role;
}

const usersByToken: Record<string, User> = {
  "agent-token": { id: "u1", name: "Alex Chen", role: "AGENT" },
  "adjuster-token": { id: "u2", name: "Sam Rivera", role: "ADJUSTER" },
};

// Turns an Authorization header, like "Bearer agent-token", into a user.
// Returns null when there's no header, or the token isn't one of the above.
export function getUser(authorization: string | undefined): User | null {
  const token = authorization?.replace("Bearer ", "") ?? "";
  return usersByToken[token] ?? null;
}
