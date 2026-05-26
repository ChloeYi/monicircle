import {
  collection,
  doc,
  addDoc,
  getDocs,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './config';

export type PaymentStatus = 'pending' | 'approved' | 'rejected' | 'overdue';

export async function submitPaymentProof(
  groupId: string,
  roundId: string,
  memberId: string,
  imageUri: string
) {
  const blob = await (await fetch(imageUri)).blob();
  const storageRef = ref(storage, `proofs/${groupId}/${roundId}/${memberId}_${Date.now()}`);
  await uploadBytes(storageRef, blob);
  const proofImageUrl = await getDownloadURL(storageRef);

  return addDoc(collection(db, 'groups', groupId, 'rounds', roundId, 'payments'), {
    memberId,
    proofImageUrl,
    submittedAt: serverTimestamp(),
    status: 'pending',
    approvedBy: null,
    approvedAt: null,
    note: null,
  });
}

export async function approvePayment(
  groupId: string,
  roundId: string,
  paymentId: string,
  approverId: string
) {
  await updateDoc(doc(db, 'groups', groupId, 'rounds', roundId, 'payments', paymentId), {
    status: 'approved',
    approvedBy: approverId,
    approvedAt: serverTimestamp(),
  });
}

export async function rejectPayment(
  groupId: string,
  roundId: string,
  paymentId: string,
  approverId: string,
  note: string
) {
  await updateDoc(doc(db, 'groups', groupId, 'rounds', roundId, 'payments', paymentId), {
    status: 'rejected',
    approvedBy: approverId,
    approvedAt: serverTimestamp(),
    note,
  });
}

export async function getRoundPayments(groupId: string, roundId: string) {
  const snap = await getDocs(
    collection(db, 'groups', groupId, 'rounds', roundId, 'payments')
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
