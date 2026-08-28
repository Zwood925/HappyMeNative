import { describe, expect, it } from "vitest";
import { getSuggestedTags, normalizeTag } from "@/lib/tag-suggestions";

describe("tag suggestions", () => {
  it("prioritizes tags supported by words in the moment", () => {
    expect(getSuggestedTags("We laughed at a silly joke on our walk outside", "connected", 4)).toEqual([
      "laughter",
      "outside",
      "together",
      "movement",
    ]);
  });

  it("falls back to mood-specific ideas when the text has no signal", () => {
    expect(getSuggestedTags("That was lovely", "peaceful", 3)).toEqual(["quiet joy", "slow moment"]);
  });

  it("normalizes custom tags and respects the requested limit", () => {
    expect(normalizeTag("  ##Slow    Morning  ")).toBe("slow morning");
    expect(getSuggestedTags("Coffee at sunrise with my family", "sunny", 2)).toHaveLength(2);
  });
});
