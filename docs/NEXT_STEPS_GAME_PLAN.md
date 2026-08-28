# HappyMe: Complete Next-Steps Game Plan

**Prepared:** August 28, 2026  
**Current repository:** `Zwood925/HappyMeNative`  
**iOS bundle identifier:** `com.zwood925.happyme`

## The important clarification: “sync” means two different things

Your stated goal—**edit code in VS Code and immediately see the change on your iPhone**—is development Fast Refresh. It does **not** require Supabase. Your desktop runs the JavaScript development server, and Expo Go or a HappyMe development build on your phone loads the latest code from that server. TypeScript and JavaScript edits normally appear within seconds. A native rebuild is only required after changing native dependencies, the Expo app configuration, or the Expo SDK.[1]

Supabase synchronization is different. It makes **user data**—moments, pod membership, reactions, and encouragements—follow an authenticated person across devices and appear for other pod members. That requires authentication, database policies, synchronization logic, conflict handling, moderation, and account deletion.

| Capability | What changes | Supabase required? | New signed iOS build required? |
|---|---|---:|---:|
| Fast Refresh | TypeScript/JavaScript edits from VS Code appear on your phone | No | No |
| Native configuration change | Icons, bundle configuration, native library or permission changes | No | Yes |
| TestFlight update | A packaged beta version is uploaded for testers | No | Yes |
| Cross-device data sync | Journal and account data follow the same user | Yes | Usually once when the SDK/auth are first added |
| Multi-user pods | Real people share moments and encouragements | Yes | Yes for the first implementation |

## Verified GitHub key-safety result

The Git history was inspected without displaying or copying the values. The committed `EXPO_PUBLIC_SUPABASE_ANON_KEY` value is a **Supabase publishable key**, not a secret or service-role key. The other value is the normal Supabase project URL. The current branch no longer tracks the environment file, and `.env` is ignored.

> **No key rotation is required from this finding.** Supabase publishable keys are designed to ship inside client applications; row-level security is the actual security boundary.[2]

For consistency with current Supabase and Expo documentation, use this local name going forward:

```dotenv
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Do not place a database password, `sb_secret_...` key, or legacy JWT with a `service_role` claim in any `EXPO_PUBLIC_` variable, mobile application, Git repository, Codemagic non-secret field, or Vercel client variable. A secret/service-role key bypasses row-level security.[2]

## Choose one iOS cloud builder

You do **not** need both EAS Build and Codemagic. Both solve the Linux limitation by compiling and signing the iOS app on hosted macOS/Xcode machines.

| Approach | Tradeoffs | Cost | Setup complexity |
|---|---|---:|---:|
| **Expo EAS Build and Submit** | Most direct path for an Expo-managed project. Expo handles prebuild, signing credentials, build profiles, hosted `.ipa` artifacts, and App Store upload. Requires an Expo account and EAS project linkage. | Uses Expo’s current build allowances and paid tiers as applicable; Apple membership is still required | Low |
| **Codemagic build and publish** | Uses your existing Codemagic account and a repository-owned `codemagic.yaml`. Gives transparent CI steps and direct App Store Connect integration. Requires Apple API-key integration and a generated Xcode project during CI. | Uses Codemagic’s current macOS build-minute allowances and paid tiers as applicable; Apple membership is still required | Medium |
| **Expo Go for daily UI work** | Lightest way to see code changes on your phone. It is not a signed release pipeline and does not replace a TestFlight build. | Free | Low |

The rest of this plan supports either cloud builder. If you want to use the account you already have, follow the Codemagic branch. If you prefer the least Expo-specific configuration work, follow the EAS branch.

## Phase 1 — Verify your local development loop today

From the cloned repository in VS Code, run:

```bash
git switch main
git pull --ff-only
git status
git check-ignore -v .env .env.local
pnpm install
pnpm test
pnpm check
pnpm lint
npx expo start --go --tunnel
```

Install **Expo Go** on your iPhone, keep the phone online, and scan the QR code. The `--tunnel` option is slower than a same-Wi-Fi LAN connection but avoids many router and firewall problems. Edit text in `app/(tabs)/index.tsx`, save it, and confirm the change appears on the phone. This verifies the desktop-to-phone workflow you described.

Use `npx expo start --go --lan` later when the computer and phone are on the same network and can reach each other. The repository already includes `expo-dev-client`; after a custom development build is installed, plain `npx expo start --tunnel` will target that build.[1]

Expo Go is suitable for normal interface development here. Use a custom development build or TestFlight build for final validation of notification permissions, signing, app icons, splash behavior, and other native configuration.

## Phase 2 — Decide the scope of TestFlight build 1

### Path A: local-first beta

This is the shortest route. The journal, Garden, reminders, export, theme, pods interface, and encouragement interface remain stored on one phone. Pod and kindness screens are demonstrations, not communication with other real users. This path can reach TestFlight before the Supabase work is complete.

### Path B: real synced social beta

This adds real accounts and remote data before TestFlight. The work is materially larger than adding two environment variables. It includes:

1. Installing `@supabase/supabase-js` and `expo-sqlite`, adding the plugin, and persisting sessions securely.
2. Applying and testing the full HappyMe schema and row-level-security policies.
3. Implementing authentication. For the first private beta, email one-time-password sign-in is the simplest; Sign in with Apple can be added before public release.
4. Replacing the in-memory/local-only pod, moment, reaction, and encouragement actions with an offline-first repository that writes locally immediately and synchronizes in the background.
5. Adding Realtime subscriptions for pod moments, reactions, membership changes, and encouragement delivery.
6. Building safe invite-code redemption as a database function or server/edge function rather than exposing unrestricted invite-code searches.
7. Adding retry, conflict, migration, loading, offline, and sync-error states.
8. Adding in-app account deletion and associated data deletion. Apple requires apps that create accounts to let users initiate deletion in the app.[3]
9. Adding user-generated-content safeguards before public or external distribution: objectionable-content filtering, reporting, blocking, published contact information, and a moderation-response process.[4]

The prepared `supabase/schema.sql` is a starting point, not the finished backend. It still needs to be applied to the intended project and extended for profile creation, safe invite redemption, blocks, reports, moderation state, deletion workflows, and any push-notification tokens.

## Phase 3 — Supabase implementation sequence

When you are ready for real data sync, the implementation order should be:

| Order | Work | Acceptance check |
|---:|---|---|
| 1 | Normalize local environment names and install the Supabase client | App starts with and without a network connection; no credential value is logged |
| 2 | Apply versioned SQL migrations | All expected tables, functions, grants, and policies exist |
| 3 | Add auth and automatic profile creation | A new tester can sign in, relaunch, and stay signed in |
| 4 | Sync private moments | Create/edit/delete/favorite works offline and reconciles after reconnecting |
| 5 | Sync pods and membership | Owner can create a pod; invited tester can join safely; nonmembers cannot read it |
| 6 | Sync reactions and encouragements | Two accounts see updates without refreshing |
| 7 | Add deletion, block, report, moderation, and contact flows | Account deletion removes owned data; blocked users cannot interact; reports are actionable |
| 8 | Run RLS adversarial tests | One authenticated user cannot read or mutate another user’s private data |

For development, Preview, and Production, either use separate Supabase projects or deliberately use one private-beta project until launch. Expo’s current integration can link an existing Supabase project and create environment-specific variables, but Codemagic can also inject the same public values directly as an environment group.[2]

## Phase 4 — Apple setup you must perform

These actions require your account and legal authority, so they should be completed by you while I provide exact field values and troubleshoot:

1. In **Apple Developer → Certificates, Identifiers & Profiles**, confirm or create the App ID `com.zwood925.happyme`.
2. In **App Store Connect → Apps**, create a new iOS app record named **HappyMe** using that exact bundle ID. Choose a private SKU such as `happyme-ios-001`.
3. In **App Store Connect → Users and Access → Integrations**, create a dedicated API key for the build service. For Codemagic publishing, its documentation requires an App Store Connect API key with App Manager permission and a distribution certificate.[5]
4. Download the `.p8` file immediately; Apple only offers it once. Record the **Issuer ID** and **Key ID**. Never commit the `.p8` file.
5. Confirm all current Apple agreements are accepted. Paid Apps banking and tax setup is unnecessary for a free app with no paid features, but unresolved agreements can still block distribution actions.

## Phase 5A — Codemagic route

1. Add the private `HappyMeNative` GitHub repository to Codemagic.
2. In **Team settings → Integrations → Developer Portal**, add the App Store Connect API key using its Issuer ID, Key ID, and `.p8` file.[5]
3. In Codemagic environment variables, create a protected group such as `happyme_supabase` containing:

```text
EXPO_PUBLIC_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

4. Commit a root-level `codemagic.yaml`. I can create this next. It should install pnpm dependencies, run Expo Doctor/tests/typecheck/lint, run `expo prebuild --platform ios --clean`, install CocoaPods, apply App Store signing profiles for `com.zwood925.happyme`, increment the build number, produce an `.ipa`, and upload it to App Store Connect.
5. Use an Apple-compatible Xcode 26 image. Apple currently requires uploads to use the iOS 26 SDK or later.[6]
6. For the first run, publish the binary to App Store Connect but keep **App Store review submission disabled**. Enable TestFlight distribution only.
7. After Apple finishes processing, open App Store Connect → HappyMe → TestFlight and add the build to an internal-testing group.

Codemagic requires the App Store Connect app record before automated publishing. Its official workflow supports automatic code signing and TestFlight upload from `codemagic.yaml`.[5][7]

## Phase 5B — EAS route and what “run the EAS build” means

**EAS Build** is Expo’s hosted Mac compilation service. You run a command from Linux; Expo checks out the project on a Mac, generates the iOS project, runs Xcode, signs the application with your Apple credentials, and gives you a signed `.ipa`.

From the repository:

```bash
npx eas-cli@latest login
npx eas-cli@latest init
npx eas-cli@latest build --platform ios --profile development
```

The development build is installed on your iPhone once. After installation, run this on your desktop for Fast Refresh:

```bash
npx expo start --tunnel
```

For TestFlight, create a separate production build and upload it:

```bash
npx eas-cli@latest build --platform ios --profile production
npx eas-cli@latest submit --platform ios --profile production --latest
```

EAS Build supports iPhone builds from Linux, and EAS Submit uploads the signed archive to App Store Connect.[1][8]

## Phase 6 — First TestFlight cycle

After the build appears in App Store Connect:

1. Complete **Test Information** with a feedback email, beta description, and “What to Test” notes.
2. Answer export-compliance questions. The project declares that it does not use non-exempt encryption.
3. Add yourself as an internal tester and install the build through the TestFlight app.
4. Run the physical-device smoke test: first launch, force-quit/relaunch persistence, offline launch, create/edit/delete/favorite, Garden date filtering, pod screens, encouragement screens, export, reset confirmation, reminder permission denial and acceptance, actual reminder delivery, dark mode, larger text, safe areas, and haptics.
5. Fix any blocker, increment the build number, and upload another build.
6. Add external testers only after the core flows are stable and, if real social content is enabled, moderation/report/block requirements are implemented. External testing can require TestFlight Beta App Review; Apple supports up to 100 internal App Store Connect testers and up to 10,000 external testers.[9]

TestFlight builds expire after 90 days and are not automatically public App Store releases.[9]

## Phase 7 — Vercel support and privacy site

Create a small public site on Vercel with stable routes:

| Route | Purpose |
|---|---|
| `/` | HappyMe product landing page |
| `/privacy` | Required privacy policy |
| `/support` | Support instructions and contact method |
| `/terms` | Terms and community standards |
| `/account-deletion` | Deletion explanation and fallback request path |

The privacy policy must reflect the actual release. A local-only version can state that journal content remains on the device. A Supabase-synced version must disclose account identifiers and user content transmitted and retained for app functionality. App Store Connect requires a publicly accessible privacy-policy URL.[10]

I can write and build this site. You will connect the Vercel project/domain and confirm the legal contact details and jurisdiction-specific wording.

## Phase 8 — Public App Store release

Before App Review, complete:

| Area | Required work |
|---|---|
| Product page | Name, subtitle, description, keywords, category, promotional text |
| Visual assets | Current iPhone screenshots that show the app in use, not only a splash/login screen |
| URLs | Privacy policy, support, and optional marketing URL |
| Privacy | App Privacy answers that match local-only or Supabase-enabled behavior |
| Safety | Terms, filtering, report, block, support contact, and moderation for shared user content |
| Accounts | Reviewer demo account and in-app account deletion if sign-up exists |
| Compliance | Age-rating questionnaire, export compliance, content rights, accessibility declarations |
| Review | Specific review notes explaining pods, reminders, sync behavior, and any test credentials |

Apple expects submissions to be complete, tested on-device, and accompanied by working backend services and reviewer access when accounts are required.[4]

## Who does what

| Work | I can complete | You must complete |
|---|:---:|:---:|
| Supabase client, SQL migrations, RLS tests, offline sync, Realtime | Yes | Approve project/environment choice |
| Authentication, account deletion, report/block/moderation UI | Yes | Configure provider settings and supply policy decisions |
| `codemagic.yaml` or EAS configuration | Yes | Connect/log in to the chosen service |
| Apple bundle/config review | Yes | Create/confirm identifiers and App Store record |
| Distribution certificate/profile automation | Configuration and troubleshooting | Authorize Apple access in Codemagic or EAS |
| TestFlight binary upload | Configuration and guided execution | Confirm the external upload before it occurs |
| Physical iPhone testing | Test script and issue fixes | Install and exercise the build on your phone |
| Vercel privacy/support site | Yes | Connect Vercel/domain and confirm legal/contact details |
| App Store copy and screenshot plan | Yes | Approve claims and final imagery |
| Final App Review submission | Prepare everything | Review and press Submit |

## Your immediate next actions

1. Run the **Phase 1** commands and confirm Fast Refresh works in Expo Go. This solves the desktop-to-phone code-update goal.
2. Choose **Codemagic** or **EAS** as the one cloud builder. Do not configure both initially.
3. Decide whether TestFlight build 1 is **local-first** or includes **real Supabase accounts and multi-user pods**.
4. Confirm whether `com.zwood925.happyme` already exists in your Apple Developer account and whether the HappyMe App Store Connect record has already been created.

Once those four answers are known, the next implementation task is either the Codemagic pipeline or the Supabase sync layer.

## References

[1]: https://docs.expo.dev/develop/development-builds/introduction/ "Expo: Introduction to development builds"
[2]: https://docs.expo.dev/guides/using-supabase/ "Expo: Using Supabase"
[3]: https://developer.apple.com/support/offering-account-deletion-in-your-app/ "Apple: Offering account deletion in your app"
[4]: https://developer.apple.com/app-store/review/guidelines/ "Apple: App Review Guidelines"
[5]: https://docs.codemagic.io/yaml-publishing/app-store-connect/ "Codemagic: App Store Connect publishing using codemagic.yaml"
[6]: https://developer.apple.com/app-store/submitting/ "Apple: Submit your apps and games today"
[7]: https://docs.codemagic.io/yaml-quick-start/building-a-react-native-app/ "Codemagic: React Native apps"
[8]: https://docs.expo.dev/deploy/submit-to-app-stores/ "Expo: Submit to app stores"
[9]: https://developer.apple.com/help/app-store-connect/test-a-beta-version/testflight-overview/ "Apple: TestFlight overview"
[10]: https://developer.apple.com/app-store/app-privacy-details/ "Apple: App privacy details"
