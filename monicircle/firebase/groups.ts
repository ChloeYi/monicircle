import {
  collection,
  collectionGroup,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './config';

export type GroupCategory = 'friends' | 'family' | 'church' | 'work' | 'study' | 'other';
export type GroupStatus = 'forming' | 'active' | 'complete';
export type GroupCycle = 'weekly' | 'monthly';

export interface GroupData {
  title: string;
  category: GroupCategory;
  isPublic: boolean;
  gyejuId: string;
  contributionAmount: number;
  cycle: GroupCycle;
  recipientsPerCycle: number;
  paymentDay: number;
  startDate: Date;
  finishDate?: Date;
  joinDeadline: Date;
  totalMembers: number;
  sharedFundAmount?: number;
  status: GroupStatus;
  orderLocked: boolean;
}

export async function createGroup(data: Omit<GroupData, 'status' | 'orderLocked'>) {
  const ref = await addDoc(collection(db, 'groups'), {
    ...data,
    startDate: data.startDate,
    finishDate: data.finishDate ?? null,
    joinDeadline: data.joinDeadline,
    status: 'forming',
    orderLocked: false,
    createdAt: serverTimestamp(),
  });
  await addDoc(collection(db, 'groups', ref.id, 'members'), {
    userId: data.gyejuId,
    turnNumber: null,
    requestedTurn: null,
    status: 'approved',
    joinedAt: serverTimestamp(),
    paymentMethod: 'bank',
    paymentInfo: '',
  });
  return ref.id;
}

export async function getGroup(groupId: string) {
  const snap = await getDoc(doc(db, 'groups', groupId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function getUserGroups(userId: string) {
  const gyejuQuery = query(collection(db, 'groups'), where('gyejuId', '==', userId));
  const gyejuSnap = await getDocs(gyejuQuery);
  const gyejuGroups = gyejuSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

  // Also fetch groups where user is an approved member (not gyeju)
  const memberQuery = query(
    collectionGroup(db, 'members'),
    where('userId', '==', userId),
    where('status', '==', 'approved')
  );
  const memberSnap = await getDocs(memberQuery);
  const memberGroupIds = memberSnap.docs
    .map((d) => d.ref.parent.parent?.id)
    .filter((id): id is string => !!id);

  const gyejuIds = new Set(gyejuGroups.map((g: any) => g.id));
  const memberGroupDocs = await Promise.all(
    memberGroupIds.filter((id) => !gyejuIds.has(id)).map((id) => getGroup(id))
  );

  return [...gyejuGroups, ...memberGroupDocs.filter(Boolean)];
}

export async function requestJoinGroup(
  groupId: string,
  userId: string,
  paymentMethod: string,
  paymentInfo: string
) {
  return addDoc(collection(db, 'groups', groupId, 'members'), {
    userId,
    turnNumber: null,
    requestedTurn: null,
    status: 'pending',
    joinedAt: serverTimestamp(),
    paymentMethod,
    paymentInfo,
  });
}

export async function requestTurnSlot(
  groupId: string,
  memberId: string,
  requestedTurn: number
) {
  await updateDoc(doc(db, 'groups', groupId, 'members', memberId), { requestedTurn });
}

export async function getMemberRecord(groupId: string, userId: string) {
  const q = query(
    collection(db, 'groups', groupId, 'members'),
    where('userId', '==', userId)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as any;
}

export async function getSharedFundBalance(groupId: string): Promise<number> {
  const snap = await getDocs(collection(db, 'groups', groupId, 'spending'));
  const approved = snap.docs
    .map((d) => d.data())
    .filter((d) => d.status === 'approved')
    .reduce((sum, d) => sum + (d.amount ?? 0), 0);
  return approved;
}

export async function getPublicGroups() {
  const q = query(
    collection(db, 'groups'),
    where('isPublic', '==', true),
    where('status', 'in', ['forming', 'active']),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function lockRotationOrder(groupId: string) {
  await updateDoc(doc(db, 'groups', groupId), { orderLocked: true });
}

export async function unlockRotationOrder(groupId: string) {
  await updateDoc(doc(db, 'groups', groupId), { orderLocked: false });
}

export async function getGroupMembers(groupId: string) {
  const snap = await getDocs(collection(db, 'groups', groupId, 'members'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getUserProfile(userId: string) {
  const snap = await getDoc(doc(db, 'users', userId));
  return snap.exists() ? snap.data() : null;
}

export async function getActiveRound(groupId: string) {
  const q = query(
    collection(db, 'groups', groupId, 'rounds'),
    where('status', '==', 'active'),
    orderBy('roundNumber', 'asc')
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() } as any;
}

export async function getRounds(groupId: string) {
  const q = query(
    collection(db, 'groups', groupId, 'rounds'),
    orderBy('roundNumber', 'asc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export function subscribeGroup(
  groupId: string,
  callback: (data: any) => void
): Unsubscribe {
  return onSnapshot(doc(db, 'groups', groupId), (snap) => {
    if (snap.exists()) callback({ id: snap.id, ...snap.data() });
  });
}

export function subscribeRoundPayments(
  groupId: string,
  roundId: string,
  callback: (payments: any[]) => void
): Unsubscribe {
  return onSnapshot(
    collection(db, 'groups', groupId, 'rounds', roundId, 'payments'),
    (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  );
}

export async function approveMemberJoin(groupId: string, memberId: string) {
  await updateDoc(doc(db, 'groups', groupId, 'members', memberId), { status: 'approved' });
}

export async function rejectMemberJoin(groupId: string, memberId: string) {
  await updateDoc(doc(db, 'groups', groupId, 'members', memberId), { status: 'rejected' });
}

export async function assignTurnNumbers(
  groupId: string,
  assignments: { memberId: string; turnNumber: number }[]
) {
  await Promise.all(
    assignments.map(({ memberId, turnNumber }) =>
      updateDoc(doc(db, 'groups', groupId, 'members', memberId), { turnNumber })
    )
  );
}

export async function startGroup(groupId: string): Promise<void> {
  const groupSnap = await getDoc(doc(db, 'groups', groupId));
  const group = groupSnap.data();
  if (!group) throw new Error('Group not found');

  const membersSnap = await getDocs(
    query(collection(db, 'groups', groupId, 'members'), where('status', '==', 'approved'))
  );
  const members = membersSnap.docs.map((d) => ({ id: d.id, ...d.data() } as any));
  const totalRounds = members.length;

  // Create one round per member, sorted by turnNumber
  const sorted = [...members].sort((a, b) => (a.turnNumber ?? 99) - (b.turnNumber ?? 99));
  const startDate: Date = group.startDate?.toDate?.() ?? new Date();

  for (let i = 0; i < sorted.length; i++) {
    const m = sorted[i];
    const dueDate = new Date(startDate);
    if (group.cycle === 'monthly') dueDate.setMonth(dueDate.getMonth() + i);
    else dueDate.setDate(dueDate.getDate() + i * 7);

    await addDoc(collection(db, 'groups', groupId, 'rounds'), {
      roundNumber: i + 1,
      recipientId: m.userId,
      recipientName: m.userName ?? '',
      dueDate: Timestamp.fromDate(dueDate),
      amount: group.contributionAmount * totalRounds,
      status: i === 0 ? 'active' : 'upcoming',
      createdAt: serverTimestamp(),
    });
  }

  await updateDoc(doc(db, 'groups', groupId), {
    status: 'active',
    orderLocked: true,
    startedAt: serverTimestamp(),
  });
}

export async function completeGroup(groupId: string) {
  await updateDoc(doc(db, 'groups', groupId), {
    status: 'complete',
    completedAt: serverTimestamp(),
  });
}

export async function restartGroup(
  originalGroupId: string,
  gyejuId: string
): Promise<string> {
  const original = await getGroup(originalGroupId);
  if (!original) throw new Error('Group not found');
  const g = original as any;
  const now = new Date();
  const ref = await addDoc(collection(db, 'groups'), {
    title: g.title,
    category: g.category,
    isPublic: g.isPublic,
    gyejuId,
    contributionAmount: g.contributionAmount,
    cycle: g.cycle,
    recipientsPerCycle: g.recipientsPerCycle,
    paymentDay: g.paymentDay,
    startDate: now,
    joinDeadline: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
    totalMembers: g.totalMembers,
    sharedFundAmount: g.sharedFundAmount ?? 0,
    status: 'forming',
    orderLocked: false,
    previousGroupId: originalGroupId,
    createdAt: serverTimestamp(),
  });
  await addDoc(collection(db, 'groups', ref.id, 'members'), {
    userId: gyejuId,
    turnNumber: null,
    requestedTurn: null,
    status: 'approved',
    joinedAt: serverTimestamp(),
    paymentMethod: 'bank',
    paymentInfo: '',
  });
  return ref.id;
}
