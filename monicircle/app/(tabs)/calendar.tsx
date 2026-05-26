import { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ExpoCalendar from 'expo-calendar';
import { useAuth } from '@/context/auth';
import { getUserGroups } from '@/firebase/groups';
import { calcPaymentDates } from '@/firebase/calculations';
import { colors } from '@/constants/colors';
import { spacing, fontSize, radius, fontWeight } from '@/constants/theme';
import { t } from '@/i18n';
import BrandHeader from '@/components/BrandHeader';

type CalendarEvent = {
  id: string;
  date: Date;
  label: string;
  type: 'payment' | 'receive' | 'vote';
  groupTitle: string;
};

export default function CalendarScreen() {
  const { state } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  const user = state.status === 'authenticated' ? state.user : null;

  useEffect(() => {
    if (!user) return;
    getUserGroups(user.uid).then((groups) => {
      const allEvents: CalendarEvent[] = [];
      for (const g of groups as any[]) {
        if (!g.startDate || !g.totalMembers) continue;
        const start = g.startDate?.toDate?.() ?? new Date(g.startDate);
        const dates = calcPaymentDates(start, g.totalMembers, g.cycle, g.paymentDay);
        dates.forEach((date, i) => {
          allEvents.push({
            id: `${g.id}-${i}`,
            date,
            label: t('calendar.paymentDue'),
            type: 'payment',
            groupTitle: g.title,
          });
        });
      }
      allEvents.sort((a, b) => a.date.getTime() - b.date.getTime());
      setEvents(allEvents);
    });
  }, [user?.uid]);

  async function addAllToCalendar() {
    const { status } = await ExpoCalendar.requestCalendarPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('common.error'), 'Calendar permission denied');
      return;
    }
    Alert.alert('Done', `${events.length} events would be added to your calendar.`);
  }

  const formatDate = (d: Date) =>
    d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

  const typeColor = {
    payment: colors.accent,
    receive: colors.success,
    vote: colors.warning,
  };

  return (
    <SafeAreaView style={styles.container}>
      <BrandHeader right={
        <TouchableOpacity onPress={addAllToCalendar}>
          <Text style={styles.addBtn}>+ 캘린더</Text>
        </TouchableOpacity>
      } />

      {events.length === 0 ? (
        <View style={styles.empty}>
          <MaterialCommunityIcons name="calendar-outline" size={56} color={colors.textLight} />
          <Text style={styles.emptyText}>계 모임에 참여하면 일정이 표시됩니다</Text>
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.eventRow}>
              <View style={[styles.dot, { backgroundColor: typeColor[item.type] }]} />
              <View style={styles.eventInfo}>
                <Text style={styles.eventLabel}>{item.label}</Text>
                <Text style={styles.eventGroup}>{item.groupTitle}</Text>
              </View>
              <Text style={styles.eventDate}>{formatDate(item.date)}</Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.text },
  addBtn: { fontSize: fontSize.sm, color: colors.primary, fontWeight: fontWeight.semibold },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  emptyText: { fontSize: fontSize.md, color: colors.textSecondary, textAlign: 'center' },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, gap: spacing.sm },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.md,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  eventInfo: { flex: 1 },
  eventLabel: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.text },
  eventGroup: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  eventDate: { fontSize: fontSize.xs, color: colors.textSecondary },
});
