import * as admin from 'firebase-admin';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';

admin.initializeApp();
const db = admin.firestore();

// ─── Expo Push API helper ────────────────────────────────────────────────────

async function sendPush(token: string, title: string, body: string): Promise<void> {
  if (!token.startsWith('ExponentPushToken')) return;
  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to: token, title, body, sound: 'default' }),
  });
}

async function sendToUser(userId: string, title: string, body: string): Promise<void> {
  const userDoc = await db.collection('users').doc(userId).get();
  const token = userDoc.data()?.expoPushToken;
  if (!token) return;
  await sendPush(token, title, body);
}

async function sendToGroup(groupId: string, title: string, body: string, excludeId?: string): Promise<void> {
  const members = await db.collection('groups').doc(groupId)
    .collection('members').where('status', '==', 'approved').get();
  for (const m of members.docs) {
    if (m.data().userId === excludeId) continue;
    await sendToUser(m.data().userId, title, body);
  }
}

function daysFromNow(date: admin.firestore.Timestamp): number {
  const now = new Date();
  const due = date.toDate();
  return Math.round((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

// ─── Trigger: Proof submitted → notify organizer ─────────────────────────────

export const onProofSubmitted = onDocumentCreated(
  'groups/{groupId}/proofs/{proofId}',
  async (event) => {
    const { groupId } = event.params;
    const data = event.data?.data();
    if (!data) return;

    const group = (await db.collection('groups').doc(groupId).get()).data();
    if (!group) return;

    await sendToUser(
      group.gyejuId,
      `[${group.title}] 납입 증빙 제출`,
      `${data.userName}님이 납입 증빙을 제출했습니다. 확인 후 승인해주세요.`
    );
  }
);

// ─── Trigger: Proof approved/rejected → notify member ────────────────────────

export const onProofStatusChanged = onDocumentUpdated(
  'groups/{groupId}/proofs/{proofId}',
  async (event) => {
    const { groupId } = event.params;
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    if (!before || !after) return;
    if (before.status === after.status) return;

    const group = (await db.collection('groups').doc(groupId).get()).data();
    if (!group) return;

    if (after.status === 'approved') {
      await sendToUser(
        after.userId,
        `[${group.title}] 납입 승인 ✓`,
        `${after.round}회차 납입이 승인되었습니다.`
      );
    } else if (after.status === 'rejected') {
      await sendToUser(
        after.userId,
        `[${group.title}] 납입 거절`,
        `${after.round}회차 납입이 거절되었습니다. 다시 업로드해주세요.`
      );
    }
  }
);

// ─── Trigger: Rotation order locked → notify all members ─────────────────────

export const onOrderLocked = onDocumentUpdated(
  'groups/{groupId}',
  async (event) => {
    const { groupId } = event.params;
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    if (!before || !after) return;
    if (before.orderLocked || !after.orderLocked) return;

    await sendToGroup(
      groupId,
      `[${after.title}] 순번 확정`,
      '순번이 확정되었습니다. 앱에서 내 순번을 확인하세요.'
    );
  }
);

// ─── Trigger: Spending vote proposed → notify all members ────────────────────

export const onSpendingProposed = onDocumentCreated(
  'groups/{groupId}/spending/{spendingId}',
  async (event) => {
    const { groupId } = event.params;
    const data = event.data?.data();
    if (!data) return;

    const group = (await db.collection('groups').doc(groupId).get()).data();
    if (!group) return;

    await sendToGroup(
      groupId,
      `[${group.title}] 지출 투표`,
      `₩${data.amount?.toLocaleString()} 지출 제안이 등록되었습니다. 투표에 참여해주세요.`,
      data.proposedBy
    );
  }
);

// ─── Daily scheduled job — payment reminders (9AM KST) ───────────────────────

export const dailyNotifications = onSchedule(
  { schedule: '0 0 * * *', timeZone: 'Asia/Seoul', region: 'asia-northeast3' },
  async () => {
    const groupsSnap = await db.collection('groups').where('status', '==', 'active').get();

    for (const groupDoc of groupsSnap.docs) {
      const group = groupDoc.data();
      const groupId = groupDoc.id;

      const roundsSnap = await db.collection('groups').doc(groupId)
        .collection('rounds').where('status', '==', 'active').get();

      for (const roundDoc of roundsSnap.docs) {
        const round = roundDoc.data();
        if (!round.dueDate) continue;

        const daysLeft = daysFromNow(round.dueDate);

        // Payment reminders: 7, 3, 1 days before and on due date
        if ([7, 3, 1, 0].includes(daysLeft)) {
          const label = daysLeft === 0 ? '오늘' : `${daysLeft}일 후`;
          await sendToGroup(
            groupId,
            `[${group.title}] 납입 알림`,
            `${round.roundNumber}회차 납입일이 ${label}입니다. ₩${group.contributionAmount?.toLocaleString()} 납입 후 증빙을 업로드해주세요.`
          );
        }

        // Overdue: 1 day after due date — check who hasn't submitted proof
        if (daysLeft === -1) {
          const proofsSnap = await db.collection('groups').doc(groupId)
            .collection('proofs')
            .where('round', '==', round.roundNumber)
            .where('status', '==', 'approved')
            .get();

          const paidIds = new Set(proofsSnap.docs.map((p) => p.data().userId));

          const membersSnap = await db.collection('groups').doc(groupId)
            .collection('members').where('status', '==', 'approved').get();

          for (const memberDoc of membersSnap.docs) {
            const userId = memberDoc.data().userId;
            if (paidIds.has(userId)) continue;

            await sendToUser(
              userId,
              `[${group.title}] 미납 안내`,
              `${round.roundNumber}회차 납입이 확인되지 않았습니다. 납입 후 증빙을 업로드해주세요.`
            );
            await sendToUser(
              group.gyejuId,
              `[${group.title}] 미납 멤버 있음`,
              `${round.roundNumber}회차 납입이 확인되지 않은 멤버가 있습니다.`
            );
          }
        }
      }
    }
  }
);
