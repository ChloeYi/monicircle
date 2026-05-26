import { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@/context/auth';
import {
  getGroup,
  getGroupMembers,
  getUserProfile,
  completeGroup,
  restartGroup,
  getSharedFundBalance,
} from '@/firebase/groups';
import { calcLeftoverSplit } from '@/firebase/calculations';
import { colors } from '@/constants/colors';
import { spacing, fontSize, radius, fontWeight } from '@/constants/theme';
import { t } from '@/i18n';

type MemberSummary = {
  id: string;
  userId: string;
  name: string;
  turnNumber: number | null;
  totalPaid: number;
  potReceived: number;
};

export default function CompleteScreen() {
  const { id: groupId } = useLocalSearchParams<{ id: string }>();
  const { state } = useAuth();
  const router = useRouter();

  const [group, setGroup] = useState<any>(null);
  const [members, setMembers] = useState<MemberSummary[]>([]);
  const [totalSpent, setTotalSpent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [restarting, setRestarting] = useState(false);

  const currentUser = state.status === 'authenticated' ? state.user : null;
  const isGyeju = group?.gyejuId === currentUser?.uid;

  useEffect(() => {
    if (!groupId) return;
    load();
  }, [groupId]);

  async function load() {
    const g = await getGroup(groupId!);
    setGroup(g);

    const raw = await getGroupMembers(groupId!);
    const approved = raw.filter((m: any) => m.status === 'approved');

    const withProfiles = await Promise.all(
      approved.map(async (m: any) => {
        const profile = await getUserProfile(m.userId);
        const potReceived =
          m.turnNumber != null ? (g as any).contributionAmount * (g as any).totalMembers : 0;
        return {
          id: m.id,
          userId: m.userId,
          name: profile?.name ?? profile?.email ?? 'Unknown',
          turnNumber: m.turnNumber ?? null,
          totalPaid: (g as any).contributionAmount * (g as any).totalMembers,
          potReceived,
        } as MemberSummary;
      })
    );
    setMembers(withProfiles);

    const spent = await getSharedFundBalance(groupId!);
    setTotalSpent(spent);

    setLoading(false);
  }

  async function handleComplete() {
    if (!groupId || !isGyeju) return;
    Alert.alert(
      '계 완료 확정',
      '모든 멤버의 정산이 완료되었습니까? 이 작업은 되돌릴 수 없습니다.',
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: '완료 확정',
          style: 'destructive',
          onPress: async () => {
            setCompleting(true);
            try {
              await completeGroup(groupId);
              Alert.alert('완료', '계 모임이 성공적으로 완료되었습니다!', [
                { text: '확인', onPress: () => router.replace('/(tabs)') },
              ]);
            } catch (e: any) {
              Alert.alert(t('common.error'), e.message);
            } finally {
              setCompleting(false);
            }
          },
        },
      ]
    );
  }

  async function handleRestart() {
    if (!groupId || !currentUser || !isGyeju) return;
    Alert.alert(
      '같은 조건으로 재시작',
      '같은 설정으로 새 계를 시작합니다. 멤버들이 다시 참여 신청을 해야 합니다.',
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: '재시작',
          onPress: async () => {
            setRestarting(true);
            try {
              const newId = await restartGroup(groupId, currentUser.uid);
              Alert.alert('완료', '새 계가 생성되었습니다!', [
                { text: '보러 가기', onPress: () => router.replace(`/group/${newId}`) },
              ]);
            } catch (e: any) {
              Alert.alert(t('common.error'), e.message);
            } finally {
              setRestarting(false);
            }
          },
        },
      ]
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </SafeAreaView>
    );
  }

  if (!group) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.errorText}>계 모임을 찾을 수 없습니다</Text>
      </SafeAreaView>
    );
  }

  const totalRounds = group.totalMembers as number;
  const contribution = group.contributionAmount as number;
  const sharedFund = group.sharedFundAmount ?? 0;
  const totalCollected = contribution * totalRounds * totalRounds;

  const leftover =
    sharedFund > 0
      ? calcLeftoverSplit(sharedFund, totalRounds, totalRounds, totalSpent)
      : null;

  const isAlreadyComplete = group.status === 'complete';

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={20} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>계 마무리</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Hero */}
        <View style={styles.hero}>
          <MaterialCommunityIcons name="party-popper" size={56} color={colors.primary} />
          <Text style={styles.heroTitle}>{group.title}</Text>
          <Text style={styles.heroSub}>
            {totalRounds}회 완주 {isAlreadyComplete ? '완료' : '예정'}
          </Text>
          {isAlreadyComplete && (
            <View style={styles.completeBadge}>
              <MaterialCommunityIcons name="check" size={14} color={colors.success} />
              <Text style={styles.completeBadgeText}>계 완료</Text>
            </View>
          )}
        </View>

        {/* Summary Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>총 회차</Text>
            <Text style={styles.statValue}>{totalRounds}회</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>회당 납입액</Text>
            <Text style={styles.statValue}>₩{contribution.toLocaleString()}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>1인당 받은 금액</Text>
            <Text style={styles.statValue}>
              ₩{(contribution * totalRounds).toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Shared Fund Leftover */}
        {leftover && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>공동 적립금 잔액 분배</Text>
            <View style={styles.leftoverCard}>
              <View style={styles.leftoverRow}>
                <Text style={styles.leftoverLabel}>총 적립</Text>
                <Text style={styles.leftoverValue}>
                  ₩{(sharedFund * totalRounds * totalRounds).toLocaleString()}
                </Text>
              </View>
              <View style={styles.leftoverRow}>
                <Text style={styles.leftoverLabel}>총 지출</Text>
                <Text style={[styles.leftoverValue, { color: colors.danger }]}>
                  -₩{totalSpent.toLocaleString()}
                </Text>
              </View>
              <View style={[styles.leftoverRow, styles.leftoverTotal]}>
                <Text style={styles.leftoverTotalLabel}>1인당 환급</Text>
                <Text style={styles.leftoverTotalValue}>
                  ₩{Math.floor(leftover.perMember).toLocaleString()}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Member Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>멤버별 정산 요약</Text>
          <View style={styles.memberList}>
            {members
              .sort((a, b) => (a.turnNumber ?? 99) - (b.turnNumber ?? 99))
              .map((member) => (
                <View key={member.id} style={styles.memberRow}>
                  <View style={styles.memberAvatarWrap}>
                    <View style={styles.memberAvatar}>
                      <Text style={styles.memberAvatarText}>
                        {member.name[0]?.toUpperCase()}
                      </Text>
                    </View>
                    {member.turnNumber != null && (
                      <View style={styles.turnBadge}>
                        <Text style={styles.turnBadgeText}>{member.turnNumber}</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>{member.name}</Text>
                    <Text style={styles.memberMeta}>
                      납입 ₩{member.totalPaid.toLocaleString()} · 수령{' '}
                      {member.potReceived > 0
                        ? `₩${member.potReceived.toLocaleString()}`
                        : '미수령'}
                    </Text>
                    {leftover && (
                      <Text style={styles.memberRefund}>
                        + 환급 ₩{Math.floor(leftover.perMember).toLocaleString()}
                      </Text>
                    )}
                  </View>
                  <View style={styles.memberNetWrap}>
                    <Text style={styles.memberNetLabel}>실수령</Text>
                    <Text
                      style={[
                        styles.memberNet,
                        member.potReceived - member.totalPaid >= 0
                          ? { color: colors.success }
                          : { color: colors.danger },
                      ]}
                    >
                      {member.potReceived - member.totalPaid >= 0 ? '+' : ''}
                      ₩{(member.potReceived - member.totalPaid).toLocaleString()}
                    </Text>
                  </View>
                </View>
              ))}
          </View>
        </View>

        {/* Notice */}
        <View style={styles.notice}>
          <MaterialCommunityIcons name="information-outline" size={16} color={colors.text} style={{ marginTop: 1 }} />
          <Text style={styles.noticeText}>
            이 앱은 기록 전용입니다. 실제 송금은 각자 확인 후 직접 진행하세요.
          </Text>
        </View>

        {/* Actions (gyeju only, not yet complete) */}
        {isGyeju && !isAlreadyComplete && (
          <View style={styles.actionBlock}>
            <TouchableOpacity
              style={[styles.primaryBtn, completing && styles.btnDisabled]}
              onPress={handleComplete}
              disabled={completing}
            >
              {completing ? (
                <ActivityIndicator color={colors.surface} size="small" />
              ) : (
                <Text style={styles.primaryBtnText}>모두 정산 완료 확정</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.secondaryBtn, restarting && styles.btnDisabled]}
              onPress={handleRestart}
              disabled={restarting}
            >
              {restarting ? (
                <ActivityIndicator color={colors.primary} size="small" />
              ) : (
                <Text style={styles.secondaryBtnText}>같은 조건으로 재시작</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Restart only (already complete, gyeju) */}
        {isGyeju && isAlreadyComplete && (
          <View style={styles.actionBlock}>
            <TouchableOpacity
              style={[styles.secondaryBtn, restarting && styles.btnDisabled]}
              onPress={handleRestart}
              disabled={restarting}
            >
              {restarting ? (
                <ActivityIndicator color={colors.primary} size="small" />
              ) : (
                <Text style={styles.secondaryBtnText}>같은 조건으로 새 계 시작</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  errorText: { fontSize: fontSize.md, color: colors.textSecondary },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { padding: spacing.xs, width: 36 },
  headerTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text },

  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl },

  hero: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  heroTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.text, textAlign: 'center' },
  heroSub: { fontSize: fontSize.sm, color: colors.textSecondary },
  completeBadge: {
    backgroundColor: colors.success + '20',
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginTop: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  completeBadgeText: { fontSize: fontSize.sm, color: colors.success, fontWeight: fontWeight.semibold },

  statsRow: { flexDirection: 'row', gap: spacing.sm },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
    gap: 4,
  },
  statLabel: { fontSize: 10, color: colors.textSecondary, textAlign: 'center' },
  statValue: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: colors.primary, textAlign: 'center' },

  section: { gap: spacing.md },
  sectionTitle: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.text },

  leftoverCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  leftoverRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  leftoverLabel: { fontSize: fontSize.sm, color: colors.textSecondary },
  leftoverValue: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.text },
  leftoverTotal: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    marginTop: spacing.xs,
  },
  leftoverTotalLabel: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.text },
  leftoverTotalValue: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.primary },

  memberList: { gap: spacing.sm },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
  },
  memberAvatarWrap: { position: 'relative' },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarText: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.primary },
  turnBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.surface,
  },
  turnBadgeText: { fontSize: 9, color: colors.surface, fontWeight: fontWeight.bold },
  memberInfo: { flex: 1, gap: 2 },
  memberName: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.text },
  memberMeta: { fontSize: 11, color: colors.textSecondary },
  memberRefund: { fontSize: 11, color: colors.success, fontWeight: fontWeight.medium },
  memberNetWrap: { alignItems: 'flex-end', gap: 2 },
  memberNetLabel: { fontSize: 10, color: colors.textLight },
  memberNet: { fontSize: fontSize.sm, fontWeight: fontWeight.bold },

  notice: {
    backgroundColor: colors.warning + '20',
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    gap: spacing.xs,
    alignItems: 'flex-start',
  },
  noticeText: { fontSize: fontSize.xs, color: colors.text, lineHeight: 18, flex: 1 },

  actionBlock: { gap: spacing.sm },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.md + 2,
    alignItems: 'center',
  },
  primaryBtnText: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.surface },
  secondaryBtn: {
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  secondaryBtnText: { fontSize: fontSize.md, fontWeight: fontWeight.medium, color: colors.primary },
  btnDisabled: { opacity: 0.6 },
});
