import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { colors } from '@/constants/colors';
import { spacing, fontSize, radius, fontWeight } from '@/constants/theme';

type NotificationItemProps = {
  item: {
    id: string;
    title: string;
    body: string;
    read: boolean;
    createdAt: Date;
  };
};

export default function NotificationItem({ item }: NotificationItemProps) {
  return (
    <TouchableOpacity style={[styles.item, !item.read && styles.unread]} activeOpacity={0.75}>
      <View style={[styles.dot, item.read && styles.dotRead]} />
      <View style={styles.content}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.body} numberOfLines={2}>{item.body}</Text>
        <Text style={styles.time}>
          {item.createdAt?.toLocaleDateString?.() ?? ''}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  unread: { backgroundColor: colors.primaryLight + '15' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginTop: 6 },
  dotRead: { backgroundColor: colors.textLight },
  content: { flex: 1 },
  title: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.text },
  body: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  time: { fontSize: fontSize.xs, color: colors.textLight, marginTop: 4 },
});
