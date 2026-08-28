# HappyMe iOS Build and App Store Handoff

## Recommended Linux workflow

HappyMe is designed so day-to-day TypeScript development can happen on Linux. Native iOS compilation still requires Apple tooling, so the practical Linux path is **EAS Build**, which sends the project to hosted macOS workers. Expo states that cloud development builds can be initiated from Linux and that EAS Build can manage iOS provisioning profiles and distribution certificates.[1][2]

| Stage | Command | Result |
|---|---|---|
| Browser smoke test | `pnpm dev` | Expo web preview for fast layout checks |
| Automated validation | `pnpm test && pnpm check && pnpm lint` | Unit, type, and lint checks |
| Development client | `eas build --platform ios --profile development` | Signed build for registered iPhones |
| Internal release | `eas build --platform ios --profile preview` | Internal-distribution build |
| App Store binary | `eas build --platform ios --profile production` | Signed production `.ipa` |
| Upload | `eas submit --platform ios --profile production` | Build uploaded to App Store Connect |

## One-time setup

Install the EAS command line tool and authenticate:

```bash
pnpm add --global eas-cli
eas login
eas whoami
```

Run `eas build:configure` from the project root. The repository already contains `eas.json`, so keep its three profiles unless your team has a specific release policy. Expo documents EAS CLI installation, account login, and `eas build:configure` as the standard setup sequence.[2]

The current bundle identifier is `com.zwood925.happyme`. Confirm that this identifier is unused or matches the App Store Connect record you intend to ship. If the original HappyMe listing already has a different bundle identifier, update `rawBundleId` in `app.config.ts` **before the first signed production build**.

## Development build on a physical iPhone

Run:

```bash
eas build --platform ios --profile development
```

When prompted, allow EAS to manage the distribution certificate and provisioning profile unless you have existing credentials that must be preserved. Register the target iPhone when prompted, install the completed build from the EAS build page or QR code, then start the JavaScript server with `pnpm dev`. A development build is the recommended environment once an app uses custom native configuration, and Expo supports these cloud builds from Linux.[1]

## TestFlight and App Store submission

Create the production binary:

```bash
eas build --platform ios --profile production
```

Then upload the newest compatible build:

```bash
eas submit --platform ios --profile production
```

EAS Submit works on Linux and uploads the build to App Store Connect. The build then appears in TestFlight after Apple finishes processing it; production release still requires completing the App Store Connect listing and submitting the selected build for review.[3]

Before review, prepare the final app description, privacy policy URL, support URL, age rating, category, screenshots for required iPhone sizes, and the App Privacy answers. Verify local notifications, dark mode, Dynamic Type, offline launch, JSON export, deletion, and all privacy statements on a physical device.

## Release checklist

| Check | Expected result |
|---|---|
| Bundle identity | `com.zwood925.happyme`, or the identifier tied to the existing listing |
| Display name | `HappyMe` |
| Encryption declaration | `ITSAppUsesNonExemptEncryption` is `false` |
| Icon and splash | Custom sun-smile artwork appears without an extra corner mask |
| Notifications | Permission is requested only after the user enables the reminder |
| Persistence | Moments remain after closing and reopening the application |
| Privacy | Export and reset work; no analytics or third-party trackers are included |
| Device coverage | Current iPhone, a smaller iPhone layout, dark mode, and increased text size are reviewed |
| Store path | Production build reaches TestFlight before App Review submission |

## Known boundary

The delivered app is local-first. Pods, reactions, and encouragement flows are complete on the device, but they do not yet synchronize with other people’s devices. This avoids shipping an insecure or partially configured backend. The Supabase migration package in this repository is the next step when remote accounts and real-time pod membership are required.

## References

[1]: https://docs.expo.dev/develop/development-builds/introduction/ "Expo: Introduction to development builds"
[2]: https://docs.expo.dev/build/setup/ "Expo: Create your first build"
[3]: https://docs.expo.dev/submit/ios/ "Expo: Submit to the Apple App Store with EAS Submit"
