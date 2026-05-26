import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native'
import { useRouter } from 'expo-router'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { colors } from '../../../constants/colors'

const SCHEDULE = [
  { round: 1, name: '김민수', date: 'Feb 4, 2025', status: 'done', amount: 4000000 },
  { round: 2, name: '이채린', date: 'Mar 4, 2025', status: 'done', amount: 4000000 },
  { round: 3, name: '최도현', date: 'Apr 4, 2025', status: 'done', amount: 4000000 },
  { round: 4, name: '정혜원', date: 'Jun 4, 2025', status: 'active', amount: 4000000 },
  { round: 5, name: '박준호', date: 'Jul 4, 2025', status: 'upcoming', amount: 4000000 },
  { round: 6, name: '오현정', date: 'Aug 4, 2025', status: 'upcoming', amount: 4000000 },
  { round: 7, name: '신예은', date: 'Sep 4, 2025', status: 'upcoming', amount: 4000000 },
  { round: 8, name: '홍수빈', date: 'Oct 4, 2025', status: 'upcoming', amount: 4000000 },
]

export default function ScheduleScreen() {
  const router = useRouter()
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topbar}>
        <TouchableOpacity onPress={() => router.back()}><MaterialCommunityIcons name="arrow-left" size={20} color={colors.textSecondary} /></TouchableOpacity>
        <View style={styles.topbarCenter}>
          <Text style={styles.topbarTitle}>Schedule</Text>
          <Text style={styles.topbarSub}>친구들 여행 계</Text>
        </View>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Finish date</Text>
            <Text style={styles.summaryValue}>Oct 4, 2025</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Leftover split</Text>
            <Text style={[styles.summaryValue, { color: colors.primary }]}>÷ 8 members</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>ROTATION SCHEDULE</Text>

        <View style={styles.scheduleCard}>
          {SCHEDULE.map((item, i) => {
            const isActive = item.status === 'active'
            const isDone = item.status === 'done'
            return (
              <View
                key={item.round}
                style={[
                  styles.scheduleRow,
                  i === SCHEDULE.length - 1 && { borderBottomWidth: 0 },
                  isActive && styles.scheduleRowActive,
                ]}
              >
                <View style={[
                  styles.roundBadge,
                  isDone && styles.roundBadgeDone,
                  isActive && styles.roundBadgeActive,
                ]}>
                  <Text style={[
                    styles.roundBadgeText,
                    isDone && { color: '#0D47A1' },
                    isActive && { color: '#fff' },
                  ]}>
                    {item.round}
                  </Text>
                </View>
                <View style={styles.scheduleInfo}>
                  <Text style={[styles.scheduleName, isActive && { color: colors.successText, fontWeight: '500' }]}>
                    {item.name}
                    {isActive && <Text style={styles.activeTag}> · this month</Text>}
                  </Text>
                  <Text style={[styles.scheduleDate, isActive && { color: colors.primary }]}>
                    {item.date}
                  </Text>
                </View>
                <Text style={styles.scheduleAmount}>
                  ₩{(item.amount / 10000).toFixed(0)}만
                </Text>
                <View style={[
                  styles.badge,
                  isDone && styles.badgeSuccess,
                  isActive && styles.badgeInfo,
                  !isDone && !isActive && styles.badgeGray,
                ]}>
                  <Text style={[
                    styles.badgeText,
                    isDone && { color: colors.successText },
                    isActive && { color: colors.infoText },
                    !isDone && !isActive && { color: colors.textSecondary },
                  ]}>
                    {isDone ? 'Done' : isActive ? 'Active' : 'Soon'}
                  </Text>
                </View>
              </View>
            )
          })}
        </View>

        <TouchableOpacity style={styles.calendarBtn} activeOpacity={0.85}>
          <MaterialCommunityIcons name="calendar-outline" size={20} color={colors.text} />
          <Text style={styles.calendarBtnText}>Add all dates to my calendar</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  topbarCenter: { flex: 1, alignItems: 'center' },
  topbarTitle: { fontSize: 15, fontWeight: '500', color: colors.text },
  topbarSub: { fontSize: 11, color: colors.textSecondary, marginTop: 1 },
  scroll: { padding: 16, gap: 12, paddingBottom: 32 },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 4,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 12,
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  summaryLabel: { fontSize: 11, color: colors.textSecondary, marginBottom: 4 },
  summaryValue: { fontSize: 14, fontWeight: '500', color: colors.text },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  scheduleCard: {
    backgroundColor: colors.surface,
    borderWidth: 0.5,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.borderLight,
  },
  scheduleRowActive: {
    backgroundColor: colors.primaryBg,
    marginHorizontal: -12,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  roundBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.grayBg,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  roundBadgeDone: { backgroundColor: colors.infoBg },
  roundBadgeActive: { backgroundColor: colors.primary },
  roundBadgeText: { fontSize: 11, fontWeight: '500', color: colors.textSecondary },
  scheduleInfo: { flex: 1 },
  scheduleName: { fontSize: 13, color: colors.text },
  scheduleDate: { fontSize: 11, color: colors.textSecondary, marginTop: 1 },
  activeTag: { color: colors.primary, fontSize: 11 },
  scheduleAmount: { fontSize: 12, color: colors.textSecondary, flexShrink: 0 },
  badge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 20 },
  badgeSuccess: { backgroundColor: colors.successBg },
  badgeInfo: { backgroundColor: colors.infoBg },
  badgeGray: { backgroundColor: colors.grayBg },
  badgeText: { fontSize: 10, fontWeight: '500' },
  calendarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderWidth: 0.5,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    marginTop: 4,
  },
  calendarBtnText: { fontSize: 14, color: colors.text },
})
