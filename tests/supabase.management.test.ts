import { describe, expect, it } from "vitest";

const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
const projectRef = "axxgzqylqnwvjxgvlnzu";

describe("Supabase management configuration", () => {
  it.runIf(Boolean(accessToken))("can access the intended project", async () => {
    const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    expect(response.status).toBe(200);
    const project = await response.json() as { id?: string };
    expect(project.id).toBe(projectRef);
  });
});
