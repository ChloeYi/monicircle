import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  Image,
} from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { colors } from '../../../constants/colors'
import { useAuth } from '@/context/auth'
import { subscribeGroup, getSharedFundBalance } from '@/firebase/groups'
import { subscribeSpending, castVote, proposeSpending } from '@/firebase/spending'

export default function SpendingScreen() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const { state } = useAuth()
  const user = state.status === 'authenticated' ? state.user : null

  const [group, setGroup] = useState<any>(null)
  const [items, setItems] = useState<any[]>([])
  const [balance, setBalance] = useState(0)
  const [myVotes, setMyVotes] = useState<Record<string, string>>({})
  const [proposing, setProposing] = useState(false)
  const [proposeAmount, setProposeAmount] = useState('')
  const [proposeDesc, setProposeDesc] = useState('')
  const [receiptUri, setReceiptUri] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!id) return
    const unsub = subscribeGroup(id, setGroup)
    return unsub
  }, [id])

  useEffect(() => {
    if (!id) return
    const unsub = subscribeSpending(id, (newItems) => {
      setItems(newItems)
      if (user) {
        const votes: Record<string, string> = {}
        newItems.forEach((item) => {
          if (item.votes?.[user.uid]) votes[item.id] = item.votes[user.uid]
        })
        setMyVotes(votes)
      }
    })
    return unsub
  }, [id, user?.uid])

  useEffect(() => {
    if (!id) return
    getSharedFundBalance(id).then(setBalance)
  }, [id])

  const pendingItems = items.filter((i) => i.status === 'voting')
  const historyItems = items.filter((i) => i.status !== 'voting')

  const totalCollected = (group?.sharedFundAmount ?? 0)
  const spent = historyItems.filter((i) => i.status === 'approved').reduce((s: number, i: any) => s + (i.amount ?? 0), 0)

  async function handleVote(spendingId: string, vote: 'approve' | 'reject') {
    if (!id || !user) return
    setMyVotes((prev) => ({ ...prev, [spendingId]: vote }))
    try {
      await castVote(id, spendingId, user.uid, vote, group?.totalMembers ?? 1)
    } catch (e: any) {
      Alert.alert('Error', e.message)
      setMyVotes((prev) => { const n = { ...prev }; delete n[spendingId]; return n })
    }
  }

  async function pickReceipt() {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 })
    if (!result.canceled) setReceiptUri(result.assets[0].uri)
  }

  async function handlePropose() {
    if (!id || !user || !proposeAmount || !proposeDesc || !receiptUri) {
      Alert.alert('Missing info', 'Please fill all fields and attach a receipt.')
      return
    }
    setSubmitting(true)
    try {
      await proposeSpending(id, user.uid, Number(proposeAmount), proposeDesc, '', receiptUri)
      setProposeAmount('')
      setProposeDesc('')
      setReceiptUri(null)
      setProposing(false)
    } catch (e: any) {
      Alert.alert('Error', e.message)
    } finally {
      setSubmitting(false)
    }
  }

  const iconForDesc = (desc: string) => {
    if (!desc) return 'receipt-outline'
    const d = desc.toLowerCase()
    if (d.includes('coffee') || d.includes('cafe')) return 'coffee-outline'
    if (d.includes('gift') || d.includes('birthday')) return 'gift-outline'
    if (d.includes('food') || d.includes('dinner') || d.includes('lunch')) return 'food-outline'
    return 'receipt-outline'
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topbar}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
        <View style={styles.topbarCenter}>
          <Text style={styles.topbarTitle}>Shared spending</Text>
          <Text style={styles.topbarSub}>{group?.title ?? '—'}</Text>
        </View>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Shared fund balance</Text>
          <Text style={styles.balanceAmount}>₩{balance.toLocaleString()}</Text>
          {totalCollected > 0 && (
            <>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${Math.min(100, (spent / totalCollected) * 100)}%` }]} />
              </View>
              <Text style={styles.balanceDetail}>
                ₩{spent.toLocaleString()} spent of ₩{totalCollected.toLocaleString()} collected
              </Text>
            </>
          )}
        </View>

        {pendingItems.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>PENDING VOTE</Text>
            {pendingItems.map((item) => {
              const myVote = myVotes[item.id]
              const voteMap: Record<string, string> = item.votes ?? {}
              const approveCount = Object.values(voteMap).filter((v) => v === 'approve').length
              const rejectCount = Object.values(voteMap).filter((v) => v === 'reject').length
              const totalVoted = approveCount + rejectCount
              const totalMembers = group?.totalMembers ?? 1
              return (
                <View key={item.id} style={[styles.voteCard, { borderColor: '#FAC775' }]}>
                  <View style={styles.voteHeader}>
                    <View style={[styles.avatar, { backgroundColor: '#FFF3E0' }]}>
                      <MaterialCommunityIcons name="account-outline" size={16} color="#E65100" />
                    </View>
                    <View style={styles.voteHeaderInfo}>
                      <Text style={styles.voteName}>Spending proposal</Text>
                      <Text style={styles.voteTitle}>{item.description} · ₩{item.amount?.toLocaleString()}</Text>
                    </View>
                    <View style={[styles.badge, styles.badgeWarn]}>
                      <Text style={[styles.badgeText, { color: colors.warningText }]}>Voting</Text>
                    </View>
                  </View>

                  {item.receiptImageUrl && (
                    <View style={styles.receiptBox}>
                      <View style={styles.receiptIcon}>
                        <MaterialCommunityIcons name="receipt-outline" size={20} color={colors.warningText} />
                      </View>
                      <View style={styles.receiptInfo}>
                        <Text style={styles.receiptTitle}>Receipt attached</Text>
                      </View>
                      <TouchableOpacity style={styles.viewBtn} onPress={() => Alert.alert('Receipt', item.receiptImageUrl)}>
                        <Text style={styles.viewBtnText}>View</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  <View style={styles.voteCount}>
                    <Text style={styles.voteCountText}>
                      {approveCount} approve · {rejectCount} reject · {totalMembers - totalVoted} pending
                    </Text>
                  </View>

                  {!myVote ? (
                    <View style={styles.voteActions}>
                      <TouchableOpacity style={styles.approveBtn} onPress={() => handleVote(item.id, 'approve')} activeOpacity={0.85}>
                        <MaterialCommunityIcons name="check" size={16} color={colors.successText} />
                        <Text style={styles.approveBtnText}>Approve</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.rejectBtn} onPress={() => handleVote(item.id, 'reject')} activeOpacity={0.85}>
                        <MaterialCommunityIcons name="close" size={16} color={colors.dangerText} />
                        <Text style={styles.rejectBtnText}>Reject</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={[styles.votedBox, myVote === 'approve' ? styles.votedApprove : styles.votedReject]}>
                      <MaterialCommunityIcons name={myVote === 'approve' ? 'check' : 'close'} size={16} color={myVote === 'approve' ? colors.successText : colors.dangerText} />
                      <Text style={[styles.votedText, { color: myVote === 'approve' ? colors.successText : colors.dangerText }]}>
                        {myVote === 'approve' ? 'You approved' : 'You rejected'}
                      </Text>
                    </View>
                  )}
                </View>
              )
            })}
          </>
        )}

        {historyItems.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>SPENDING HISTORY</Text>
            <View style={styles.historyCard}>
              {historyItems.map((item, i) => (
                <View key={item.id} style={[styles.historyRow, i === historyItems.length - 1 && { borderBottomWidth: 0 }]}>
                  <View style={[styles.historyIcon, { backgroundColor: colors.primaryBg }]}>
                    <MaterialCommunityIcons name={iconForDesc(item.description) as any} size={20} color={colors.primary} />
                  </View>
                  <View style={styles.historyInfo}>
                    <Text style={styles.historyTitle}>{item.description}</Text>
                    <Text style={styles.historyMeta}>₩{item.amount?.toLocaleString()}</Text>
                  </View>
                  <View style={[styles.badge, item.status === 'approved' ? styles.badgeSuccess : styles.badgeDanger]}>
                    <Text style={[styles.badgeText, { color: item.status === 'approved' ? colors.successText : colors.dangerText }]}>
                      {item.status === 'approved' ? 'Approved' : 'Rejected'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {pendingItems.length === 0 && historyItems.length === 0 && (
          <View style={styles.emptyCard}>
            <MaterialCommunityIcons name="receipt-text-outline" size={32} color={colors.textLight} />
            <Text style={styles.emptyText}>No spending proposals yet</Text>
          </View>
        )}

        <TouchableOpacity style={styles.proposeBtn} activeOpacity={0.85} onPress={() => setProposing(true)}>
          <Text style={styles.proposeBtnText}>+ Propose new spending</Text>
        </TouchableOpacity>

      </ScrollView>

      <Modal visible={proposing} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Propose spending</Text>
            <TextInput
              style={styles.input}
              placeholder="Description (e.g. Group dinner)"
              placeholderTextColor={colors.textLight}
              value={proposeDesc}
              onChangeText={setProposeDesc}
            />
            <TextInput
              style={styles.input}
              placeholder="Amount (₩)"
              placeholderTextColor={colors.textLight}
              keyboardType="numeric"
              value={proposeAmount}
              onChangeText={setProposeAmount}
            />
            <TouchableOpacity style={styles.receiptPickBtn} onPress={pickReceipt}>
              <MaterialCommunityIcons name={receiptUri ? 'check-circle-outline' : 'camera-plus-outline'} size={18} color={colors.primary} />
              <Text style={styles.receiptPickText}>{receiptUri ? 'Receipt attached' : 'Attach receipt'}</Text>
            </TouchableOpacity>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setProposing(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.submitBtn, submitting && { opacity: 0.6 }]} onPress={handlePropose} disabled={submitting}>
                {submitting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.submitBtnText}>Submit</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  balanceCard: { backgroundColor: colors.primary, borderRadius: 14, padding: 16 },
  balanceLabel: { fontSize: 11, color: colors.primaryLighter, marginBottom: 4 },
  balanceAmount: { fontSize: 26, fontWeight: '500', color: '#fff' },
  progressBar: { width: '100%', height: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2, marginTop: 10, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#FFD54F', borderRadius: 2 },
  balanceDetail: { fontSize: 11, color: colors.primaryLighter, marginTop: 6 },
  sectionLabel: { fontSize: 11, fontWeight: '500', color: colors.textSecondary, letterSpacing: 0.5, marginBottom: 2 },
  voteCard: { backgroundColor: colors.surface, borderWidth: 1, borderRadius: 12, padding: 14, gap: 12 },
  voteHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  voteHeaderInfo: { flex: 1 },
  voteName: { fontSize: 12, color: colors.textSecondary },
  voteTitle: { fontSize: 13, fontWeight: '500', color: colors.text },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  badgeSuccess: { backgroundColor: colors.successBg },
  badgeWarn: { backgroundColor: colors.warningBg },
  badgeDanger: { backgroundColor: colors.dangerBg },
  badgeText: { fontSize: 11, fontWeight: '500' },
  receiptBox: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.background, borderRadius: 8, padding: 10 },
  receiptIcon: { width: 38, height: 38, backgroundColor: colors.warningBg, borderRadius: 8, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  receiptInfo: { flex: 1 },
  receiptTitle: { fontSize: 12, fontWeight: '500', color: colors.text },
  viewBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, borderWidth: 0.5, borderColor: colors.border },
  viewBtnText: { fontSize: 11, color: colors.textSecondary },
  voteCount: { paddingVertical: 2 },
  voteCountText: { fontSize: 12, color: colors.textSecondary },
  voteActions: { flexDirection: 'row', gap: 10 },
  approveBtn: { flex: 1, backgroundColor: colors.successBg, borderRadius: 8, padding: 10, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 4 },
  approveBtnText: { fontSize: 13, fontWeight: '500', color: colors.successText },
  rejectBtn: { flex: 1, backgroundColor: colors.dangerBg, borderRadius: 8, padding: 10, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 4 },
  rejectBtnText: { fontSize: 13, fontWeight: '500', color: colors.dangerText },
  votedBox: { borderRadius: 8, padding: 10, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 4 },
  votedApprove: { backgroundColor: colors.successBg },
  votedReject: { backgroundColor: colors.dangerBg },
  votedText: { fontSize: 13, fontWeight: '500' },
  historyCard: { backgroundColor: colors.surface, borderWidth: 0.5, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 12 },
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: colors.borderLight },
  historyIcon: { width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  historyInfo: { flex: 1 },
  historyTitle: { fontSize: 13, fontWeight: '500', color: colors.text },
  historyMeta: { fontSize: 11, color: colors.textSecondary },
  emptyCard: { backgroundColor: colors.surface, borderWidth: 0.5, borderColor: colors.border, borderRadius: 12, padding: 24, alignItems: 'center', gap: 8 },
  emptyText: { fontSize: 13, color: colors.textSecondary },
  proposeBtn: { backgroundColor: colors.surface, borderWidth: 0.5, borderColor: colors.border, borderRadius: 12, padding: 14, alignItems: 'center' },
  proposeBtnText: { fontSize: 14, color: colors.text },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, gap: 12 },
  modalTitle: { fontSize: 16, fontWeight: '500', color: colors.text, marginBottom: 4 },
  input: { borderWidth: 0.5, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: colors.text, backgroundColor: colors.background },
  receiptPickBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, backgroundColor: colors.primaryBg, borderRadius: 10 },
  receiptPickText: { fontSize: 13, color: colors.primary, fontWeight: '500' },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelBtn: { flex: 1, padding: 12, borderRadius: 10, borderWidth: 0.5, borderColor: colors.border, alignItems: 'center' },
  cancelBtnText: { fontSize: 14, color: colors.textSecondary },
  submitBtn: { flex: 1, padding: 12, borderRadius: 10, backgroundColor: colors.primary, alignItems: 'center' },
  submitBtnText: { fontSize: 14, color: '#fff', fontWeight: '500' },
})
