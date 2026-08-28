import { describe, expect, it } from "vitest";

describe("Supabase release configuration", () => {
  it("authenticates the configured public client against the project", async () => {
    const projectUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const publicKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

    expect(projectUrl, "EXPO_PUBLIC_SUPABASE_URL is required").toMatch(/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i);
    expect(publicKey, "EXPO_PUBLIC_SUPABASE_ANON_KEY is required").toBeTruthy();

    const response = await fetch(`${projectUrl!.replace(/\/$/, "")}/auth/v1/settings`, {
      headers: {
        apikey: publicKey!,
        Authorization: `Bearer ${publicKey}`,
      },
    });

    expect(response.ok, `Supabase returned HTTP ${response.status}`).toBe(true);
    const settings = (await response.json()) as Record<string, unknown>;
    expect(settings).toBeTypeOf("object");
  }, 15_000);
});
