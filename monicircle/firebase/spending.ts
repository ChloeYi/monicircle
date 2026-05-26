import {
  collection,
  doc,
  addDoc,
  getDocs,
  updateDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './config';

export async function proposeSpending(
  groupId: string,
  proposedBy: string,
  amount: number,
  description: string,
  roundId: string,
  receiptUri: string
) {
  const blob = await (await fetch(receiptUri)).blob();
  const storageRef = ref(storage, `receipts/${groupId}/${Date.now()}`);
  await uploadBytes(storageRef, blob);
  const receiptImageUrl = await getDownloadURL(storageRef);

  return addDoc(collection(db, 'groups', groupId, 'spending'), {
    proposedBy,
    amount,
    description,
    receiptImageUrl,
    roundId,
    status: 'voting',
    votes: {},
    createdAt: serverTimestamp(),
    resolvedAt: null,
  });
}

export async function castVote(
  groupId: string,
  spendingId: string,
  userId: string,
  vote: 'approve' | 'reject',
  totalMembers: number
) {
  const spendingRef = doc(db, 'groups', groupId, 'spending', spendingId);
  const snap = await import('firebase/firestore').then(({ getDoc }) => getDoc(spendingRef));
  const data = snap.data()!;
  const votes = { ...data.votes, [userId]: vote };

  const approveCount = Object.values(votes).filter((v) => v === 'approve').length;
  const rejectCount = Object.values(votes).filter((v) => v === 'reject').length;
  const majority = Math.floor(totalMembers / 2) + 1;

  let status = 'voting';
  if (approveCount >= majority) status = 'approved';
  else if (rejectCount >= majority) status = 'rejected';

  await updateDoc(spendingRef, {
    votes,
    status,
    resolvedAt: status !== 'voting' ? serverTimestamp() : null,
  });
}

export async function getGroupSpending(groupId: string) {
  const snap = await getDocs(collection(db, 'groups', groupId, 'spending'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export function subscribeSpending(
  groupId: string,
  callback: (items: any[]) => void
): Unsubscribe {
  const q = query(
    collection(db, 'groups', groupId, 'spending'),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
}
