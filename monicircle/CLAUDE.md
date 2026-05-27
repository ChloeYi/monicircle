@AGENTS.md

# MoniCircle — Project Overview for Claude

## What this app is
MoniCircle (모니서클) is a Korean rotating savings group (계, "gye") app. Members pool money each cycle, and one person receives the full pot per round. The app handles group creation, member management, payment proof uploads, spending votes, and push notifications.

## Tech stack
- **Expo SDK 56** (`expo-router` v4, file-based routing)
- **Firebase 12** — Auth (Google OAuth), Firestore, Storage, Cloud Functions v2
- **React Native** with TypeScript
- **i18n-js** for Korean/English toggle

## Key rules
- Always read versioned Expo docs at https://docs.expo.dev/versions/v56.0.0/ before writing Expo code
- Use `useLocalSearchParams<{ id: string }>()` for dynamic route params — never `useSearchParams`
- Back navigation: always guard with `router.canGoBack() ? router.back() : router.replace('/(tabs)')`
- **Storage rule**: compress images before upload (1000px, 70% JPEG via `expo-image-manipulator`), delete from Storage immediately after approve/reject decision
- No hardcoded secrets — all Firebase config comes from `EXPO_PUBLIC_*` env vars in `.env`

## Project structure
```
app/
  (auth)/         login, profile-setup
  (tabs)/         home, calendar, notifications, profile
  group/
    create.tsx
    [id]/         index (dashboard), members, approvals, spending, schedule, complete
    join/         [id] (join request), pick-slot
  member/
    [groupId].tsx payment proof upload screen
  discover/       public group search
firebase/
  config.ts       env-var-driven Firebase init
  auth.ts         Google sign-in, profile check
  groups.ts       CRUD + startGroup, subscribeGroup, getUserGroups
  proofs.ts       uploadProof, approveProof, rejectProof, subscribeProofs
  spending.ts     proposeSpending, castVote, subscribeSpending
  notifications.ts registerPushToken (Expo push token)
functions/src/
  index.ts        Cloud Functions v2: proof notifications, order lock, spending vote, daily reminders
context/
  auth.tsx        AuthProvider, useAuth — status: loading | unauthenticated | needs-profile | authenticated
  language.tsx    LanguageProvider, useLanguage — KO/EN toggle
  tour.tsx        TourProvider, useTour — first-login product tour
components/
  BrandHeader.tsx  shared topbar with logo
  TourOverlay.tsx  SVG spotlight coachmark overlay
constants/
  colors.ts        design tokens
  theme.ts         spacing, fontSize, radius, fontWeight
i18n/
  index.ts, ko.json, en.json
```

## Firestore data model
```
groups/{groupId}
  gyejuId, title, category, isPublic, contributionAmount, cycle,
  totalMembers, startDate, joinDeadline, status (forming|active|complete), orderLocked

  members/{memberId}   userId, turnNumber, status (pending|approved|rejected), paymentMethod
  rounds/{roundId}     roundNumber, recipientId, dueDate, amount, status (active|upcoming|complete)
  proofs/{proofId}     userId, roundNumber, imageUrl, storagePath, status (pending|approved|rejected)
  spending/{spendingId} description, amount, votes:{userId:approve|reject}, status (voting|approved|rejected)

users/{userId}
  name, email, expoPushToken
```

## Deployment
- Firestore rules: `npx firebase-tools deploy --only firestore:rules --project monicircle`
- Cloud Functions: `cd functions && npm install && cd .. && npx firebase-tools deploy --only functions --project monicircle`
- Requires `npx firebase-tools login` in Terminal first (interactive, can't run in Claude)
