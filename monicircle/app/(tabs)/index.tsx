import React, { useRef, useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from 'react-native'
import { useRouter } from 'expo-router'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { colors } from '../../constants/colors'
import { useTour } from '@/context/tour'
import BrandHeader from '@/components/BrandHeader'
import { useAuth } from '@/context/auth'
import { getUserGroups, getPublicGroups } from '@/firebase/groups'

const categoryIcon: Record<string, string> = {
  friends: 'account-group-outline',
  family: 'home-heart-outline',
  church: 'church',
  work: 'briefcase-outline',
  study: 'book-outline',
  other: 'circle-outline',
}

const categoryColor: Record<string, string> = {
  friends: '#E1F5EE',
  family: '#E3F2FD',
  church: '#EDE7F6',
  work: '#FFF3E0',
  study: '#FCE4EC',
  other: colors.grayBg,
}

function GroupCard({ group, onPress }: { group: any; onPress: () => void }) {
  const isForming = group.status === 'forming'
  const isComplete = group.status === 'complete'
  const hasPending = group.pendingCount !== null && group.pendingCount > 0

  return (
    <TouchableOpacity style={styles.groupCard} onPress={onPress} activeOpacity={0.85}>
      <View style={[styles.groupIcon, { backgroundColor: categoryColor[group.category] ?? colors.grayBg }]}>
        <MaterialCommunityIcons name={(categoryIcon[group.category] ?? 'circle-outline') as any} size={20} color={colors.primary} />
      </View>
      <View style={styles.groupInfo}>
        <Text style={styles.groupTitle}>{group.title}</Text>
        <Text style={styles.groupMeta}>
          {group.members} members · ₩{group.amount.toLocaleString()}/mo
        </Text>
        {isForming && group.totalRounds > 0 && (
          <View style={styles.progressWrap}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${Math.min(100, (group.members / group.totalRounds) * 100)}%` }]} />
            </View>
            <Text style={styles.progressText}>{group.members}/{group.totalRounds} slots</Text>
          </View>
        )}
      </View>
      {isForming ? (
        <View style={[styles.badge, styles.badgeInfo]}>
          <Text style={[styles.badgeText, { color: colors.infoText }]}>Forming</Text>
        </View>
      ) : isComplete ? (
        <View style={[styles.badge, styles.badgeSuccess]}>
          <Text style={[styles.badgeText, { color: colors.successText }]}>Done</Text>
        </View>
      ) : hasPending ? (
        <View style={[styles.badge, styles.badgeWarn]}>
          <Text style={[styles.badgeText, { color: colors.warningText }]}>{group.pendingCount} pending</Text>
        </View>
      ) : (
        <View style={[styles.badge, styles.badgeSuccess]}>
          <Text style={[styles.badgeText, { color: colors.successText }]}>Active</Text>
        </View>
      )}
    </TouchableOpacity>
  )
}

function toGroupCardShape(g: any) {
  return {
    id: g.id,
    title: g.title ?? '—',
    category: g.category ?? 'other',
    members: g.totalMembers ?? 0,
    totalRounds: g.totalMembers ?? 0,
    status: g.status ?? 'forming',
    amount: g.contributionAmount ?? 0,
    slotsLeft: Math.max(0, (g.totalMembers ?? 0) - (g.memberCount ?? 0)),
    pendingCount: null as number | null,
  }
}

export default function HomeScreen() {
  const router = useRouter()
  const { startTour } = useTour()
  const { state } = useAuth()
  const user = state.status === 'authenticated' ? state.user : null

  const [myGroups, setMyGroups] = useState<any[]>([])
  const [publicGroups, setPublicGroups] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { setLoading(false); return }
    setLoading(true)
    Promise.allSettled([
      getUserGroups(user.uid),
      getPublicGroups(),
    ]).then(([mineResult, pubResult]) => {
      const mine = mineResult.status === 'fulfilled' ? mineResult.value as any[] : []
      const pub  = pubResult.status  === 'fulfilled' ? pubResult.value  as any[] : []
      setMyGroups(mine.map(toGroupCardShape))
      const myIds = new Set(mine.map((g: any) => g.id))
      setPublicGroups(pub.filter((g: any) => !myIds.has(g.id)).map(toGroupCardShape))
    }).finally(() => setLoading(false))
  }, [user?.uid])

  const refFirstCard = useRef<View>(null)
  const refCreateBtn = useRef<View>(null)
  const refBell = useRef<View>(null)
  const refPublicCard = useRef<View>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      startTour([
        {
          ref: refFirstCard,
          title: 'Your savings circles',
          body: 'Each card is a 계 (gye) group. Tap any card to see round status, payments, and manage your circle.',
          placement: 'bottom',
        },
        {
          ref: refPublicCard,
          title: 'Join a public circle',
          body: 'Browse open circles that anyone can request to join. Great if you want to start saving without organizing one yourself.',
          placement: 'top',
        },
        {
          ref: refCreateBtn,
          title: 'Start your own circle',
          body: 'Tap here to create a new 계. You set the amount, number of members, and payment schedule.',
          placement: 'top',
        },
        {
          ref: refBell,
          title: 'Notifications',
          body: 'Payment reminders, approval requests, and circle updates all land here.',
          placement: 'bottom',
        },
      ])
    }, 600)
    return () => clearTimeout(timer)
  }, [])

  return (
    <SafeAreaView style={styles.container}>
      <BrandHeader right={
        <TouchableOpacity ref={refBell} style={styles.bellBtn}>
          <MaterialCommunityIcons name="bell-outline" size={20} color={colors.text} />
          <View style={styles.bellDot} />
        </TouchableOpacity>
      } />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
        ) : (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>MY GROUPS</Text>
              {myGroups.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>No circles yet — create one below!</Text>
                </View>
              ) : myGroups.map((g, i) => (
                <View key={g.id} ref={i === 0 ? refFirstCard : undefined}>
                  <GroupCard group={g} onPress={() => router.push(`/group/${g.id}`)} />
                </View>
              ))}
            </View>

            {publicGroups.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>PUBLIC CIRCLES</Text>
                {publicGroups.map((g, i) => (
                  <TouchableOpacity
                    key={g.id}
                    ref={i === 0 ? refPublicCard : undefined}
                    style={styles.publicCard}
                    activeOpacity={0.85}
                    onPress={() => router.push(`/group/join/${g.id}`)}
                  >
                    <View style={[styles.groupIcon, { backgroundColor: categoryColor[g.category] ?? colors.grayBg }]}>
                      <MaterialCommunityIcons name={(categoryIcon[g.category] ?? 'circle-outline') as any} size={20} color={colors.primary} />
                    </View>
                    <View style={styles.groupInfo}>
                      <Text style={styles.groupTitle}>{g.title}</Text>
                      <Text style={styles.groupMeta}>
                        {g.members} members · ₩{g.amount.toLocaleString()}/mo
                        {g.slotsLeft > 0 ? ` · ${g.slotsLeft} slots left` : ''}
                      </Text>
                    </View>
                    <TouchableOpacity style={styles.joinBtn} onPress={() => router.push(`/group/join/${g.id}`)}>
                      <Text style={styles.joinBtnText}>Join</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}

        <TouchableOpacity ref={refCreateBtn} style={styles.createBtn} activeOpacity={0.85} onPress={() => router.push('/group/create')}>
          <MaterialCommunityIcons name="plus" size={20} color={colors.primary} />
          <Text style={styles.createBtnText}>Create new circle</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  bellBtn: {
    position: 'relative',
    padding: 4,
  },
  bellIcon: {
    fontSize: 20,
  },
  bellDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.danger,
    borderWidth: 1.5,
    borderColor: colors.surface,
  },
  scroll: {
    padding: 16,
    gap: 20,
    paddingBottom: 32,
  },
  section: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 0.5,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  groupIcon: {
    width: 42,
    height: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  groupIconText: {
    fontSize: 20,
  },
  groupInfo: {
    flex: 1,
    gap: 3,
  },
  groupTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  groupMeta: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  progressWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  progressBar: {
    flex: 1,
    height: 3,
    backgroundColor: colors.borderLight,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    flexShrink: 0,
  },
  badgeSuccess: {
    backgroundColor: colors.successBg,
  },
  badgeWarn: {
    backgroundColor: colors.warningBg,
  },
  badgeInfo: {
    backgroundColor: colors.infoBg,
  },
  badgeDanger: {
    backgroundColor: colors.dangerBg,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  publicCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 0.5,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  joinBtn: {
    backgroundColor: colors.infoBg,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  joinBtnText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.infoText,
  },
  createBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  createBtnText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#fff',
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderWidth: 0.5,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
})
