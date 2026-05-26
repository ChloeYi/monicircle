import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { colors } from '../../constants/colors'
import BrandHeader from '@/components/BrandHeader'

const NOTIFICATIONS = [
  {
    id: '1',
    type: 'overdue',
    title: 'Payment overdue',
    body: '신예은 · 친구들 여행 계 · Jun 4',
    time: 'Just now',
    dot: colors.danger,
    unread: true,
  },
  {
    id: '2',
    type: 'vote',
    title: 'Spending vote needed',
    body: '박준호 proposed ₩80,000 dinner',
    time: '2h ago',
    dot: colors.warning,
    unread: true,
  },
  {
    id: '3',
    type: 'proof',
    title: 'Payment proof submitted',
    body: '오현정 · Round 4 · Toss',
    time: '5h ago',
    dot: colors.info,
    unread: true,
  },
  {
    id: '4',
    type: 'approved',
    title: 'Payment approved',
    body: 'Your Round 4 proof was confirmed',
    time: 'Jun 3',
    dot: colors.primary,
    unread: false,
  },
  {
    id: '5',
    type: 'slot',
    title: 'Slot confirmed',
    body: '직장 동료 계 · You got turn #3',
    time: 'Jun 3',
    dot: colors.info,
    unread: false,
  },
  {
    id: '6',
    type: 'reminder',
    title: 'Payment due in 3 days',
    body: '교회 모임 계 · Jun 15 · ₩300,000',
    time: 'Jun 2',
    dot: colors.warning,
    unread: false,
  },
]

const GYE_END_ALERT = {
  title: '친구들 여행 계 ending Oct 4',
  body: 'Leftover fund ÷ 8 = ₩30,000 each',
}

export default function NotificationsScreen() {
  const todayNotifs = NOTIFICATIONS.filter((n) => ['Just now', '2h ago', '5h ago'].includes(n.time))
  const yesterdayNotifs = NOTIFICATIONS.filter((n) => n.time.startsWith('Jun 3'))
  const olderNotifs = NOTIFICATIONS.filter((n) => n.time.startsWith('Jun 2'))

  return (
    <SafeAreaView style={styles.container}>
      <BrandHeader right={
        <TouchableOpacity>
          <Text style={styles.markRead}>Mark all read</Text>
        </TouchableOpacity>
      } />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        <View style={styles.endAlert}>
          <MaterialCommunityIcons name="check-circle-outline" size={20} color={colors.successText} />
          <View style={styles.endAlertInfo}>
            <Text style={styles.endAlertTitle}>{GYE_END_ALERT.title}</Text>
            <Text style={styles.endAlertBody}>{GYE_END_ALERT.body}</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>TODAY</Text>
        <View style={styles.notifCard}>
          {todayNotifs.map((n, i) => (
            <View
              key={n.id}
              style={[
                styles.notifRow,
                i === todayNotifs.length - 1 && { borderBottomWidth: 0 },
                n.unread && styles.notifUnread,
              ]}
            >
              <View style={[styles.dot, { backgroundColor: n.dot }]} />
              <View style={styles.notifInfo}>
                <Text style={styles.notifTitle}>{n.title}</Text>
                <Text style={styles.notifBody}>{n.body}</Text>
              </View>
              <Text style={styles.notifTime}>{n.time}</Text>
              {n.unread && <View style={styles.unreadDot} />}
            </View>
          ))}
        </View>

        <Text style={styles.sectionLabel}>YESTERDAY</Text>
        <View style={styles.notifCard}>
          {yesterdayNotifs.map((n, i) => (
            <View
              key={n.id}
              style={[styles.notifRow, i === yesterdayNotifs.length - 1 && { borderBottomWidth: 0 }]}
            >
              <View style={[styles.dot, { backgroundColor: n.dot }]} />
              <View style={styles.notifInfo}>
                <Text style={styles.notifTitle}>{n.title}</Text>
                <Text style={styles.notifBody}>{n.body}</Text>
              </View>
              <Text style={styles.notifTime}>{n.time}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionLabel}>EARLIER</Text>
        <View style={styles.notifCard}>
          {olderNotifs.map((n, i) => (
            <View
              key={n.id}
              style={[styles.notifRow, i === olderNotifs.length - 1 && { borderBottomWidth: 0 }]}
            >
              <View style={[styles.dot, { backgroundColor: n.dot }]} />
              <View style={styles.notifInfo}>
                <Text style={styles.notifTitle}>{n.title}</Text>
                <Text style={styles.notifBody}>{n.body}</Text>
              </View>
              <Text style={styles.notifTime}>{n.time}</Text>
            </View>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  topbarTitle: { fontSize: 17, fontWeight: '500', color: colors.text },
  markRead: { fontSize: 13, color: colors.primary },
  scroll: { padding: 16, gap: 12, paddingBottom: 32 },
  endAlert: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: colors.primaryBg,
    borderWidth: 1,
    borderColor: colors.primaryLighter,
    borderRadius: 12,
    padding: 14,
  },
  endAlertInfo: { flex: 1 },
  endAlertTitle: { fontSize: 13, fontWeight: '500', color: colors.successText },
  endAlertBody: { fontSize: 12, color: colors.primary, marginTop: 2 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  notifCard: {
    backgroundColor: colors.surface,
    borderWidth: 0.5,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  notifRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.borderLight,
  },
  notifUnread: {
    backgroundColor: colors.background,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 5,
    flexShrink: 0,
  },
  notifInfo: { flex: 1 },
  notifTitle: { fontSize: 13, fontWeight: '500', color: colors.text },
  notifBody: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  notifTime: { fontSize: 11, color: colors.textLight, flexShrink: 0 },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginTop: 6,
    flexShrink: 0,
  },
})
