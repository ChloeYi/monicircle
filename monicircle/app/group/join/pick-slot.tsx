import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native'
import { useRouter } from 'expo-router'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { colors } from '@/constants/colors'

const SLOTS = [
  { turn: 1, date: 'Feb 4, 2025', status: 'taken', label: 'Receive earliest' },
  { turn: 2, date: 'Mar 4, 2025', status: 'taken', label: 'Receive in 2 months' },
  { turn: 3, date: 'Apr 4, 2025', status: 'available', label: 'Receive in 3 months' },
  { turn: 4, date: 'May 4, 2025', status: 'available', label: 'Receive in 4 months' },
  { turn: 5, date: 'Jun 4, 2025', status: 'available', label: 'Receive in 5 months' },
  { turn: 6, date: 'Jul 4, 2025', status: 'available', label: 'Receive in 6 months' },
  { turn: 7, date: 'Aug 4, 2025', status: 'available', label: 'Receive in 7 months' },
  { turn: 8, date: 'Sep 4, 2025', status: 'available', label: 'Receive latest — save longest' },
]

export default function PickSlotScreen() {
  const router = useRouter()
  const [myRequest, setMyRequest] = useState<number | null>(null)

  const handleRequest = (turn: number) => {
    if (myRequest === turn) {
      setMyRequest(null)
      return
    }
    Alert.alert(
      `Request turn #${turn}?`,
      `You'll receive ₩4,000,000 on ${SLOTS[turn - 1].date}. The organizer will confirm the final order.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Request', onPress: () => setMyRequest(turn) },
      ]
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topbar}>
        <TouchableOpacity onPress={() => router.back()}><MaterialCommunityIcons name="arrow-left" size={20} color={colors.textSecondary} /></TouchableOpacity>
        <View style={styles.topbarCenter}>
          <Text style={styles.topbarTitle}>Pick your slot</Text>
          <Text style={styles.topbarSub}>친구들 여행 계 · 6 slots left</Text>
        </View>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            Choose your preferred turn. The organizer will confirm the final order after everyone picks.
          </Text>
        </View>

        <Text style={styles.sectionLabel}>AVAILABLE SLOTS</Text>

        <View style={styles.slotsCard}>
          {SLOTS.map((slot, i) => {
            const isTaken = slot.status === 'taken'
            const isMyRequest = myRequest === slot.turn
            return (
              <TouchableOpacity
                key={slot.turn}
                style={[
                  styles.slotRow,
                  i === SLOTS.length - 1 && { borderBottomWidth: 0 },
                  isTaken && styles.slotRowTaken,
                  isMyRequest && styles.slotRowMine,
                ]}
                onPress={() => !isTaken && handleRequest(slot.turn)}
                activeOpacity={isTaken ? 1 : 0.85}
                disabled={isTaken}
              >
                <View style={[
                  styles.turnBadge,
                  isTaken && styles.turnBadgeTaken,
                  isMyRequest && styles.turnBadgeMine,
                ]}>
                  <Text style={[
                    styles.turnBadgeText,
                    isTaken && { color: colors.textLight },
                    isMyRequest && { color: '#fff' },
                  ]}>
                    {slot.turn}
                  </Text>
                </View>

                <View style={styles.slotInfo}>
                  <Text style={[
                    styles.slotTitle,
                    isTaken && { color: colors.textLight },
                    isMyRequest && { color: colors.successText },
                  ]}>
                    Turn #{slot.turn} · {slot.date}
                  </Text>
                  <Text style={[styles.slotLabel, isTaken && { color: colors.textLight }]}>
                    {isMyRequest ? 'Your request ✓' : slot.label}
                  </Text>
                </View>

                {isTaken ? (
                  <View style={[styles.badge, styles.badgeGray]}>
                    <Text style={[styles.badgeText, { color: colors.textSecondary }]}>Taken</Text>
                  </View>
                ) : isMyRequest ? (
                  <TouchableOpacity
                    style={[styles.badge, styles.badgeSuccess]}
                    onPress={() => setMyRequest(null)}
                  >
                    <Text style={[styles.badgeText, { color: colors.successText }]}>Requested</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.badge, styles.badgeInfo]}
                    onPress={() => handleRequest(slot.turn)}
                  >
                    <Text style={[styles.badgeText, { color: colors.infoText }]}>Request</Text>
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            )
          })}
        </View>

        <View style={styles.waitingBox}>
          <Text style={styles.waitingText}>
            Waiting for organizer to confirm final order after all members choose.
          </Text>
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
  infoBox: {
    backgroundColor: colors.infoBg,
    borderRadius: 10,
    padding: 12,
  },
  infoText: { fontSize: 13, color: colors.infoText, lineHeight: 18 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  slotsCard: {
    backgroundColor: colors.surface,
    borderWidth: 0.5,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  slotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.borderLight,
  },
  slotRowTaken: { opacity: 0.4 },
  slotRowMine: {
    backgroundColor: colors.primaryBg,
    marginHorizontal: -12,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  turnBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.grayBg,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  turnBadgeTaken: { backgroundColor: colors.borderLight },
  turnBadgeMine: { backgroundColor: colors.primary },
  turnBadgeText: { fontSize: 11, fontWeight: '500', color: colors.textSecondary },
  slotInfo: { flex: 1 },
  slotTitle: { fontSize: 13, fontWeight: '500', color: colors.text },
  slotLabel: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  badgeSuccess: { backgroundColor: colors.successBg },
  badgeInfo: { backgroundColor: colors.infoBg },
  badgeGray: { backgroundColor: colors.grayBg },
  badgeText: { fontSize: 11, fontWeight: '500' },
  waitingBox: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 12,
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  waitingText: { fontSize: 12, color: colors.textSecondary, lineHeight: 18, textAlign: 'center' },
})
