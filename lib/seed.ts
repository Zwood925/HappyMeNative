import { dateAtOffset } from "@/lib/date";
import type { HappySnapshot } from "@/lib/domain";

export function createSeedSnapshot(): HappySnapshot {
  return {
    schemaVersion: 1,
    currentMemberId: "member-me",
    members: [
      { id: "member-me", name: "You", initials: "YO", color: "#E7A52C" },
      { id: "member-maya", name: "Maya", initials: "MA", color: "#9E8BD8" },
      { id: "member-eli", name: "Eli", initials: "EL", color: "#72BFA3" },
      { id: "member-nora", name: "Nora", initials: "NO", color: "#6EA8D9" },
    ],
    pods: [
      { id: "pod-home", name: "Home Team", description: "Small wins and ordinary magic with the people closest to you.", color: "#F27C72", memberIds: ["member-me", "member-maya", "member-eli"], inviteCode: "HOMEJOY", createdAt: dateAtOffset(42) },
      { id: "pod-sunrise", name: "Sunrise Club", description: "A gentle corner for morning people and fresh starts.", color: "#6EA8D9", memberIds: ["member-me", "member-nora"], inviteCode: "SUNRISE", createdAt: dateAtOffset(24) },
      { id: "pod-kindred", name: "Kindred Spirits", description: "An invite-only pod ready to join with the code KINDRED.", color: "#9E8BD8", memberIds: ["member-maya", "member-nora"], inviteCode: "KINDRED", createdAt: dateAtOffset(18) },
    ],
    moments: [
      { id: "moment-1", text: "The kitchen smelled like coffee, the window was open, and for five quiet minutes everything felt exactly right.", mood: "peaceful", authorId: "member-me", podId: "pod-home", tags: ["slow morning"], createdAt: dateAtOffset(0, 8), updatedAt: dateAtOffset(0, 8), isFavorite: true, myReaction: "heart", reactions: { smile: 2, heart: 3, celebrate: 0 } },
      { id: "moment-2", text: "Finished the thing I had been avoiding all week. Tiny victory dance included.", mood: "proud", authorId: "member-me", tags: ["small win"], createdAt: dateAtOffset(2, 17), updatedAt: dateAtOffset(2, 17), isFavorite: false, reactions: { smile: 1, heart: 0, celebrate: 2 } },
      { id: "moment-3", text: "We laughed so hard on the walk that we had to stop in the middle of the sidewalk.", mood: "connected", authorId: "member-maya", podId: "pod-home", tags: [], createdAt: dateAtOffset(3, 19), updatedAt: dateAtOffset(3, 19), isFavorite: false, reactions: { smile: 4, heart: 2, celebrate: 1 } },
      { id: "moment-4", text: "Caught the first gold light across the trees before the rest of the street woke up.", mood: "sunny", authorId: "member-nora", podId: "pod-sunrise", tags: ["outside"], createdAt: dateAtOffset(6, 7), updatedAt: dateAtOffset(6, 7), isFavorite: false, reactions: { smile: 2, heart: 1, celebrate: 0 } },
      { id: "moment-5", text: "A stranger held the elevator and gave me the kindest smile.", mood: "connected", authorId: "member-me", tags: [], createdAt: dateAtOffset(10, 14), updatedAt: dateAtOffset(10, 14), isFavorite: false, reactions: { smile: 0, heart: 1, celebrate: 0 } },
    ],
    encouragements: [
      { id: "encouragement-1", fromMemberId: "member-maya", toMemberId: "member-me", podId: "pod-home", message: "I love that you noticed the quiet part of the morning. Keep protecting those little pockets of peace.", createdAt: dateAtOffset(0, 11), read: false },
      { id: "encouragement-2", fromMemberId: "member-me", toMemberId: "member-nora", podId: "pod-sunrise", message: "Your sunrise note made me look up from my screen today. Thank you for that.", createdAt: dateAtOffset(4, 9), read: true },
    ],
    preferences: { appearance: "system", remindersEnabled: false, celebrationSounds: true, displayName: "You" },
  };
}
