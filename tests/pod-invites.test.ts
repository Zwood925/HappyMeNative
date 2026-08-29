import { describe, expect, it } from "vitest";
import { createPodInviteLink, createPodInviteMessage, parsePodInvite } from "@/lib/pod-invites";

const pod = {
  id: "pod-sunrise",
  name: "Sunrise Club",
  description: "Early light and strong coffee.",
  color: "#F6B84A",
  inviteCode: "SUN123",
};

describe("pod invite links", () => {
  it("round-trips a pod through the HappyMe deep link", () => {
    const link = createPodInviteLink(pod);
    const url = new URL(link);
    expect(url.protocol).toBe("happyme:");
    expect(parsePodInvite(Object.fromEntries(url.searchParams))).toEqual({
      podId: pod.id,
      inviteCode: pod.inviteCode,
      name: pod.name,
      description: pod.description,
      color: pod.color,
    });
  });

  it("includes both a tappable link and readable fallback code", () => {
    const message = createPodInviteMessage(pod);
    expect(message).toContain(createPodInviteLink(pod));
    expect(message).toContain(pod.inviteCode);
  });

  it("rejects incomplete links and normalizes unsafe optional values", () => {
    expect(parsePodInvite({ code: "SUN123" })).toBeNull();
    expect(parsePodInvite({ podId: "pod-new", code: " abc123 ", name: " New Circle ", color: "orange" })).toMatchObject({
      inviteCode: "ABC123",
      name: "New Circle",
      description: "A private place for small joys.",
      color: "#F27C72",
    });
  });
});
