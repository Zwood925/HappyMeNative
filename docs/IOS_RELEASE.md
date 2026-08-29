# HappyMe 1.2.0 iOS Release Handoff

HappyMe is built on Linux through EAS Build’s hosted macOS workers. The current bundle identifier is `com.zwood925.happyme`, Apple Team ID is `C4J27RWDAX`, App Store ID is `6806403132`, and the Expo project is linked through `app.config.ts`.[1]

## Release command

After pulling the checkpoint and confirming `eas whoami`, create and upload the next build with:

```bash
eas build --platform ios --profile production --auto-submit
```

The source release is `1.2.0`; EAS remote versioning and `autoIncrement` protect the App Store build number from duplication. The repository’s explicit baseline build number is `3`.

## Required console checks

| Service | Required check |
|---|---|
| EAS | Production build receives `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; neither is privileged |
| Apple | Associated Domains includes `applinks:happy-me-native.vercel.app` |
| Vercel | `/.well-known/apple-app-site-association` returns JSON containing `C4J27RWDAX.com.zwood925.happyme` without a redirect |
| Supabase | Site URL and callback allow list match the production values; email confirmation remains required |
| Supabase email | Custom SMTP is configured before inviting more than a very small internal group |

## Physical-device cloud smoke test

Use two email addresses and two TestFlight devices or isolated installations. Complete these checks before external beta testing:

| Flow | Expected result |
|---|---|
| Signup | Confirmation email opens HappyMe; the new account begins with no sample moments or pods |
| Recovery | Forgot Password sends a link; the link opens the new-password screen and the new password signs in |
| Private data | A private moment appears after relaunch on the same account and is invisible to the second account |
| Pod invitation | Account A creates a pod and texts the link; installed account B opens the app and joins |
| Install fallback | An uninstalled-device link opens Vercel and the correct App Store page; after install, retapping the same text link preserves the invite through signup |
| Collaboration | Pod moments, reactions, members, and kindness notes refresh across accounts |
| Friends | Friend code request, acceptance, friend listing, and direct kindness work |
| Safety | Report and Block hide the reported person’s shared content; the support form accepts a request |
| Offline | Cached content remains readable; reconnect and Retry restore synchronization |
| Deletion | Warnings appear; wrong password fails; `DELETE` plus the correct password removes the account and associated data; the same credentials cannot sign in |
| Accessibility | Keyboard-safe forms, VoiceOver labels, larger text, dark mode, safe areas, haptics, and Reduced Motion behavior are reviewed |

## App Store Connect URLs and privacy

Use these public URLs after Vercel reports the deployment ready:

| Field | URL |
|---|---|
| Privacy Policy URL | `https://happy-me-native.vercel.app/privacy` |
| Support URL | `https://happy-me-native.vercel.app/support` |
| Terms / community standards | `https://happy-me-native.vercel.app/terms` |

The App Privacy questionnaire must disclose account identifiers and user-generated content used for app functionality, because cloud accounts transmit and retain emails, profile information, moments, pod content, reactions, kindness notes, reports, and support messages. The current app includes no advertising or analytics SDK.

## Operational boundary

Code and database security tests cannot replace the physical-device sequence above. Browser visual verification was skipped at the user’s request. Custom SMTP, report/support monitoring, the App Store privacy questionnaire, screenshots, review notes, and the final EAS build remain account-owner actions.

## References

[1]: https://docs.expo.dev/build/introduction/ "Expo: EAS Build"
[2]: https://docs.expo.dev/submit/ios/ "Expo: Submit to the Apple App Store"
[3]: https://developer.apple.com/supporting-associated-domains/ "Apple: Supporting Associated Domains"
[4]: https://developer.apple.com/support/offering-account-deletion-in-your-app/ "Apple: Offering account deletion in your app"
