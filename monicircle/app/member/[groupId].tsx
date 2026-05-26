import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { colors } from '../../constants/colors'
import { useAuth } from '@/context/auth'
import { uploadProof, getMyProofForRound, type PaymentProof } from '@/firebase/proofs'

const MOCK_GROUP = {
  roundNumber: 4,
  amount: 500000,
  recipient: '정혜원',
  method: 'Kakao Pay',
}

export default function MemberViewScreen() {
  const router = useRouter()
  const { groupId } = useLocalSearchParams<{ groupId: string }>()
  const { state } = useAuth()
  const user = state.status === 'authenticated' ? state.user : null

  const [proof, setProof] = useState<PaymentProof | null>(null)
  const [uploading, setUploading] = useState(false)

  const handleUpload = async (source: 'camera' | 'gallery') => {
    const permission = source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync()

    if (!permission.granted) {
      Alert.alert('Permission needed', `Please allow ${source} access in Settings.`)
      return
    }

    const result = source === 'camera'
      ? await ImagePicker.launchCameraAsync({ quality: 1 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images', quality: 1 })

    if (result.canceled || !result.assets[0]) return
    if (!user || !groupId) return

    setUploading(true)
    try {
      await uploadProof({
        groupId,
        roundNumber: MOCK_GROUP.roundNumber,
        userId: user.uid,
        userName: user.displayName ?? 'Unknown',
        userInitials: (user.displayName ?? 'U').split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2),
        method: MOCK_GROUP.method,
        amount: MOCK_GROUP.amount,
        recipient: MOCK_GROUP.recipient,
        imageUri: result.assets[0].uri,
      })
      const saved = await getMyProofForRound(groupId, MOCK_GROUP.roundNumber, user.uid)
      setProof(saved)
    } catch (e: any) {
      Alert.alert('Upload failed', e.message)
    } finally {
      setUploading(false)
    }
  }

  const promptUpload = () => {
    Alert.alert('Upload proof', 'Take a photo or choose from gallery', [
      { text: 'Camera', onPress: () => handleUpload('camera') },
      { text: 'Gallery', onPress: () => handleUpload('gallery') },
      { text: 'Cancel', style: 'cancel' },
    ])
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topbar}>
        <TouchableOpacity onPress={() => router.back()}><MaterialCommunityIcons name="arrow-left" size={20} color={colors.textSecondary} /></TouchableOpacity>
        <View style={styles.topbarCenter}>
          <Text style={styles.topbarTitle}>친구들 여행 계</Text>
          <Text style={styles.topbarSub}>Member view · Turn #5</Text>
        </View>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        <View style={styles.myStatusCard}>
          <Text style={styles.myStatusLabel}>Your payout</Text>
          <Text style={styles.myStatusAmount}>₩4,000,000</Text>
          <Text style={styles.myStatusDate}>Turn #5 · July 4, 2025</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '50%' }]} />
          </View>
          <Text style={styles.myStatusSub}>4 rounds to go</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Paid so far</Text>
            <Text style={[styles.statValue, { color: colors.primary }]}>₩2,000,000</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Still to pay</Text>
            <Text style={styles.statValue}>₩2,000,000</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>THIS MONTH — SEND PAYMENT TO</Text>
        <View style={styles.sendToCard}>
          <View style={[styles.avatar, { backgroundColor: colors.primaryBg }]}>
            <Text style={[styles.avatarText, { color: colors.primary }]}>JH</Text>
          </View>
          <View style={styles.sendToInfo}>
            <Text style={styles.sendToName}>정혜원</Text>
            <Text style={styles.sendToMeta}>Recipient · Turn #4</Text>
            <Text style={styles.sendToMethod}>Kakao Pay · 010-5523-7890</Text>
          </View>
          <View style={[styles.badge, styles.badgeSuccess]}>
            <Text style={[styles.badgeText, { color: colors.successText }]}>This month</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>YOUR PAYMENT THIS ROUND</Text>
        {uploading ? (
          <View style={styles.uploadBox}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.uploadTitle}>Uploading...</Text>
            <Text style={styles.uploadSub}>Compressing and sending your proof</Text>
          </View>
        ) : proof ? (
          <View style={styles.paymentCard}>
            <MaterialCommunityIcons name="check-circle-outline" size={20} color={colors.successText} />
            <View style={styles.paymentInfo}>
              <Text style={styles.paymentName}>Proof submitted</Text>
              <Text style={styles.paymentMeta}>
                {proof.status === 'pending' ? 'Waiting for organizer approval' :
                 proof.status === 'approved' ? 'Approved ✓' : 'Rejected — please resubmit'}
              </Text>
            </View>
            <View style={[styles.badge,
              proof.status === 'pending' ? styles.badgeWarn :
              proof.status === 'approved' ? styles.badgeSuccess : styles.badgeDanger
            ]}>
              <Text style={[styles.badgeText, {
                color: proof.status === 'pending' ? colors.warningText :
                       proof.status === 'approved' ? colors.successText : colors.dangerText
              }]}>
                {proof.status === 'pending' ? 'Pending' : proof.status === 'approved' ? 'Approved' : 'Rejected'}
              </Text>
            </View>
          </View>
        ) : (
          <TouchableOpacity style={styles.uploadBox} onPress={promptUpload} activeOpacity={0.85}>
            <MaterialCommunityIcons name="upload-outline" size={20} color={colors.primary} />
            <Text style={styles.uploadTitle}>Upload payment proof</Text>
            <Text style={styles.uploadSub}>Screenshot or photo of transfer</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.sectionLabel}>SAVINGS COMPARISON</Text>
        <View style={styles.compCard}>
          <View style={styles.compRow}>
            <Text style={styles.compLabel}>Saving alone</Text>
            <Text style={styles.compValue}>Month 8</Text>
          </View>
          <View style={styles.compDivider} />
          <View style={styles.compRow}>
            <Text style={[styles.compLabel, { color: colors.primary }]}>With circle (turn #5)</Text>
            <Text style={[styles.compValue, { color: colors.primary }]}>Month 5 — 3 months faster</Text>
          </View>
        </View>

      </ScrollView>

      <View style={styles.tabBar}>
        {[
          { id: 'status', label: 'My status', icon: 'view-dashboard-outline' },
          { id: 'proof', label: 'Pay proof', icon: 'upload-outline' },
          { id: 'spending', label: 'Spending', icon: 'receipt-outline' },
          { id: 'schedule', label: 'Schedule', icon: 'calendar-outline' },
        ].map((tab) => (
          <TouchableOpacity key={tab.id} style={styles.tabBtn}>
            <MaterialCommunityIcons
              name={tab.icon as any}
              size={20}
              color={tab.id === 'status' ? colors.primary : colors.textLight}
            />
            <Text style={[styles.tabLabel, tab.id === 'status' && styles.tabLabelActive]}>
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
  topbarCenter: { flex: 1, alignItems: 'center' },
  topbarTitle: { fontSize: 15, fontWeight: '500', color: colors.text },
  topbarSub: { fontSize: 11, color: colors.textSecondary, marginTop: 1 },
  scroll: { padding: 16, gap: 12, paddingBottom: 32 },
  myStatusCard: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  myStatusLabel: { fontSize: 11, color: colors.primaryLighter, marginBottom: 4 },
  myStatusAmount: { fontSize: 28, fontWeight: '500', color: '#fff' },
  myStatusDate: { fontSize: 12, color: colors.primaryLighter, marginTop: 4 },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    marginTop: 12,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: '#fff', borderRadius: 2 },
  myStatusSub: { fontSize: 11, color: colors.primaryLighter, marginTop: 6 },
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 12,
    borderWidth: 0.5,
    borderColor: colors.border,
    gap: 4,
  },
  statLabel: { fontSize: 11, color: colors.textSecondary },
  statValue: { fontSize: 16, fontWeight: '500', color: colors.text },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  sendToCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.primaryBg,
    borderWidth: 1,
    borderColor: colors.primaryLighter,
    borderRadius: 12,
    padding: 12,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: { fontSize: 11, fontWeight: '500' },
  sendToInfo: { flex: 1, gap: 2 },
  sendToName: { fontSize: 14, fontWeight: '500', color: colors.successText },
  sendToMeta: { fontSize: 11, color: colors.primary },
  sendToMethod: { fontSize: 12, fontWeight: '500', color: colors.successText },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  badgeSuccess: { backgroundColor: colors.successBg },
  badgeWarn: { backgroundColor: colors.warningBg },
  badgeDanger: { backgroundColor: colors.dangerBg },
  badgeText: { fontSize: 11, fontWeight: '500' },
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderWidth: 0.5,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
  },
  paymentInfo: { flex: 1 },
  paymentName: { fontSize: 13, fontWeight: '500', color: colors.text },
  paymentMeta: { fontSize: 11, color: colors.textSecondary },
  uploadBox: {
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
  },
  uploadTitle: { fontSize: 14, fontWeight: '500', color: colors.text },
  uploadSub: { fontSize: 12, color: colors.textSecondary },
  compCard: {
    backgroundColor: colors.surface,
    borderWidth: 0.5,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  compRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  compLabel: { fontSize: 13, color: colors.textSecondary },
  compValue: { fontSize: 13, fontWeight: '500', color: colors.text },
  compDivider: { height: 0.5, backgroundColor: colors.border },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 0.5,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  tabBtn: { flex: 1, alignItems: 'center', paddingVertical: 8, gap: 2 },
  tabLabel: { fontSize: 10, color: colors.textLight },
  tabLabelActive: { color: colors.primary },
})
