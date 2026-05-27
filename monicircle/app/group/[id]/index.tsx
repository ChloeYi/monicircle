import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native'
import Svg, { Circle, Text as SvgText } from 'react-native-svg'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { colors } from '../../../constants/colors'
import { useAuth } from '@/context/auth'
import { subscribeGroup, getGroupMembers, getActiveRound, getUserProfile } from '@/firebase/groups'
import { getMyProofForRound, subscribeProofs, type PaymentProof } from '@/firebase/proofs'

const SVG_SIZE = 300
const CX = 150
const CY = 150
const R = 105
const SW = 22

const avatarColors = ['#E3F2FD', '#E1F5EE', '#EDE7F6', '#FFF3E0', '#FCE4EC', '#F3E5F5', '#E0F2F1', '#FFF8E1']
const avatarTextColors = ['#0D47A1', '#085041', '#4527A0', '#E65100', '#880E4F', '#6A1B9A', '#004D40', '#F57F17']

function RotationCircle({ members, currentRound, totalRounds }: any) {
  const circumference = 2 * Math.PI * R
  // Arc ends exactly at active member's dot position (index = currentRound - 1)
  const arcLength = ((currentRound - 1) / totalRounds) * circumference

  return (
    <View style={styles.circleWrap}>
      <Svg width={SVG_SIZE} height={SVG_SIZE}>
        {/* Background ring */}
        <Circle cx={CX} cy={CY} r={R} fill="none" stroke="#C8EDE9" strokeWidth={SW} />
        {/* Progress arc — starts at 12 o'clock (strokeDashoffset = circ/4), ends at active member */}
        <Circle
          cx={CX} cy={CY} r={R}
          fill="none"
          stroke="#5BBFBA"
          strokeWidth={SW}
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeDashoffset={circumference / 4}
          strokeLinecap="butt"
        />
        {/* Member dots */}
        {members.map((m: any, i: number) => {
          const angle = (i / members.length) * 2 * Math.PI - Math.PI / 2
          const mx = CX + Math.cos(angle) * R
          const my = CY + Math.sin(angle) * R
          const isActive = m.status === 'active'
          const isDone = m.status === 'done'
          const dotR = isActive ? 20 : 18
          const dotFill = isActive ? '#0D7377' : isDone ? '#E3F2FD' : '#ECECEC'
          const dotStroke = isActive ? '#085041' : isDone ? '#90CAF9' : '#C8C8C8'
          const textFill = isActive ? '#fff' : isDone ? '#0D47A1' : '#888'
          const label = `${m.initials}#${m.turn}`
          return (
            <React.Fragment key={m.initials}>
              <Circle cx={mx} cy={my} r={dotR} fill={dotFill} stroke={dotStroke} strokeWidth={1.5} />
              <SvgText
                x={mx} y={isActive ? my - 3 : my + 5}
                textAnchor="middle"
                fontSize={10}
                fontWeight="600"
                fill={textFill}
              >
                {label}
              </SvgText>
              {isActive && (
                <SvgText x={mx} y={my + 9} textAnchor="middle" fontSize={9} fill={textFill}>
                  now
                </SvgText>
              )}
            </React.Fragment>
          )
        })}
        {/* Center label */}
        <SvgText x={CX} y={CY - 8} textAnchor="middle" fontSize={22} fontWeight="500" fill="#1A7A8A">
          Round {currentRound}
        </SvgText>
        <SvgText x={CX} y={CY + 18} textAnchor="middle" fontSize={16} fill="#80BCBE">
          of {totalRounds}
        </SvgText>
      </Svg>
    </View>
  )
}

export default function GroupDetailScreen() {
  const [activeTab, setActiveTab] = useState('overview')
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const { state } = useAuth()
  const user = state.status === 'authenticated' ? state.user : null

  const [group, setGroup] = useState<any>(null)
  const [activeRound, setActiveRound] = useState<any>(null)
  const [members, setMembers] = useState<any[]>([])
  const [proofs, setProofs] = useState<PaymentProof[]>([])
  const [myProof, setMyProof] = useState<PaymentProof | null>(null)

  const isOrganizer = user?.uid === group?.gyejuId

  useEffect(() => {
    if (!id) return
    const unsub = subscribeGroup(id, setGroup)
    return unsub
  }, [id])

  useEffect(() => {
    if (!id || !group) return
    getActiveRound(id).then(setActiveRound).catch(() => {})
    getGroupMembers(id).then(async (rawMembers) => {
      const withProfiles = await Promise.all(
        rawMembers.map(async (m: any) => {
          const profile = await getUserProfile(m.userId).catch(() => null)
          return { ...m, userName: (profile as any)?.name ?? m.userId }
        })
      )
      setMembers(withProfiles.filter((m: any) => m.status === 'approved'))
    }).catch(() => {})
  }, [id, group?.status])

  useEffect(() => {
    if (!id) return
    try {
      const unsub = subscribeProofs(id, setProofs)
      return unsub
    } catch { return }
  }, [id])

  useEffect(() => {
    if (!user || !id || !activeRound || isOrganizer) return
    getMyProofForRound(id, activeRound.roundNumber, user.uid).then(setMyProof).catch(() => {})
  }, [user, id, activeRound, isOrganizer])

  const totalRounds = members.length
  const currentRound = activeRound?.roundNumber ?? 1
  const recipient = activeRound?.recipientName ?? '—'
  const dueDate = activeRound?.dueDate?.toDate?.()?.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) ?? '—'
  const amount = activeRound?.amount ?? 0
  const progress = totalRounds > 0 ? currentRound / totalRounds : 0

  // Build circle members from turn order
  const circleMembers = members
    .sort((a, b) => (a.turnNumber ?? 99) - (b.turnNumber ?? 99))
    .map((m) => ({
      initials: m.userName?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) ?? '??',
      turn: m.turnNumber ?? 0,
      status: m.turnNumber < currentRound ? 'done' : m.turnNumber === currentRound ? 'active' : 'upcoming',
    }))

  // Build payment status rows
  const approvedProofIds = new Set(proofs.filter((p) => p.status === 'approved').map((p) => p.userId))
  const pendingProofIds = new Set(proofs.filter((p) => p.status === 'pending').map((p) => p.userId))
  const paymentRows = members
    .sort((a, b) => (a.turnNumber ?? 99) - (b.turnNumber ?? 99))
    .map((m) => ({
      userId: m.userId,
      name: m.userName,
      initials: m.userName?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) ?? '??',
      turn: m.turnNumber,
      status: approvedProofIds.has(m.userId) ? 'paid' : pendingProofIds.has(m.userId) ? 'pending' : 'overdue',
    }))

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topbar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}>
          <MaterialCommunityIcons name="arrow-left" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
        <View style={styles.topbarCenter}>
          <Text style={styles.topbarTitle}>{group?.title ?? '—'}</Text>
          <Text style={styles.topbarSub}>{members.length} members</Text>
        </View>
        <TouchableOpacity
          style={styles.menuBtn}
          onPress={() => isOrganizer ? router.push(`/group/${id}/members`) : undefined}
        >
          <MaterialCommunityIcons
            name={isOrganizer ? 'account-group-outline' : 'dots-horizontal'}
            size={20}
            color={isOrganizer ? colors.primary : colors.textSecondary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>This round — recipient</Text>
          <Text style={styles.heroAmount}>₩{amount.toLocaleString()}</Text>
          <Text style={styles.heroSub}>{recipient} · due {dueDate}</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
          </View>
          <Text style={styles.heroProgress}>Round {currentRound} of {totalRounds} · {Math.round(progress * 100)}% complete</Text>
        </View>

        <View style={styles.circleSection}>
          <RotationCircle members={circleMembers} currentRound={currentRound} totalRounds={totalRounds || 1} />
        </View>

        {!isOrganizer && (
          <TouchableOpacity
            style={[styles.myPaymentBtn, myProof?.status === 'approved' && styles.myPaymentBtnDone]}
            activeOpacity={0.85}
            onPress={() => router.push(`/member/${id}`)}
          >
            <View style={styles.myPaymentLeft}>
              <View style={styles.myPaymentIcon}>
                <MaterialCommunityIcons
                  name={myProof?.status === 'approved' ? 'check-circle-outline' : 'upload-outline'}
                  size={20}
                  color={myProof?.status === 'approved' ? colors.successText : colors.primary}
                />
              </View>
              <View>
                <Text style={styles.myPaymentTitle}>My payment this round</Text>
                <Text style={styles.myPaymentSub}>
                  {myProof?.status === 'approved' ? 'Approved ✓' :
                   myProof?.status === 'pending' ? 'Awaiting organizer approval' :
                   myProof?.status === 'rejected' ? 'Rejected — tap to resubmit' :
                   `Upload proof · ₩${group?.contributionAmount?.toLocaleString() ?? '—'} → ${recipient}`}
                </Text>
              </View>
            </View>
            <View style={[styles.proofBadge,
              !myProof && styles.proofBadgeWarn,
              myProof?.status === 'pending' && styles.proofBadgeWarn,
              myProof?.status === 'approved' && styles.proofBadgeDone,
              myProof?.status === 'rejected' && styles.proofBadgeDanger,
            ]}>
              <Text style={[styles.proofBadgeText, {
                color: myProof?.status === 'approved' ? colors.successText :
                       myProof?.status === 'rejected' ? colors.dangerText : colors.warningText
              }]}>
                {myProof?.status === 'approved' ? 'Paid' :
                 myProof?.status === 'pending' ? 'Pending' :
                 myProof?.status === 'rejected' ? 'Rejected' : 'Due'}
              </Text>
            </View>
          </TouchableOpacity>
        )}

        <View style={styles.paymentsSection}>
          <Text style={styles.sectionLabel}>PAYMENT STATUS</Text>
          <View style={styles.paymentsCard}>
            {paymentRows.map((p, i) => (
              <View key={p.userId} style={[styles.payRow, i === paymentRows.length - 1 && { borderBottomWidth: 0 }]}>
                <View style={[styles.avatar, { backgroundColor: avatarColors[i % avatarColors.length] }]}>
                  <Text style={[styles.avatarText, { color: avatarTextColors[i % avatarTextColors.length] }]}>
                    {p.initials}
                  </Text>
                </View>
                <View style={styles.payInfo}>
                  <Text style={styles.payName}>{p.name}</Text>
                  <Text style={styles.payMeta}>Turn #{p.turn}</Text>
                </View>
                <View style={[
                  styles.badge,
                  p.status === 'paid' && styles.badgeSuccess,
                  p.status === 'pending' && styles.badgeWarn,
                  p.status === 'overdue' && styles.badgeDanger,
                ]}>
                  <Text style={[
                    styles.badgeText,
                    p.status === 'paid' && { color: colors.successText },
                    p.status === 'pending' && { color: colors.warningText },
                    p.status === 'overdue' && { color: colors.dangerText },
                  ]}>
                    {p.status === 'paid' ? 'Paid' : p.status === 'pending' ? 'Pending' : 'Overdue'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={styles.tabBar}>
        {[
          { id: 'overview', label: 'Overview', icon: 'view-dashboard-outline', route: null },
          ...(isOrganizer ? [{ id: 'approve', label: 'Approve', icon: 'check-circle-outline', route: `/group/${id}/approvals` }] : []),
          { id: 'spending', label: 'Spending', icon: 'receipt-outline', route: `/group/${id}/spending` },
          { id: 'schedule', label: 'Schedule', icon: 'calendar-outline', route: `/group/${id}/schedule` },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={styles.tabBtn}
            onPress={() => {
              if (tab.route) router.push(tab.route as any)
              else setActiveTab(tab.id)
            }}
          >
            <MaterialCommunityIcons
              name={tab.icon as any}
              size={20}
              color={activeTab === tab.id ? colors.primary : colors.textLight}
            />
            <Text style={[styles.tabLabel, activeTab === tab.id && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
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
  backBtn: { padding: 4 },
  topbarCenter: { flex: 1, alignItems: 'center' },
  topbarTitle: { fontSize: 15, fontWeight: '500', color: colors.text },
  topbarSub: { fontSize: 11, color: colors.textSecondary, marginTop: 1 },
  menuBtn: { padding: 4 },
  myPaymentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primaryLighter,
    borderRadius: 12,
    padding: 12,
  },
  myPaymentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  myPaymentIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  myPaymentBtnDone: { borderColor: colors.successBg },
  myPaymentTitle: { fontSize: 13, fontWeight: '500', color: colors.text },
  myPaymentSub: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  proofBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  proofBadgeWarn: { backgroundColor: colors.warningBg },
  proofBadgeDone: { backgroundColor: colors.successBg },
  proofBadgeDanger: { backgroundColor: colors.dangerBg },
  proofBadgeText: { fontSize: 11, fontWeight: '500' },
  heroCard: {
    backgroundColor: colors.primary,
    margin: 16,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  heroLabel: { fontSize: 11, color: colors.primaryLighter, marginBottom: 4 },
  heroAmount: { fontSize: 28, fontWeight: '500', color: '#fff' },
  heroSub: { fontSize: 12, color: colors.primaryLighter, marginTop: 4 },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 3,
    marginTop: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFD54F',
    borderRadius: 2,
  },
  heroProgress: { fontSize: 11, color: colors.primaryLighter, marginTop: 6 },
  circleSection: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  circleWrap: {
    width: SVG_SIZE,
    height: SVG_SIZE,
    alignSelf: 'center',
  },
  paymentsSection: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  paymentsCard: {
    backgroundColor: colors.surface,
    borderWidth: 0.5,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  payRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.borderLight,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: { fontSize: 11, fontWeight: '500' },
  payInfo: { flex: 1 },
  payName: { fontSize: 13, fontWeight: '500', color: colors.text },
  payMeta: { fontSize: 11, color: colors.textSecondary },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  badgeSuccess: { backgroundColor: colors.successBg },
  badgeWarn: { backgroundColor: colors.warningBg },
  badgeDanger: { backgroundColor: colors.dangerBg },
  badgeText: { fontSize: 11, fontWeight: '500' },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 0.5,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    gap: 2,
  },
  tabLabel: { fontSize: 10, color: colors.textLight },
  tabLabelActive: { color: colors.primary },
})
