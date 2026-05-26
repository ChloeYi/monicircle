import { useEffect, useState } from 'react';
import {
  StyleSheet, View, Text, FlatList, SafeAreaView,
  TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/context/auth';
import {
  getGroupMembers, getUserProfile, subscribeGroup,
  approveMemberJoin, rejectMemberJoin, assignTurnNumbers, startGroup,
} from '@/firebase/groups';
import { colors } from '@/constants/colors';
import { spacing, fontSize, radius, fontWeight } from '@/constants/theme';
import { t } from '@/i18n';

export default function MembersScreen() {
  const { id: groupId } = useLocalSearchParams<{ id: string }>();
  const { state } = useAuth();
  const router = useRouter();
  const [group, setGroup] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const currentUser = state.status === 'authenticated' ? state.user : null;
  const isGyeju = group?.gyejuId === currentUser?.uid;

  async function loadMembers() {
    if (!groupId) return;
    const raw = await getGroupMembers(groupId);
    const withNames = await Promise.all(
      raw.map(async (m: any) => {
        const p = await getUserProfile(m.userId);
        return { ...m, name: p?.name ?? 'Unknown', email: p?.email ?? '' };
      })
    );
    setMembers(withNames);
    setLoading(false);
  }

  useEffect(() => {
    if (!groupId) return;
    const unsub = subscribeGroup(groupId, setGroup);
    loadMembers();
    return unsub;
  }, [groupId]);

  async function handleApprove(memberId: string) {
    await approveMemberJoin(groupId!, memberId);
    await loadMembers();
  }

  async function handleReject(memberId: string) {
    Alert.alert('참여 거절', '이 요청을 거절하시겠습니까?', [
      { text: t('common.cancel'), style: 'cancel' },
      { text: '거절', style: 'destructive', onPress: async () => {
        await rejectMemberJoin(groupId!, memberId);
        await loadMembers();
      }},
    ]);
  }

  async function handleShuffleTurns() {
    const approvedMembers = members.filter((m) => m.status === 'approved');
    if (approvedMembers.length === 0) return;
    const shuffled = [...approvedMembers].sort(() => Math.random() - 0.5);
    const assignments = shuffled.map((m, i) => ({ memberId: m.id, turnNumber: i + 1 }));
    await assignTurnNumbers(groupId!, assignments);
    await loadMembers();
  }

  async function handleStartGroup() {
    const approvedMembers = members.filter((m) => m.status === 'approved');
    const allHaveTurns = approvedMembers.every((m) => m.turnNumber != null);
    if (!allHaveTurns) {
      Alert.alert('순번 필요', '모든 멤버의 순번을 지정한 후 시작할 수 있습니다. 자동 배정을 사용하세요.');
      return;
    }
    Alert.alert('계 시작', `${approvedMembers.length}명의 멤버로 계를 시작합니다. 계속하시겠습니까?`, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: '시작', onPress: async () => {
        try {
          await startGroup(groupId!);
          Alert.alert('완료', '계가 시작되었습니다!');
          router.back();
        } catch (e: any) {
          Alert.alert(t('common.error'), e.message);
        }
      }},
    ]);
  }

  const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
    approved: { color: colors.success,       bg: colors.success + '20', label: '참여 중' },
    pending:  { color: colors.warning,       bg: colors.warning + '20', label: '대기 중' },
    rejected: { color: colors.danger,        bg: colors.danger  + '15', label: '거절됨' },
  };

  const approved = members.filter((m) => m.status === 'approved');
  const pending  = members.filter((m) => m.status === 'pending');

  if (loading) {
    return <SafeAreaView style={styles.center}><ActivityIndicator color={colors.primary} size="large" /></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={20} color={colors.primary} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.title}>멤버 ({approved.length}/{group?.totalMembers ?? '?'})</Text>
          {pending.length > 0 && isGyeju && (
            <Text style={styles.subtitle}>{pending.length}명 승인 대기</Text>
          )}
        </View>
      </View>

      <FlatList
        data={[...pending, ...approved]}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListFooterComponent={isGyeju && group?.status === 'forming' ? (
          <View style={styles.footer}>
            <TouchableOpacity style={styles.shuffleBtn} onPress={handleShuffleTurns}>
              <MaterialCommunityIcons name="shuffle-variant" size={16} color={colors.primary} />
              <Text style={styles.shuffleBtnText}>순번 자동 배정</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.startBtn} onPress={handleStartGroup}>
              <MaterialCommunityIcons name="play-circle-outline" size={18} color="#fff" />
              <Text style={styles.startBtnText}>계 시작하기</Text>
            </TouchableOpacity>
          </View>
        ) : null}
        renderItem={({ item }) => {
          const cfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.approved;
          return (
            <View style={styles.row}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.name[0]?.toUpperCase()}</Text>
              </View>
              <View style={styles.info}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.meta}>
                  {item.turnNumber != null ? `Turn #${item.turnNumber}` : item.requestedTurn != null ? `Requested #${item.requestedTurn}` : 'No turn yet'}
                  {item.userId === group?.gyejuId ? ' · Organizer' : ''}
                </Text>
              </View>
              <View style={styles.right}>
                <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
                  <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
                </View>
                {isGyeju && item.status === 'pending' && (
                  <View style={styles.actions}>
                    <TouchableOpacity style={styles.approveBtn} onPress={() => handleApprove(item.id)}>
                      <Text style={styles.approveBtnText}>승인</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.rejectBtn} onPress={() => handleReject(item.id)}>
                      <Text style={styles.rejectBtnText}>거절</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  headerInfo: { flex: 1 },
  title: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text },
  subtitle: { fontSize: fontSize.xs, color: colors.warning },
  list: { padding: spacing.lg, gap: spacing.sm, paddingBottom: spacing.xxl },
  row: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, gap: spacing.md,
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.primary + '20', alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: colors.primary },
  info: { flex: 1 },
  name: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.text },
  meta: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  right: { alignItems: 'flex-end', gap: spacing.xs },
  badge: { borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  badgeText: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold },
  actions: { flexDirection: 'row', gap: spacing.xs },
  approveBtn: { backgroundColor: colors.primary, borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 4 },
  approveBtnText: { fontSize: 11, color: colors.surface, fontWeight: fontWeight.semibold },
  rejectBtn: { backgroundColor: colors.danger + '15', borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 4, borderWidth: 1, borderColor: colors.danger + '40' },
  rejectBtnText: { fontSize: 11, color: colors.danger, fontWeight: fontWeight.semibold },
  footer: { gap: spacing.sm, marginTop: spacing.lg },
  shuffleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    backgroundColor: colors.primaryBg, borderRadius: radius.md,
    paddingVertical: spacing.md, borderWidth: 1, borderColor: colors.primaryLighter,
  },
  shuffleBtnText: { fontSize: fontSize.sm, color: colors.primary, fontWeight: fontWeight.semibold },
  startBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: spacing.md,
  },
  startBtnText: { fontSize: fontSize.sm, color: '#fff', fontWeight: fontWeight.semibold },
});
