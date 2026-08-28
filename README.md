# HappyMe

HappyMe is a native, privacy-first joy journal for iOS and Android. It turns the original [HappyMePlus PWA](https://github.com/Zwood925/HappyMePlus) into an Expo/React Native experience built around **happy moments**, **small private pods**, a **Joy Garden**, and direct **encouragement** without public popularity mechanics.

## What is included

| Area | Implementation |
|---|---|
| Today | Weekly joy pulse, quick capture, mood and audience selection, recent moments, reactions, and favorites |
| Joy Garden | Month navigation, highlighted moment days, date filtering, and archive cards |
| Pods | Private pod list, local create/join flows, invitation codes, members, and pod-specific feeds |
| Kindness | Received/sent inbox, unread state, direct encouragement composer, and optional pod context |
| You | Personal metrics, favorite memory, appearance selection, gentle local reminders, JSON export, and reset controls |
| Native details | Safe areas, portrait layouts, keyboard-aware composers, dark mode, share sheet, alerts, haptics, and local notifications |
| Persistence | Versioned AsyncStorage snapshot with typed React context actions and a portable export format |
| Quality | TypeScript, Expo ESLint, Vitest unit tests, mobile viewport review, custom icon, and EAS build profiles |

The app runs without an account and keeps its data on the device. This is a deliberate privacy and reliability choice for the first native release. The repository also includes an optional Supabase schema and migration guide for real cross-device accounts and multi-user pod synchronization.

## Technology

HappyMe uses Expo SDK 54, React Native 0.81, React 19, Expo Router, TypeScript, AsyncStorage, Expo Notifications, Expo Haptics, and Vitest. All application code and runtime libraries are open source. Cloud iOS compilation can be performed with EAS Build; Expo documents that EAS can build iOS binaries on hosted macOS workers and manage signing credentials, while EAS Submit can upload an iOS build from Linux.[1][2]

## Run locally

```bash
pnpm install
pnpm dev
```

Open the displayed QR code with the HappyMe development build or use the web preview for layout review. The automated checks are:

```bash
pnpm test
pnpm check
pnpm lint
```

Because this app uses native notification configuration, a custom development build is recommended for device testing. Expo’s development-build workflow describes this as a custom version of Expo Go and supports cloud iOS builds initiated from Linux.[3]

## Build for an iPhone from Linux

```bash
pnpm add --global eas-cli
eas login
eas build:configure
eas build --platform ios --profile development
```

After installing the resulting build on a registered iPhone, run `pnpm dev` and connect through the development client. For a TestFlight/App Store binary, use:

```bash
eas build --platform ios --profile production
eas submit --platform ios
```

The complete checklist, signing notes, and App Store handoff are in [`docs/IOS_RELEASE.md`](docs/IOS_RELEASE.md). Expo’s official setup guide confirms that `eas build --platform ios` produces a store build and can manage provisioning profiles and distribution certificates.[1][4]

## Project map

| Path | Responsibility |
|---|---|
| `app/` | Expo Router screens and navigation |
| `components/` | Reusable native UI components |
| `lib/domain.ts` | Stable application vocabulary and data contracts |
| `lib/happy-store.tsx` | Local state transitions, persistence, import/export boundary |
| `lib/reminders.ts` | Permission-aware local daily reminder scheduling |
| `lib/seed.ts` | Resettable first-launch sample content |
| `supabase/schema.sql` | Optional cloud schema with row-level security |
| `design.md` | Product-specific interface and interaction design |
| `validation-notes.md` | Portrait visual-review record |
| `todo.md` | Completed implementation ledger and remaining cloud follow-on |

## Cloud synchronization

The shipped app is fully useful in local mode. It does not pretend that sample pod members are connected remote accounts. When you want live multi-user pods, follow [`docs/SUPABASE_MIGRATION.md`](docs/SUPABASE_MIGRATION.md), apply the included SQL, and add a Supabase repository implementation behind the same domain actions. This keeps the native UI stable while cloud authentication, row-level security, and real-time delivery are introduced deliberately.

## License

The new HappyMe native code is available under the MIT License. Third-party packages retain their own licenses.

## References

[1]: https://docs.expo.dev/build/introduction/ "Expo: EAS Build"
[2]: https://docs.expo.dev/submit/ios/ "Expo: Submit to the Apple App Store with EAS Submit"
[3]: https://docs.expo.dev/develop/development-builds/introduction/ "Expo: Introduction to development builds"
[4]: https://docs.expo.dev/build/setup/ "Expo: Create your first build"
