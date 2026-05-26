import {
  collection,
  doc,
  addDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { db, storage } from './config';

export type ProofStatus = 'pending' | 'approved' | 'rejected';

export type PaymentProof = {
  id: string;
  userId: string;
  userName: string;
  userInitials: string;
  method: string;
  amount: number;
  recipient: string;
  round: number;
  imageUrl: string;
  storagePath: string;
  submittedAt: any;
  status: ProofStatus;
};

// Compress image to max 1000px wide, JPEG 70% before upload
async function compressImage(uri: string): Promise<Blob> {
  const result = await manipulateAsync(
    uri,
    [{ resize: { width: 1000 } }],
    { compress: 0.7, format: SaveFormat.JPEG }
  );
  const response = await fetch(result.uri);
  return response.blob();
}

export async function uploadProof({
  groupId,
  roundNumber,
  userId,
  userName,
  userInitials,
  method,
  amount,
  recipient,
  imageUri,
}: {
  groupId: string;
  roundNumber: number;
  userId: string;
  userName: string;
  userInitials: string;
  method: string;
  amount: number;
  recipient: string;
  imageUri: string;
}): Promise<void> {
  const blob = await compressImage(imageUri);
  const storagePath = `proofs/${groupId}/${roundNumber}/${userId}_${Date.now()}.jpg`;
  const storageRef = ref(storage, storagePath);
  await uploadBytes(storageRef, blob);
  const imageUrl = await getDownloadURL(storageRef);

  await addDoc(collection(db, 'groups', groupId, 'proofs'), {
    userId,
    userName,
    userInitials,
    method,
    amount,
    recipient,
    round: roundNumber,
    imageUrl,
    storagePath,
    submittedAt: serverTimestamp(),
    status: 'pending',
  });
}

export async function approveProof(groupId: string, proofId: string, storagePath: string): Promise<void> {
  await updateDoc(doc(db, 'groups', groupId, 'proofs', proofId), {
    status: 'approved',
  });
  // Delete image from Storage to keep usage small
  try {
    await deleteObject(ref(storage, storagePath));
  } catch (_) {}
}

export async function rejectProof(groupId: string, proofId: string, storagePath: string): Promise<void> {
  await updateDoc(doc(db, 'groups', groupId, 'proofs', proofId), {
    status: 'rejected',
  });
  // Delete image from Storage to keep usage small
  try {
    await deleteObject(ref(storage, storagePath));
  } catch (_) {}
}

export function subscribeProofs(
  groupId: string,
  callback: (proofs: PaymentProof[]) => void
): Unsubscribe {
  const q = query(
    collection(db, 'groups', groupId, 'proofs'),
    where('status', '==', 'pending'),
    orderBy('submittedAt', 'desc')
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as PaymentProof)));
  });
}

export async function getMyProofForRound(
  groupId: string,
  roundNumber: number,
  userId: string
): Promise<PaymentProof | null> {
  const q = query(
    collection(db, 'groups', groupId, 'proofs'),
    where('userId', '==', userId),
    where('round', '==', roundNumber)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() } as PaymentProof;
}
