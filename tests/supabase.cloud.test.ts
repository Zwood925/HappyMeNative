import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, describe, expect, it } from "vitest";

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const runLive = process.env.RUN_LIVE_SUPABASE_TESTS === "1" && Boolean(url && key);

function client() {
  return createClient(url!, key!, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
}

describe.runIf(runLive)("HappyMe cloud security and collaboration", () => {
  const alpha = client(); const beta = client();

  afterAll(async () => {
    for (const current of [beta, alpha]) {
      try { await current.rpc("delete_my_account"); } catch { /* best-effort cleanup */ }
    }
  });

  it("supports two real accounts while enforcing private and pod-scoped access", async () => {
    const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const password = `Happy-${stamp}-9!`;
    const alphaEmail = `happyme.alpha.${stamp}@gmail.com`;
    const betaEmail = `happyme.beta.${stamp}@gmail.com`;

    const alphaSignup = await alpha.auth.signUp({ email: alphaEmail, password, options: { data: { display_name: "Alpha Tester" } } });
    const betaSignup = await beta.auth.signUp({ email: betaEmail, password, options: { data: { display_name: "Beta Tester" } } });
    expect(alphaSignup.error).toBeNull(); expect(betaSignup.error).toBeNull();
    expect(alphaSignup.data.user?.id).toBeTruthy(); expect(betaSignup.data.user?.id).toBeTruthy();
    expect(alphaSignup.data.session).toBeTruthy(); expect(betaSignup.data.session).toBeTruthy();
    const alphaId = alphaSignup.data.user!.id; const betaId = betaSignup.data.user!.id;

    const alphaProfile = await alpha.from("profiles").select("id,display_name,friend_code").eq("id", alphaId).single();
    const betaProfile = await beta.from("profiles").select("id,display_name,friend_code").eq("id", betaId).single();
    expect(alphaProfile.error).toBeNull(); expect(betaProfile.error).toBeNull();

    const privateMoment = await alpha.from("moments").insert({ author_id: alphaId, body: "A private cloud moment", mood: "peaceful" }).select("id").single();
    expect(privateMoment.error).toBeNull();
    const privateFromBeta = await beta.from("moments").select("id").eq("id", privateMoment.data!.id);
    expect(privateFromBeta.error).toBeNull(); expect(privateFromBeta.data).toHaveLength(0);

    const created = await alpha.rpc("create_pod", { p_name: "Cloud Test Pod", p_description: "Two-account policy test", p_color: "#F27C72" });
    expect(created.error).toBeNull();
    const pod = created.data as { id: string; invite_token: string };
    const preview = await beta.rpc("get_invite_preview", { p_invite_token: pod.invite_token });
    expect(preview.error).toBeNull(); expect(preview.data?.[0]?.pod_name).toBe("Cloud Test Pod");
    const claimed = await beta.rpc("claim_pod_invite", { p_invite_token: pod.invite_token });
    expect(claimed.error).toBeNull(); expect(claimed.data).toBe(pod.id);

    const sharedMoment = await alpha.from("moments").insert({ author_id: alphaId, pod_id: pod.id, body: "A shared cloud moment", mood: "connected", tags: ["together"] }).select("id").single();
    expect(sharedMoment.error).toBeNull();
    const sharedFromBeta = await beta.from("moments").select("id,body").eq("id", sharedMoment.data!.id).single();
    expect(sharedFromBeta.error).toBeNull(); expect(sharedFromBeta.data?.body).toBe("A shared cloud moment");
    const unauthorizedEdit = await beta.from("moments").update({ body: "Should not change" }).eq("id", sharedMoment.data!.id).select("id");
    expect(unauthorizedEdit.error).toBeNull(); expect(unauthorizedEdit.data).toHaveLength(0);

    const reaction = await beta.from("moment_reactions").upsert({ moment_id: sharedMoment.data!.id, user_id: betaId, kind: "heart" });
    expect(reaction.error).toBeNull();
    const encouragement = await beta.from("encouragements").insert({ sender_id: betaId, recipient_id: alphaId, pod_id: pod.id, body: "You made the cloud brighter." });
    expect(encouragement.error).toBeNull();

    const friendRequest = await beta.rpc("send_friend_request", { p_friend_code: alphaProfile.data!.friend_code });
    expect(friendRequest.error).toBeNull();
    const accept = await alpha.rpc("respond_to_friend_request", { p_other_user: betaId, p_accept: true });
    expect(accept.error).toBeNull();
    const friendship = await beta.from("friendships").select("status").eq("user_one_id", [alphaId, betaId].sort()[0]).eq("user_two_id", [alphaId, betaId].sort()[1]).single();
    expect(friendship.error).toBeNull(); expect(friendship.data?.status).toBe("accepted");
    const alphaFriends = await alpha.rpc("list_friend_connections");
    const betaFriends = await beta.rpc("list_friend_connections");
    expect(alphaFriends.error).toBeNull(); expect(betaFriends.error).toBeNull();
    expect((alphaFriends.data ?? []).some((row: { other_user_id: string; status: string }) => row.other_user_id === betaId && row.status === "accepted")).toBe(true);
    expect((betaFriends.data ?? []).some((row: { other_user_id: string; status: string }) => row.other_user_id === alphaId && row.status === "accepted")).toBe(true);

    const report = await beta.from("reports").insert({ reporter_id: betaId, reported_user_id: alphaId, moment_id: sharedMoment.data!.id, reason: "self_harm", details: "Automated policy test; safe to dismiss." });
    expect(report.error).toBeNull();
    const support = await beta.from("support_requests").insert({ user_id: betaId, email: betaEmail, message: "Automated support policy test; safe to dismiss." });
    expect(support.error).toBeNull();
    const block = await beta.from("blocks").insert({ blocker_id: betaId, blocked_id: alphaId });
    expect(block.error).toBeNull();
    const hiddenAfterBlock = await beta.from("moments").select("id").eq("id", sharedMoment.data!.id);
    expect(hiddenAfterBlock.error).toBeNull(); expect(hiddenAfterBlock.data).toHaveLength(0);
    expect((await beta.from("blocks").delete().eq("blocked_id", alphaId)).error).toBeNull();

    expect((await beta.rpc("delete_my_account")).error).toBeNull();
    expect((await alpha.rpc("delete_my_account")).error).toBeNull();
  }, 30_000);
});
