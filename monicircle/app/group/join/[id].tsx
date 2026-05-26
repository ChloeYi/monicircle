import { useEffect, useState } from 'react';
import {
  StyleSheet, View, Text, SafeAreaView,
  TouchableOpacity, ScrollView, ActivityIndicator, Alert, Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@/context/auth';
import { getGroup, getMemberRecord, requestJoinGroup } from '@/firebase/groups';
import { colors } from '@/constants/colors';
import { spacing, fontSize, radius, fontWeight } from '@/constants/theme';
import { t } from '@/i18n';
import { isKorean } from '@/i18n';

type PaymentMethod = 'kakao' | 'toss' | 'bank';

const PAYMENT_METHODS: { id: PaymentMethod; label: string; koreanOnly: boolean }[] = [
  { id: 'kakao', label: '카카오페이', koreanOnly: true },
  { id: 'toss',  label: '토스',       koreanOnly: true },
  { id: 'bank',  label: t('payment.bank'), koreanOnly: false },
];

export default function JoinGroupScreen() {
  const { id: groupId } = useLocalSearchParams<{ id: string }>();
  const { state } = useAuth();
  const router = useRouter();
  const [group, setGroup] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [alreadyMember, setAlreadyMember] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank');

  const currentUser = state.status === 'authenticated' ? state.user : null;
  const showKorean = isKorean() || Platform.OS !== 'web';
  const availableMethods = PAYMENT_METHODS.filter((m) => showKorean || !m.koreanOnly);

  useEffect(() => {
    async function init() {
      if (!groupId || !currentUser) return;
      const [g, member] = await Promise.all([
        getGroup(groupId),
        getMemberRecord(groupId, currentUser.uid),
      ]);
      setGroup(g);
      if (member) setAlreadyMember(true);
      setLoading(false);
    }
    init();
  }, [groupId, currentUser?.uid]);

  async function handleJoin() {
    if (!currentUser || !groupId) return;
    setJoining(true);
    try {
      await requestJoinGroup(groupId, currentUser.uid, paymentMethod, '');
      Alert.alert('요청 완료', '참여 요청이 전송되었습니다. 계주 승인을 기다려주세요.', [
        { text: '확인', onPress: () => router.replace(`/group/join/pick-slot?groupId=${groupId}`) },
      ]);
    } catch (e: any) {
      Alert.alert(t('common.error'), e.message);
    } finally {
      setJoining(false);
    }
  }

  const CATEGORY_EMOJI: Record<string, string> = {
    friends: '👥', family: '👪', church: '⛪', work: '💼', study: '📚', other: '✨',
  };

  if (loading) {
    return <SafeAreaView style={styles.center}><ActivityIndicator color={colors.primary} size="large" /></SafeAreaView>;
  }

  if (!group) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.errorText}>계 모임을 찾을 수 없습니다</Text>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.backLink}>← 돌아가기</Text></TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>계 참여하기</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Group Info */}
        <View style={styles.groupCard}>
          <Text style={styles.groupEmoji}>{CATEGORY_EMOJI[group.category] ?? '⭕'}</Text>
          <Text style={styles.groupTitle}>{group.title}</Text>
          <Text style={styles.groupSub}>{t(`categories.${group.category}`)} · {group.isPublic ? t('create.public') : t('create.private')}</Text>

          <View style={styles.stats}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>₩{group.contributionAmount?.toLocaleString()}</Text>
              <Text style={styles.statLabel}>납입금{t('group.contribution')}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{group.totalMembers}명</Text>
              <Text style={styles.statLabel}>총 인원</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{t(`create.${group.cycle}`)}</Text>
              <Text style={styles.statLabel}>납입 주기</Text>
            </View>
          </View>
        </View>

        {alreadyMember ? (
          <View style={styles.alreadyCard}>
            <Text style={styles.alreadyText}>✓ 이미 참여 중인 계 모임입니다</Text>
            <TouchableOpacity
              style={styles.goBtn}
              onPress={() => router.replace(`/group/${groupId}`)}
            >
              <Text style={styles.goBtnText}>모임 바로가기 →</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={styles.sectionTitle}>납입 방법 선택</Text>
            <View style={styles.methodList}>
              {availableMethods.map((m) => (
                <TouchableOpacity
                  key={m.id}
                  style={[styles.methodRow, paymentMethod === m.id && styles.methodRowActive]}
                  onPress={() => setPaymentMethod(m.id)}
                >
                  <View style={[styles.radio, paymentMethod === m.id && styles.radioActive]}>
                    {paymentMethod === m.id && <View style={styles.radioDot} />}
                  </View>
                  <Text style={[styles.methodLabel, paymentMethod === m.id && styles.methodLabelActive]}>
                    {m.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.notice}>
              <Text style={styles.noticeText}>
                💡 계주 승인 후 순번을 선택할 수 있습니다. 납입금은 앱 외부에서 직접 송금합니다.
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.joinBtn, joining && styles.disabled]}
              onPress={handleJoin}
              disabled={joining}
            >
              {joining
                ? <ActivityIndicator color={colors.surface} />
                : <Text style={styles.joinBtnText}>참여 요청하기</Text>
              }
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  errorText: { fontSize: fontSize.md, color: colors.textSecondary },
  backLink: { fontSize: fontSize.sm, color: colors.primary },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  back: { fontSize: 28, color: colors.primary, lineHeight: 30 },
  headerTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl },
  groupCard: {
    backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.lg,
    alignItems: 'center', gap: spacing.sm,
  },
  groupEmoji: { fontSize: 48 },
  groupTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.text, textAlign: 'center' },
  groupSub: { fontSize: fontSize.sm, color: colors.textSecondary },
  stats: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm, width: '100%' },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.text },
  statLabel: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  divider: { width: 1, height: 32, backgroundColor: colors.border },
  alreadyCard: {
    backgroundColor: colors.success + '15', borderRadius: radius.xl, padding: spacing.lg,
    alignItems: 'center', gap: spacing.md, borderWidth: 1, borderColor: colors.success + '40',
  },
  alreadyText: { fontSize: fontSize.md, color: colors.success, fontWeight: fontWeight.semibold },
  goBtn: { backgroundColor: colors.primary, borderRadius: radius.lg, paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
  goBtnText: { fontSize: fontSize.md, color: colors.surface, fontWeight: fontWeight.semibold },
  sectionTitle: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.text },
  methodList: { gap: spacing.sm },
  methodRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md,
    borderWidth: 1, borderColor: colors.border,
  },
  methodRowActive: { borderColor: colors.primary, backgroundColor: colors.primary + '08' },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  methodLabel: { fontSize: fontSize.md, color: colors.text },
  methodLabelActive: { color: colors.primary, fontWeight: fontWeight.semibold },
  notice: { backgroundColor: colors.warning + '15', borderRadius: radius.md, padding: spacing.md },
  noticeText: { fontSize: fontSize.xs, color: colors.text, lineHeight: 18 },
  joinBtn: {
    backgroundColor: colors.primary, borderRadius: radius.lg,
    paddingVertical: spacing.md + 2, alignItems: 'center',
  },
  joinBtnText: { fontSize: fontSize.md, color: colors.surface, fontWeight: fontWeight.semibold },
  disabled: { opacity: 0.6 },
});
