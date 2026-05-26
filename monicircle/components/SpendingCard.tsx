import { StyleSheet, View, Text, TouchableOpacity, Image } from 'react-native';
import { colors } from '@/constants/colors';
import { spacing, fontSize, radius, fontWeight } from '@/constants/theme';
import { t } from '@/i18n';

type SpendingCardProps = {
  item: {
    id: string;
    description: string;
    amount: number;
    proposedByName: string;
    receiptImageUrl?: string;
    status: 'voting' | 'approved' | 'rejected';
    votes: Record<string, 'approve' | 'reject'>;
  };
  totalMembers: number;
  currentUserId: string;
  onApprove: () => void;
  onReject: () => void;
  onViewReceipt?: () => void;
};

const STATUS_CONFIG = {
  voting:   { label: 'spending.voting',   color: colors.warning, bg: colors.warning + '20' },
  approved: { label: 'spending.approved', color: colors.success, bg: colors.success + '20' },
  rejected: { label: 'spending.rejected', color: colors.danger,  bg: colors.danger  + '20' },
};

export default function SpendingCard({
  item,
  totalMembers,
  currentUserId,
  onApprove,
  onReject,
  onViewReceipt,
}: SpendingCardProps) {
  const cfg = STATUS_CONFIG[item.status];
  const approveCount = Object.values(item.votes).filter((v) => v === 'approve').length;
  const rejectCount  = Object.values(item.votes).filter((v) => v === 'reject').length;
  const myVote = item.votes[currentUserId];
  const canVote = item.status === 'voting' && !myVote;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.amount}>₩{item.amount.toLocaleString()}</Text>
          <Text style={styles.proposedBy}>{item.proposedByName} 제안</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
          <Text style={[styles.statusText, { color: cfg.color }]}>{t(cfg.label)}</Text>
        </View>
      </View>

      <Text style={styles.description}>{item.description}</Text>

      {item.receiptImageUrl && (
        <TouchableOpacity onPress={onViewReceipt}>
          <Image source={{ uri: item.receiptImageUrl }} style={styles.receipt} />
        </TouchableOpacity>
      )}

      <View style={styles.voteRow}>
        <Text style={styles.voteCount}>
          ✓ {approveCount}  ✕ {rejectCount}  ({totalMembers}명 중)
        </Text>
        {myVote && (
          <Text style={styles.myVote}>
            {myVote === 'approve' ? '✓ 승인함' : '✕ 거절함'}
          </Text>
        )}
      </View>

      {canVote && (
        <View style={styles.actions}>
          <TouchableOpacity style={styles.approveBtn} onPress={onApprove}>
            <Text style={styles.approveBtnText}>✓ {t('spending.approve')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.rejectBtn} onPress={onReject}>
            <Text style={styles.rejectBtnText}>✕ {t('spending.reject')}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  headerLeft: { gap: 2 },
  amount: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.text },
  proposedBy: { fontSize: fontSize.xs, color: colors.textSecondary },
  statusBadge: { borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  statusText: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold },
  description: { fontSize: fontSize.sm, color: colors.text },
  receipt: {
    width: '100%',
    height: 160,
    borderRadius: radius.md,
    resizeMode: 'cover',
    backgroundColor: colors.border,
  },
  voteRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  voteCount: { fontSize: fontSize.xs, color: colors.textSecondary },
  myVote: { fontSize: fontSize.xs, color: colors.primary, fontWeight: fontWeight.semibold },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  approveBtn: {
    flex: 1,
    backgroundColor: colors.success + '15',
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.success + '40',
  },
  approveBtnText: { fontSize: fontSize.sm, color: colors.success, fontWeight: fontWeight.semibold },
  rejectBtn: {
    flex: 1,
    backgroundColor: colors.danger + '10',
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.danger + '30',
  },
  rejectBtnText: { fontSize: fontSize.sm, color: colors.danger, fontWeight: fontWeight.semibold },
});
