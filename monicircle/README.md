# MoniCircle (모니서클)

A mobile app for managing Korean rotating savings groups (계, "gye"). Members contribute a fixed amount each cycle, and one person receives the full pool per round — rotating until everyone has received once.

Built with **Expo SDK 56** and **Firebase 12**.

---

## Features

- **Create & join circles** — public or private, weekly or monthly cycles
- **Rotation dashboard** — visual SVG ring showing turn order and current round
- **Payment proof** — members upload screenshots; organizer approves/rejects (compressed + auto-deleted from Storage after review)
- **Spending votes** — members propose shared fund spending; majority vote auto-resolves
- **Push notifications** — payment reminders, proof approvals, order lock confirmations via Expo Push API + Cloud Functions
- **Organizer tools** — approve members, shuffle/assign turn order, start group
- **Korean/English toggle** — i18n with ko.json / en.json
- **Product tour** — SVG spotlight coachmarks on first login

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Expo SDK 56, expo-router v4 |
| Language | TypeScript |
| Auth | Firebase Auth (Google OAuth) |
| Database | Cloud Firestore |
| Storage | Firebase Storage |
| Backend | Firebase Cloud Functions v2 |
| Notifications | Expo Push API |
| UI | React Native, react-native-svg, @expo/vector-icons |

---

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/ChloeYi/monicircle.git
cd monicircle
npm install
```

### 2. Set up environment variables

Copy `.env.example` to `.env` and fill in your Firebase project values:

```bash
cp .env.example .env
```

```env
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=...
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
EXPO_PUBLIC_FIREBASE_APP_ID=...

EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=...
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=...
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=...
```

Get these from [Firebase Console](https://console.firebase.google.com) → Project Settings → Your apps.

### 3. Run the app

```bash
npx expo start
```

Scan the QR code with Expo Go, or press `i` for iOS simulator / `a` for Android emulator.

---

## Firebase Setup

### Firestore indexes

Deploy the composite indexes:

```bash
npx firebase-tools deploy --only firestore:indexes --project monicircle
```

Or use the direct console link in `firestore.indexes.json`.

### Security rules

```bash
npx firebase-tools deploy --only firestore:rules --project monicircle
```

### Cloud Functions

```bash
cd functions
npm install
cd ..
npx firebase-tools deploy --only functions --project monicircle
```

Functions handle:
- Proof submitted → notify organizer
- Proof approved/rejected → notify member
- Rotation order locked → notify all members
- Spending vote proposed → notify all members
- Daily 9AM KST: payment reminders (7/3/1/0 days before due) + overdue alerts

---

## Project Structure

```
app/
├── (auth)/          # login, profile setup
├── (tabs)/          # home, calendar, notifications, profile
├── group/
│   ├── create.tsx
│   ├── [id]/        # dashboard, members, approvals, spending, schedule
│   └── join/        # join request, turn slot picker
├── member/          # payment proof upload
└── discover/        # browse public circles
firebase/            # Firestore + Storage helpers
functions/src/       # Cloud Functions v2
context/             # Auth, Language, Tour providers
components/          # BrandHeader, TourOverlay, shared UI
constants/           # colors, theme tokens
i18n/                # ko.json, en.json
```

---

## Firestore Data Model

```
groups/{groupId}
  ├── members/{memberId}
  ├── rounds/{roundId}
  ├── proofs/{proofId}
  └── spending/{spendingId}

users/{userId}
```

---

## Environment

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- Firebase CLI (`npm install -g firebase-tools`)
