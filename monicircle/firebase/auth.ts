import {
  GoogleAuthProvider,
  signInWithCredential,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './config';

export async function signInWithGoogle(idToken: string) {
  const credential = GoogleAuthProvider.credential(idToken);
  const result = await signInWithCredential(auth, credential);
  return result.user;
}

export async function signInWithGoogleWeb() {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  return result.user;
}

export async function signOut() {
  await firebaseSignOut(auth);
}

export async function createOrUpdateUserProfile(
  user: User,
  data: { name: string; phone: string; photoUrl?: string }
) {
  await updateProfile(user, { displayName: data.name, photoURL: data.photoUrl });
  await setDoc(
    doc(db, 'users', user.uid),
    {
      name: data.name,
      phone: data.phone,
      photoUrl: data.photoUrl ?? null,
      email: user.email,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function getUserProfile(uid: string) {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data() : null;
}

export async function hasCompletedProfile(uid: string): Promise<boolean> {
  const profile = await getUserProfile(uid);
  return !!(profile?.name && profile?.phone);
}
