# HappyMe Native Interface Design

## Product Direction

HappyMe is a private, calm social wellness experience centered on noticing and remembering joyful moments. The native rebuild will preserve the original ideas—happy moments, private pods, a joy calendar, and encouragement—while replacing the PWA’s web conventions with a one-handed, portrait-first interface that follows mainstream iOS patterns.

The initial release will be **local-first and privacy-first**. It will work without an account or paid service, persist data on the device, and expose a clean data-service boundary for an optional Supabase synchronization layer. This avoids blocking the native product on cloud credentials while preserving a practical path to multi-device and multi-user pods.

## Visual Character

The visual language is **soft, optimistic, tactile, and uncluttered** rather than clinical. The main background is warm cream (`#FFF9F2`), primary ink is deep plum (`#34263A`), the core joy color is marigold (`#F6B84A`), and supportive accents use coral (`#F27C72`), lavender (`#9E8BD8`), mint (`#72BFA3`), and sky (`#6EA8D9`). Cards use an elevated paper white (`#FFFCF8`) with subtle warm borders (`#EADFD5`). Dark mode uses aubergine-black backgrounds and softened versions of the same accents.

Typography should use the system font so the application feels native on iOS. Large titles are bold but not oversized, body copy remains readable, and metadata is deliberately quiet. Rounded rectangles, inset grouped sections, native-feeling sheets, restrained shadows, SF Symbol-style icons, haptic confirmation, and short fades provide polish without turning reflection into a gamified feed.

## Screen List

| Screen | Primary content and functionality | Native layout |
|---|---|---|
| **Today** | Greeting, seven-day joy pulse, quick-add composer, selected pod audience, recent personal and pod moments, reactions, and encouragement shortcuts. | Large-title header, vertically scrolling content, prominent thumb-reachable composer card, compact moment cards. |
| **Joy Garden** | Monthly calendar, highlighted days with moments, streak summary, filters, and a chronological archive. | Month header with native previous/next controls, adaptive calendar grid, then a virtualized list. |
| **Pods** | Private pod cards, member initials, activity summary, creation flow, join-code flow, and pod detail feed. | Inset grouped list with colored pod cards; create and join actions remain near the bottom reach zone. |
| **Encouragements** | Received and sent encouragements, unread state, quick responses, and a composer for selected pod members. | Segmented control, grouped inbox list, modal composer sheet. |
| **You** | Personal joy statistics, favorite memory, display preferences, privacy controls, data export, sample-data reset, and future sync status. | Profile summary followed by iOS-style grouped settings sections. |
| **Moment Detail** | Full moment text, mood color, attached pod, reactions, encouragement history, favorite toggle, edit, delete, and share/export actions. | Pushed detail screen with bottom action group and destructive confirmation. |
| **Compose Moment** | Multi-line joyful moment entry, mood selection, pod audience, date, optional tags, and save. | Keyboard-aware modal sheet with a single clear save action. |
| **Pod Detail** | Pod name and purpose, members, invitation code, shared moments, and member encouragement actions. | Pushed screen with a compact identity header and virtualized feed. |

## Key User Flows

### Capture a happy moment

The user opens **Today**, taps the composer, writes what made them smile, optionally chooses a mood and pod, and taps **Save moment**. The app confirms with a light success haptic, updates the weekly pulse, and inserts the new card at the top of the feed. The user can also open a full compose sheet when they want more room.

### Revisit joy over time

The user opens **Joy Garden**, changes the month if needed, and taps a highlighted date. The moment list filters to that day. Selecting a card opens **Moment Detail**, where the user can favorite, edit, share, or remove the memory.

### Share within a private pod

The user opens **Pods**, creates a pod or enters an invitation code, then opens that pod. From the pod detail screen they can add a moment for that audience, react to a shared memory, or send encouragement to a member. In local-first mode, pod membership and sample activity are stored on-device; the data layer is designed so remote Supabase records can later replace the local adapter without changing screen contracts.

### Send encouragement

From a moment or the **Encouragements** tab, the user selects a person, chooses a warm prompt or writes a short message, and sends it. The message appears in the sent view and the recipient’s local activity model. Empty states always offer a relevant next action rather than ending in a blank screen.

### Manage privacy and data

The user opens **You**, reviews the local-storage status, exports a JSON backup through the native share sheet, chooses light/dark/system appearance, toggles gentle reminders, or resets sample data. Destructive actions require confirmation.

## Interaction and Accessibility Rules

All controls must meet a minimum 44-point touch target, support Dynamic Type-friendly layouts, and provide labels that remain understandable without color. Primary actions use light haptics; successful saves use a success notification haptic; destructive actions never rely on gesture-only discovery. Motion will be limited to 80–300 ms opacity and scale transitions and must respect reduced-motion preferences where practical.

The bottom tab bar contains five destinations: **Today**, **Garden**, **Pods**, **Kindness**, and **You**. The most common action—capturing a moment—remains available near the lower half of Today rather than as an overloaded floating control. Portrait orientation is the design target, with tablet layouts remaining usable but not introducing desktop-style navigation.

## Data Architecture

The application uses typed domain models for `Moment`, `Pod`, `Member`, `Reaction`, `Encouragement`, and `Preferences`. A React context provides transactional actions, while an AsyncStorage repository persists a versioned local snapshot. Seed data is clearly labeled and can be removed. Import/export uses the same versioned snapshot structure. A future Supabase adapter can implement the same repository contract for authentication, cross-device sync, row-level security, and real-time pod activity.

## Scope Decisions

The native rebuild will not embed the old Next.js site in a WebView, carry Capacitor code forward, or require Xcode on the Linux development machine. Expo/React Native provides the native runtime; iOS signing and App Store builds will be handled through the Expo Application Services workflow or a later macOS archive step. The first delivered project will be fully navigable and useful offline, with cloud synchronization documented as a deliberate follow-on rather than hidden behind unusable placeholder buttons.
