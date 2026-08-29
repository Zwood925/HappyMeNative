# HappyMe Cloud Security and Operations

HappyMe uses Supabase Auth, Postgres, Realtime, and row-level security for account-scoped synchronization. The mobile and web clients receive only the project URL and publishable key. A publishable key is not the authorization boundary; all sensitive access is constrained by RLS and narrowly granted database functions.[1]

## Live configuration

| Setting | Production value |
|---|---|
| Project | `axxgzqylqnwvjxgvlnzu` |
| Site URL | `https://happy-me-native.vercel.app` |
| Allowed callbacks | `happyme://**`, `https://happy-me-native.vercel.app/**` |
| Email/password signup | Enabled |
| Email confirmation | Required |
| Client auth flow | PKCE |

Supabase requires redirect targets to be allow-listed and recommends an exact production Site URL. Native applications may use a custom scheme for confirmation and recovery, while universal links require a separately hosted Apple association file.[2] [3]

## Authorization model

| Resource | Access rule |
|---|---|
| Profile | Self, accepted friends, or current pod peers; blocked pairs are excluded |
| Private moment | Author only |
| Pod moment | Current pod members, excluding blocked authors |
| Pod | Current members; mutation restricted to the owner |
| Reaction | Visible with its moment; managed by the reacting user |
| Kindness note | Sender and recipient; creation requires friendship or a shared pod |
| Friendship | Participants only |
| Block | Blocker only |
| Report | Reporter insert/read; operational review occurs outside the client |
| Support request | Authenticated self or anonymous public submission; operational review occurs outside the client |

The rerunnable `supabase/schema.sql` owns the production tables, indexes, triggers, publication membership, grants, policies, invite RPCs, friend RPCs, and `delete_my_account()`.

## Account deletion

Apple requires apps that create accounts to provide an in-app deletion path. HappyMe exposes **Settings → Delete My Account**, lists the consequences, reauthenticates the password, requires the exact word `DELETE`, and invokes `delete_my_account()`. Deleting `auth.users` cascades through profiles, private moments, pod memberships, reactions, encouragements, friendships, blocks, reports, and support requests. Pods owned by the account and their pod-scoped records are also deleted.[4]

## Invite sequence

The owner shares a universal HTTPS link by text. If HappyMe is installed, iOS opens `/join` directly. Otherwise Vercel renders the invite and App Store button. After installation, the recipient retaps the same text link; the app stores the invite payload locally, preserves its token through signup, and claims membership before the first cloud snapshot. The database functions are idempotent, so duplicate taps do not duplicate membership.

## Production operations still owned by the account administrator

Supabase’s production checklist recommends required email confirmation, a custom SMTP provider, abuse prevention, Security Advisor review, and account-level MFA.[5] Before a public launch, configure custom SMTP under **Authentication → Emails → SMTP Settings**; the default Supabase email sender is rate-limited and is not intended for meaningful production volume.[5]

Monitor `reports` and `support_requests` in the Supabase dashboard. HappyMe provides user reporting, blocking, terms, and a contact form, but the app owner must establish a response process and act on safety reports within a reasonable period. Enable CAPTCHA if signup abuse appears, and review Auth rate limits before promotion.[5]

## Validation

The live two-account suite verifies signup, profile triggers, private isolation, pod creation and invitation claiming, shared moments, unauthorized update denial, reactions, kindness notes, friend requests, friend listing, reporting, blocking, support insertion, and self-deletion. All temporary test users are removed afterward. Routine unit tests do not depend on a live network.

## References

[1]: https://supabase.com/docs/guides/auth/row-level-security "Supabase: Row Level Security"
[2]: https://supabase.com/docs/guides/auth/redirect-urls "Supabase: Redirect URLs"
[3]: https://supabase.com/docs/guides/auth/native-mobile-deep-linking "Supabase: Native Mobile Deep Linking"
[4]: https://developer.apple.com/support/offering-account-deletion-in-your-app/ "Apple: Offering account deletion in your app"
[5]: https://supabase.com/docs/guides/deployment/going-into-prod "Supabase: Production Checklist"
