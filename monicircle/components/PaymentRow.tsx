import { StyleSheet, View, Text, TouchableOpacity, Image } from 'react-native';
import { colors } from '@/constants/colors';
import { spacing, fontSize, radius, fontWeight } from '@/constants/theme';
import { t } from '@/i18n';

export type PaymentStatus = 'paid' | 'pending' | 'overdue' | 'upcoming';

export type PaymentRowProps = {
  memberId: string;
  name: string;
  turnNumber: number | null;
  paymentStatus: PaymentStatus;
  proofImageUrl?: string | null;
  isGyeju: boolean;
  isRecipient: boolean;
  onApprove?: () => void;
  onReject?: () => void;
  onViewProof?: () => void;
};

const STATUS_CONFIG: Record<PaymentStatus, { label: string; color: string; bg: string }> = {
  paid:     { label: 'group.paid',     color: colors.success,       bg: colors.success + '20' },
  pending:  { label: 'group.pending',  color: colors.warning,       bg: colors.warning + '20' },
  overdue:  { label: 'group.overdue',  color: colors.danger,        bg: colors.danger  + '20' },
  upcoming: { label: 'group.upcoming', color: colors.textSecondary, bg: colors.border },
};

export default function PaymentRow({
  name,
  turnNumber,
  paymentStatus,
  proofImageUrl,
  isGyeju,
  isRecipient,
  onApprove,
  onReject,
  onViewProof,
}: PaymentRowProps) {
  const cfg = STATUS_CONFIG[paymentStatus];

  return (
    <View style={styles.row}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{name[0]?.toUpperCase() ?? '?'}</Text>
      </View>

      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{name}</Text>
          {isRecipient && (
            <View style={styles.recipientBadge}>
              <Text style={styles.recipientText}>수령자</Text>
            </View>
          )}
        </View>
        <Text style={styles.turn}>
          {turnNumber != null ? `${turnNumber}번째 순번` : '순번 미정'}
        </Text>
      </View>

      <View style={styles.right}>
        <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
          <Text style={[styles.statusText, { color: cfg.color }]}>{t(cfg.label)}</Text>
        </View>

        {proofImageUrl && (
          <TouchableOpacity onPress={onViewProof} style={styles.proofThumb}>
            <Image source={{ uri: proofImageUrl }} style={styles.proofImage} />
          </TouchableOpacity>
        )}

        {isGyeju && paymentStatus === 'pending' && (
          <View style={styles.actions}>
            <TouchableOpacity style={styles.approveBtn} onPress={onApprove}>
              <Text style={styles.approveBtnText}>✓</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.rejectBtn} onPress={onReject}>
              <Text style={styles.rejectBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight + '30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  info: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  name: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.text },
  turn: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  recipientBadge: {
    backgroundColor: colors.accent + '20',
    borderRadius: radius.full,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  recipientText: { fontSize: 10, color: colors.accent, fontWeight: fontWeight.semibold },
  right: { alignItems: 'flex-end', gap: spacing.xs },
  statusBadge: {
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  statusText: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold },
  proofThumb: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  proofImage: { width: '100%', height: '100%' },
  actions: { flexDirection: 'row', gap: spacing.xs, marginTop: 2 },
  approveBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.success + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  approveBtnText: { fontSize: 13, color: colors.success, fontWeight: fontWeight.bold },
  rejectBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.danger + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectBtnText: { fontSize: 13, color: colors.danger, fontWeight: fontWeight.bold },
});
