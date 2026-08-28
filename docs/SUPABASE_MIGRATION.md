# Optional Supabase Migration

The native application currently uses a versioned AsyncStorage snapshot. That makes onboarding instant, keeps the first release free of backend credentials, and provides a reliable offline experience. The interface already separates user actions from storage details, so a Supabase repository can be added without rewriting screens.

## Migration sequence

Apply `supabase/schema.sql` to a new Supabase project. Add the project URL and public anonymous key through the deployment environment, never directly in source control. Create an authentication flow only when multi-user synchronization is enabled; until then, preserve the current no-account local mode.

Implement a `SupabaseHappyRepository` with the same operations used by `lib/happy-store.tsx`: hydrate, add/update/delete moment, toggle favorite, react, create/join pod, send/read encouragement, and update preferences. Keep an offline queue so a lost connection never blocks journaling. On first authenticated launch, upload only records owned by the current local profile, preserve original timestamps, and store a one-time migration marker.

## Security model

The supplied SQL enables row-level security. A user can read a pod only if they are a member, read a shared moment only through a joined pod, modify only their own profile and moments, and read an encouragement only when they are its sender or recipient. Treat invitation codes as secrets: rotate them after abuse and rate-limit lookups in a server function rather than exposing unrestricted code searches in a production client.

## Suggested synchronization order

| Order | Entity | Conflict rule |
|---|---|---|
| 1 | Profiles | Latest explicit profile edit wins |
| 2 | Pods and membership | Server membership is authoritative |
| 3 | Moments | Latest `updated_at` wins; deletes use tombstones during rollout |
| 4 | Reactions | Upsert by `(moment_id, user_id)` |
| 5 | Encouragements | Append-only, with a recipient-controlled `read_at` timestamp |
| 6 | Preferences | Device-local appearance can remain local; reminder scheduling stays device-specific |

Do not move local reminder identifiers or notification permissions into Supabase. Those belong to each device. Remote push notifications are a separate opt-in feature and require APNs/Expo push credentials plus a server-side delivery path.
