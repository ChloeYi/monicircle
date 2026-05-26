import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  Image,
  Modal,
  ActivityIndicator,
} from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { colors } from '../../../constants/colors'
import { subscribeProofs, approveProof, rejectProof, type PaymentProof } from '@/firebase/proofs'

const MOCK_OVERDUE = [
  { id: '3', initials: 'SY', name: '신예은', round: 4, dueDate: 'Jun 4' },
]

const avatarColors = ['#FFF3E0', '#FCE4EC', '#EDE7F6']
const avatarTextColors = ['#E65100', '#880E4F', '#4527A0']

export default function ApprovalsScreen() {
  const router = useRouter()
  const { id: groupId } = useLocalSearchParams<{ id: string }>()
  const [proofs, setProofs] = useState<PaymentProof[]>([])
  const [viewImage, setViewImage] = useState<string | null>(null)

  useEffect(() => {
    if (!groupId) return
    const unsub = subscribeProofs(groupId, setProofs)
    return unsub
  }, [groupId])

  const handleApprove = (proof: PaymentProof) => {
    Alert.alert('Approve payment', `Approve ${proof.userName}'s payment proof?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Approve',
        onPress: async () => {
          try {
            await approveProof(groupId!, proof.id, proof.storagePath)
          } catch (e: any) {
            Alert.alert('Error', e.message)
          }
        },
      },
    ])
  }

  const handleReject = (proof: PaymentProof) => {
    Alert.alert('Reject payment', `Reject ${proof.userName}'s payment proof?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: async () => {
          try {
            await rejectProof(groupId!, proof.id, proof.storagePath)
          } catch (e: any) {
            Alert.alert('Error', e.message)
          }
        },
      },
    ])
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topbar}>
        <TouchableOpacity onPress={() => router.back()}><MaterialCommunityIcons name="arrow-left" size={20} color={colors.textSecondary} /></TouchableOpacity>
        <View style={styles.topbarCenter}>
          <Text style={styles.topbarTitle}>Approve payments</Text>
          <Text style={styles.topbarSub}>{proofs.length} awaiting · Round 4</Text>
        </View>
        <View style={{ width: 32 }} />
      </View>

      {/* Full-screen image viewer */}
      <Modal visible={!!viewImage} transparent animationType="fade" onRequestClose={() => setViewImage(null)}>
        <View style={styles.imageModal}>
          <TouchableOpacity style={styles.imageModalClose} onPress={() => setViewImage(null)}>
            <MaterialCommunityIcons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          {viewImage && <Image source={{ uri: viewImage }} style={styles.imageModalImg} resizeMode="contain" />}
        </View>
      </Modal>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        <Text style={styles.sectionLabel}>PAYMENT PROOF — AWAITING ({proofs.length})</Text>

        {proofs.length === 0 && (
          <View style={styles.emptyCard}>
            <MaterialCommunityIcons name="check-all" size={32} color={colors.successText} />
            <Text style={styles.emptyText}>All payments reviewed</Text>
          </View>
        )}

        {proofs.map((p, i) => (
          <View key={p.id} style={styles.proofCard}>
            <View style={styles.proofHeader}>
              <View style={[styles.avatar, { backgroundColor: avatarColors[i % avatarColors.length] }]}>
                <Text style={[styles.avatarText, { color: avatarTextColors[i % avatarTextColors.length] }]}>
                  {p.userInitials}
                </Text>
              </View>
              <View style={styles.proofHeaderInfo}>
                <Text style={styles.proofName}>{p.userName}</Text>
                <Text style={styles.proofMeta}>Submitted {p.submittedAt?.toDate?.()?.toLocaleDateString() ?? '—'}</Text>
              </View>
              <View style={[styles.badge, styles.badgeWarn]}>
                <Text style={[styles.badgeText, { color: colors.warningText }]}>Pending</Text>
              </View>
            </View>

            <View style={styles.screenshotBox}>
              <View style={styles.screenshotIcon}>
                <MaterialCommunityIcons name="image-outline" size={20} color={colors.primary} />
              </View>
              <View style={styles.screenshotInfo}>
                <Text style={styles.screenshotTitle}>{p.method} screenshot</Text>
                <Text style={styles.screenshotMeta}>
                  ₩{p.amount.toLocaleString()} → {p.recipient} · Round {p.round}
                </Text>
              </View>
              <TouchableOpacity style={styles.viewBtn} onPress={() => setViewImage(p.imageUrl)}>
                <Text style={styles.viewBtnText}>View</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.approveBtn} onPress={() => handleApprove(p)} activeOpacity={0.85}>
                <MaterialCommunityIcons name="check" size={16} color={colors.successText} />
                <Text style={styles.approveBtnText}>Approve</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.rejectBtn} onPress={() => handleReject(p)} activeOpacity={0.85}>
                <MaterialCommunityIcons name="close" size={16} color={colors.dangerText} />
                <Text style={styles.rejectBtnText}>Reject</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <Text style={[styles.sectionLabel, { marginTop: 8 }]}>OVERDUE</Text>

        {MOCK_OVERDUE.map((o) => (
          <View key={o.id} style={[styles.proofCard, styles.overdueCard]}>
            <View style={styles.proofHeader}>
              <View style={[styles.avatar, { backgroundColor: colors.dangerBg }]}>
                <Text style={[styles.avatarText, { color: colors.dangerText }]}>{o.initials}</Text>
              </View>
              <View style={styles.proofHeaderInfo}>
                <Text style={styles.proofName}>{o.name}</Text>
                <Text style={styles.proofMeta}>Due {o.dueDate} — no proof submitted</Text>
              </View>
              <View style={[styles.badge, styles.badgeDanger]}>
                <Text style={[styles.badgeText, { color: colors.dangerText }]}>Overdue</Text>
              </View>
            </View>
          </View>
        ))}

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
  scroll: { padding: 16, gap: 10, paddingBottom: 32 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  proofCard: {
    backgroundColor: colors.surface,
    borderWidth: 0.5,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  proofCardDone: { opacity: 0.6 },
  overdueCard: { borderColor: colors.dangerBg },
  proofHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: { fontSize: 11, fontWeight: '500' },
  proofHeaderInfo: { flex: 1 },
  proofName: { fontSize: 13, fontWeight: '500', color: colors.text },
  proofMeta: { fontSize: 11, color: colors.textSecondary },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  badgeSuccess: { backgroundColor: colors.successBg },
  badgeWarn: { backgroundColor: colors.warningBg },
  badgeDanger: { backgroundColor: colors.dangerBg },
  badgeText: { fontSize: 11, fontWeight: '500' },
  screenshotBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 10,
  },
  screenshotIcon: {
    width: 40,
    height: 40,
    backgroundColor: colors.infoBg,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  screenshotInfo: { flex: 1 },
  screenshotTitle: { fontSize: 12, fontWeight: '500', color: colors.text },
  screenshotMeta: { fontSize: 11, color: colors.textSecondary, marginTop: 1 },
  viewBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  viewBtnText: { fontSize: 11, color: colors.textSecondary },
  actionRow: { flexDirection: 'row', gap: 10 },
  approveBtn: {
    flex: 1,
    backgroundColor: colors.successBg,
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  approveBtnText: { fontSize: 13, fontWeight: '500', color: colors.successText },
  rejectBtn: {
    flex: 1,
    backgroundColor: colors.dangerBg,
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  rejectBtnText: { fontSize: 13, fontWeight: '500', color: colors.dangerText },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    gap: 8,
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  emptyText: { fontSize: 13, color: colors.textSecondary },
  imageModal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalClose: {
    position: 'absolute',
    top: 56,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  imageModalImg: {
    width: '100%',
    height: '80%',
  },
})
