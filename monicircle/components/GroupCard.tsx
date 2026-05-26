import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { colors } from '@/constants/colors';
import { spacing, fontSize, radius, fontWeight } from '@/constants/theme';
import { t } from '@/i18n';

type GroupCardProps = {
  group: {
    id: string;
    title: string;
    category: string;
    status: string;
    contributionAmount: number;
    totalMembers: number;
    cycle: string;
    orderLocked: boolean;
  };
  onPress: () => void;
};

const STATUS_COLOR: Record<string, string> = {
  forming: colors.warning,
  active: colors.success,
  complete: colors.textLight,
};

const CATEGORY_EMOJI: Record<string, string> = {
  friends: '👥',
  family: '👪',
  church: '⛪',
  work: '💼',
  study: '📚',
  other: '✨',
};

export default function GroupCard({ group, onPress }: GroupCardProps) {
  const statusLabel = t(`group.${group.status}`);
  const amountStr = `₩${group.contributionAmount.toLocaleString()}`;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.row}>
        <Text style={styles.emoji}>{CATEGORY_EMOJI[group.category] ?? '⭕'}</Text>
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>{group.title}</Text>
          <Text style={styles.meta}>
            {amountStr}{t('group.contribution')} · {group.totalMembers}{t('group.members')}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: STATUS_COLOR[group.status] + '22' }]}>
          <Text style={[styles.statusText, { color: STATUS_COLOR[group.status] }]}>
            {statusLabel}
          </Text>
        </View>
      </View>

      {group.status === 'active' && (
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {group.orderLocked ? t('group.orderLocked') : t('group.orderPending')}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  emoji: { fontSize: 32 },
  info: { flex: 1 },
  title: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.text },
  meta: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  statusBadge: {
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  statusText: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold },
  footer: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerText: { fontSize: fontSize.xs, color: colors.textSecondary },
});
