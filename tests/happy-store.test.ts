import { describe, expect, it } from "vitest";
import { happyReducer, toSnapshot } from "@/lib/happy-reducer";
import { createSeedSnapshot } from "@/lib/seed";

function state() {
  return { ...createSeedSnapshot(), hydrated: true, syncing: false };
}

describe("HappyMe local state", () => {
  it("adds a new moment at the front of the timeline", () => {
    const next = happyReducer(state(), {
      type: "ADD_MOMENT",
      payload: {
        id: "new-moment",
        text: "A very good cup of tea.",
        mood: "peaceful",
        authorId: "member-me",
        tags: [],
        createdAt: "2026-08-27T20:00:00.000Z",
        updatedAt: "2026-08-27T20:00:00.000Z",
        isFavorite: false,
        reactions: { smile: 0, heart: 0, celebrate: 0 },
      },
    });
    expect(next.moments[0].id).toBe("new-moment");
    expect(next.moments).toHaveLength(state().moments.length + 1);
  });

  it("moves a reaction without inflating totals", () => {
    const original = state();
    const smiled = happyReducer(original, { type: "REACT", payload: { id: "moment-2", reaction: "smile" } });
    const changed = happyReducer(smiled, { type: "REACT", payload: { id: "moment-2", reaction: "heart" } });
    const moment = changed.moments.find((item) => item.id === "moment-2");
    expect(moment?.reactions.smile).toBe(original.moments.find((item) => item.id === "moment-2")!.reactions.smile);
    expect(moment?.reactions.heart).toBe(1);
    expect(moment?.myReaction).toBe("heart");
  });

  it("removes runtime hydration metadata from exports", () => {
    const snapshot = toSnapshot(state());
    expect("hydrated" in snapshot).toBe(false);
    expect(snapshot.schemaVersion).toBe(1);
  });
});
