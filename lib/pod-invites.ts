import type { Pod } from "@/lib/domain";

export const HAPPYME_INVITE_SCHEME = "happyme";

export interface PodInvitePayload {
  podId: string;
  inviteCode: string;
  name: string;
  description: string;
  color: string;
}

export function createPodInviteLink(pod: Pick<Pod, "id" | "inviteCode" | "name" | "description" | "color">) {
  const query = new URLSearchParams({
    podId: pod.id,
    code: pod.inviteCode,
    name: pod.name,
    description: pod.description,
    color: pod.color,
  });
  return `${HAPPYME_INVITE_SCHEME}://join?${query.toString()}`;
}

export function createPodInviteMessage(pod: Pick<Pod, "id" | "inviteCode" | "name" | "description" | "color">) {
  return `Come join my private “${pod.name}” pod in HappyMe.\n\nOpen this invite on your phone:\n${createPodInviteLink(pod)}\n\nInvite code: ${pod.inviteCode}`;
}

export function parsePodInvite(params: Record<string, string | string[] | undefined>): PodInvitePayload | null {
  const value = (key: string) => {
    const candidate = params[key];
    return Array.isArray(candidate) ? candidate[0] : candidate;
  };
  const podId = value("podId")?.trim();
  const inviteCode = value("code")?.trim().toUpperCase();
  const name = value("name")?.trim();
  if (!podId || !inviteCode || !name) return null;
  return {
    podId,
    inviteCode,
    name: name.slice(0, 80),
    description: (value("description")?.trim() || "A private place for small joys.").slice(0, 180),
    color: /^#[0-9A-F]{6}$/i.test(value("color") ?? "") ? value("color")! : "#F27C72",
  };
}
