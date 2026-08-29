import { describe, expect, it } from "vitest";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

describe("managed Supabase client configuration", () => {
  it.runIf(Boolean(supabaseUrl && publishableKey))("uses the intended HTTPS project and a client-safe publishable key", () => {
    const projectUrl = new URL(supabaseUrl!);
    expect(projectUrl.protocol).toBe("https:");
    expect(projectUrl.hostname).toBe("axxgzqylqnwvjxgvlnzu.supabase.co");
    expect(publishableKey).toMatch(/^sb_publishable_[A-Za-z0-9_-]+$/);
  });
});
