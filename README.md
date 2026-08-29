# HappyMe

HappyMe is a privacy-first Expo/React Native joy journal for iOS. It combines **private moments**, **small trusted pods**, a **Joy Garden**, direct **kindness notes**, and the signature **Joy Bloom** celebration without public popularity mechanics.

## Current release

HappyMe **1.2.0** uses authenticated Supabase cloud synchronization. New accounts begin clean; the previous sample dataset is not uploaded. Client applications contain only the public project URL and publishable key. PostgreSQL row-level security and narrowly granted functions enforce access boundaries.

| Area | Production behavior |
|---|---|
| Accounts | Email/password signup, required email confirmation, encrypted native session storage, sign-in, sign-out, and password recovery |
| Account deletion | Password reauthentication, explicit `DELETE` confirmation, Auth identity deletion, and cascading removal of associated HappyMe data |
| Moments | Private by default; optionally shared into pods; cloud-synced tags, favorites, reactions, editing, deletion, and Realtime refresh |
| Pods | Cloud creation, invite code, universal text link, member-scoped feed, and automatic invite claim after signup |
| Friends | Personal friend code, requests, acceptance, direct kindness eligibility, and blocking |
| Safety | Report shared content, block users, submit private support requests, and review public privacy and community terms |
| Reliability | Per-account local snapshot cache, optimistic interactions, explicit sync state, retry, and production iOS/web exports |

## Local development

```bash
pnpm install
pnpm dev
```

Use the HappyMe development build on an iPhone for Fast Refresh. The normal deterministic checks are:

```bash
pnpm test
pnpm check
pnpm lint
npx expo-doctor
```

The gated two-account security test creates temporary users, verifies private and pod-scoped access, invitations, reactions, encouragements, friends, reports, blocking, support, and deletion, then removes its test accounts:

```bash
RUN_LIVE_SUPABASE_TESTS=1 pnpm vitest run tests/supabase.cloud.test.ts
```

Do not run that command casually against production email-confirmation settings. The release process enables temporary test auto-confirmation only during a controlled test and restores required confirmation afterward.

## Production services

| Service | Responsibility |
|---|---|
| Supabase | Auth, Postgres, RLS, Realtime, account deletion, invite claiming, friends, reports, blocks, and support requests |
| Vercel | `happy-me-native.vercel.app` invite fallback, privacy notice, terms, support form, and Apple association endpoint |
| EAS | Signed iOS builds and App Store Connect submission |
| Apple | TestFlight, App Store distribution, universal-link verification, and device services |

Universal pod invitations use `https://happy-me-native.vercel.app/join?...`. Installed users open HappyMe directly. A new user sees the App Store fallback, installs HappyMe, retaps the same text link, creates an account, confirms the email, and is automatically joined after authentication.

## Build and submit

```bash
eas build --platform ios --profile production --auto-submit
```

The build profiles include only client-safe Supabase publishable values. Never add a Supabase secret/service-role key, database password, Apple private key, provisioning profile, or `.env` file to Git.

See [`docs/IOS_RELEASE.md`](docs/IOS_RELEASE.md) for the physical-device and App Store checklist and [`docs/SUPABASE_MIGRATION.md`](docs/SUPABASE_MIGRATION.md) for the live security architecture and console operations.

## Project map

| Path | Responsibility |
|---|---|
| `app/` | Expo Router account, journal, pods, friends, safety, support, policy, and deletion screens |
| `components/` | Reusable native UI and Joy Bloom |
| `lib/auth.tsx` | Supabase account and deletion lifecycle |
| `lib/happy-store.tsx` | Cloud repository, cache, optimistic writes, and Realtime refresh |
| `lib/pending-invite.ts` | Durable invitation intent and automatic post-auth claim |
| `supabase/schema.sql` | Rerunnable production schema, RLS, and security-definer functions |
| `api/apple-app-site-association.ts` | Dynamic Apple Universal Link association response |
| `vercel.json` | Static Expo web export and AASA rewrite |

## References

[1]: https://docs.expo.dev/build/introduction/ "Expo: EAS Build"
[2]: https://docs.expo.dev/submit/ios/ "Expo: Submit to the Apple App Store"
[3]: https://supabase.com/docs/guides/auth/row-level-security "Supabase: Row Level Security"
[4]: https://developer.apple.com/support/offering-account-deletion-in-your-app/ "Apple: Offering account deletion in your app"
