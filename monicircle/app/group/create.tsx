import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useAuth } from '@/context/auth'
import { createGroup } from '@/firebase/groups'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { colors } from '../../constants/colors'

const CATEGORIES = [
  { id: 'friends', label: 'Friends', icon: 'account-group-outline' },
  { id: 'family', label: 'Family', icon: 'home-heart-outline' },
  { id: 'church', label: 'Church', icon: 'church' },
  { id: 'work', label: 'Work', icon: 'briefcase-outline' },
  { id: 'study', label: 'Study', icon: 'book-outline' },
  { id: 'other', label: 'Other', icon: 'circle-outline' },
]

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function CreateGroupScreen() {
  const router = useRouter()
  const { state } = useAuth()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title: '',
    category: 'friends',
    isPrivate: true,
    cycle: 'monthly',
    paymentDay: '4',
    totalMembers: '8',
    amount: '500000',
    recipientsPerCycle: '1',
    sharedFund: '',
    startDate: '',
    finishDate: '',
    joinDeadline: '',
  })

  const potAmount = parseInt(form.amount || '0') * parseInt(form.totalMembers || '0')
  const update = (key: string, val: string) => setForm((f) => ({ ...f, [key]: val }))

  async function handleCreate() {
    const user = state.status === 'authenticated' ? state.user : null
    if (!user) return
    setLoading(true)
    try {
      const now = new Date()
      const start = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      const deadline = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000)
      const dayNum = parseInt(form.paymentDay) || 4
      const groupId = await createGroup({
        title: form.title,
        category: form.category as any,
        isPublic: !form.isPrivate,
        gyejuId: user.uid,
        contributionAmount: parseInt(form.amount) || 0,
        cycle: form.cycle as 'monthly' | 'weekly',
        recipientsPerCycle: parseInt(form.recipientsPerCycle) || 1,
        paymentDay: dayNum,
        startDate: start,
        joinDeadline: deadline,
        totalMembers: parseInt(form.totalMembers) || 2,
        sharedFundAmount: parseInt(form.sharedFund) || 0,
      })
      router.replace(`/group/${groupId}`)
    } catch (e: any) {
      Alert.alert('Error', e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topbar}>
        <TouchableOpacity onPress={() => step > 1 ? setStep(s => s - 1) : router.back()}>
          <MaterialCommunityIcons
            name={step > 1 ? 'arrow-left' : 'close'}
            size={20}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
        <View style={styles.topbarCenter}>
          <Text style={styles.topbarTitle}>Create new circle</Text>
          <Text style={styles.topbarSub}>Step {step} of 3</Text>
        </View>
        <View style={{ width: 32 }} />
      </View>

      <View style={styles.stepBar}>
        {[1, 2, 3].map((s) => (
          <View key={s} style={[styles.stepDot, s <= step && styles.stepDotActive]} />
        ))}
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

          {step === 1 && (
            <>
              <View style={styles.fieldWrap}>
                <Text style={styles.label}>Circle name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Friends travel fund"
                  placeholderTextColor={colors.textLight}
                  value={form.title}
                  onChangeText={(v) => update('title', v)}
                />
              </View>

              <View style={styles.fieldWrap}>
                <Text style={styles.label}>Category</Text>
                <View style={styles.catGrid}>
                  {CATEGORIES.map((c) => (
                    <TouchableOpacity
                      key={c.id}
                      style={[styles.catPill, form.category === c.id && styles.catPillActive]}
                      onPress={() => update('category', c.id)}
                    >
                      <MaterialCommunityIcons name={c.icon as any} size={16} color={form.category === c.id ? '#fff' : colors.primary} />
                      <Text style={[styles.catLabel, form.category === c.id && styles.catLabelActive]}>
                        {c.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.fieldWrap}>
                <Text style={styles.label}>Visibility</Text>
                <View style={styles.optGrid}>
                  <TouchableOpacity
                    style={[styles.optCard, form.isPrivate && styles.optCardActive]}
                    onPress={() => update('isPrivate', 'true')}
                  >
                    <Text style={styles.optIcon}>🔒</Text>
                    <Text style={[styles.optTitle, form.isPrivate && styles.optTitleActive]}>Private</Text>
                    <Text style={[styles.optSub, form.isPrivate && styles.optSubActive]}>Invite only</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.optCard, !form.isPrivate && styles.optCardActive]}
                    onPress={() => update('isPrivate', '')}
                  >
                    <Text style={styles.optIcon}>🌐</Text>
                    <Text style={[styles.optTitle, !form.isPrivate && styles.optTitleActive]}>Public</Text>
                    <Text style={[styles.optSub, !form.isPrivate && styles.optSubActive]}>Discoverable</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}

          {step === 2 && (
            <>
              <View style={styles.fieldWrap}>
                <Text style={styles.label}>Payment cycle</Text>
                <View style={styles.optGrid}>
                  <TouchableOpacity
                    style={[styles.optCard, form.cycle === 'monthly' && styles.optCardActive]}
                    onPress={() => update('cycle', 'monthly')}
                  >
                    <Text style={[styles.optTitle, form.cycle === 'monthly' && styles.optTitleActive]}>Monthly</Text>
                    <Text style={[styles.optSub, form.cycle === 'monthly' && styles.optSubActive]}>Most common</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.optCard, form.cycle === 'weekly' && styles.optCardActive]}
                    onPress={() => update('cycle', 'weekly')}
                  >
                    <Text style={[styles.optTitle, form.cycle === 'weekly' && styles.optTitleActive]}>Weekly</Text>
                    <Text style={[styles.optSub, form.cycle === 'weekly' && styles.optSubActive]}>Faster cycle</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.fieldWrap}>
                <Text style={styles.label}>
                  {form.cycle === 'monthly' ? 'Payment day of month (1–28)' : 'Payment day of week'}
                </Text>
                {form.cycle === 'monthly' ? (
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 4"
                    placeholderTextColor={colors.textLight}
                    value={form.paymentDay}
                    onChangeText={(v) => update('paymentDay', v)}
                    keyboardType="number-pad"
                    maxLength={2}
                  />
                ) : (
                  <View style={styles.daysRow}>
                    {DAYS.map((d) => (
                      <TouchableOpacity
                        key={d}
                        style={[styles.dayPill, form.paymentDay === d && styles.dayPillActive]}
                        onPress={() => update('paymentDay', d)}
                      >
                        <Text style={[styles.dayText, form.paymentDay === d && styles.dayTextActive]}>{d}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
                {form.cycle === 'monthly' && parseInt(form.paymentDay) > 28 && (
                  <Text style={styles.warningText}>⚠ Set to 28 or earlier for all months</Text>
                )}
              </View>

              <View style={styles.twoCol}>
                <View style={[styles.fieldWrap, { flex: 1 }]}>
                  <Text style={styles.label}>Members</Text>
                  <TextInput
                    style={styles.input}
                    value={form.totalMembers}
                    onChangeText={(v) => update('totalMembers', v)}
                    keyboardType="number-pad"
                    maxLength={2}
                  />
                </View>
                <View style={[styles.fieldWrap, { flex: 1 }]}>
                  <Text style={styles.label}>Per person (₩)</Text>
                  <TextInput
                    style={styles.input}
                    value={form.amount}
                    onChangeText={(v) => update('amount', v)}
                    keyboardType="number-pad"
                  />
                </View>
              </View>

              {potAmount > 0 && (
                <View style={styles.potBox}>
                  <Text style={styles.potLabel}>Total pot per round</Text>
                  <Text style={styles.potAmount}>₩{potAmount.toLocaleString()}</Text>
                </View>
              )}

              <View style={styles.fieldWrap}>
                <Text style={styles.label}>Finish date (optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Oct 4, 2025"
                  placeholderTextColor={colors.textLight}
                  value={form.finishDate}
                  onChangeText={(v) => update('finishDate', v)}
                />
                <Text style={styles.fieldHint}>Remaining shared fund split equally at finish</Text>
              </View>

              <View style={styles.fieldWrap}>
                <Text style={styles.label}>Shared spending fund (optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Extra per person per round e.g. 10000"
                  placeholderTextColor={colors.textLight}
                  value={form.sharedFund}
                  onChangeText={(v) => update('sharedFund', v)}
                  keyboardType="number-pad"
                />
              </View>
            </>
          )}

          {step === 3 && (
            <>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>{form.title || 'My circle'}</Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Members</Text>
                  <Text style={styles.summaryValue}>{form.totalMembers}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Contribution</Text>
                  <Text style={styles.summaryValue}>₩{parseInt(form.amount || '0').toLocaleString()}/round</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Pot per round</Text>
                  <Text style={[styles.summaryValue, { color: colors.primary }]}>₩{potAmount.toLocaleString()}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Cycle</Text>
                  <Text style={styles.summaryValue}>{form.cycle === 'monthly' ? `Monthly · ${form.paymentDay}th` : `Weekly · ${form.paymentDay}`}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Visibility</Text>
                  <Text style={styles.summaryValue}>{form.isPrivate ? '🔒 Private' : '🌐 Public'}</Text>
                </View>
              </View>

              <View style={styles.fieldWrap}>
                <Text style={styles.label}>Invite members</Text>
                <TouchableOpacity style={styles.inviteBox}>
                  <Text style={styles.inviteIcon}>🔗</Text>
                  <Text style={styles.inviteText}>Copy invite link</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          <TouchableOpacity
            style={[styles.nextBtn, ((!form.title && step === 1) || loading) && styles.nextBtnDisabled]}
            onPress={() => step < 3 ? setStep(s => s + 1) : handleCreate()}
            disabled={(!form.title && step === 1) || loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.nextBtnText}>{step === 3 ? 'Create circle' : 'Next'}</Text>
            }
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
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
  stepBar: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  stepDot: { flex: 1, height: 3, backgroundColor: colors.border, borderRadius: 2 },
  stepDotActive: { backgroundColor: colors.primary },
  scroll: { padding: 16, gap: 20, paddingBottom: 32 },
  fieldWrap: { gap: 6 },
  label: { fontSize: 13, fontWeight: '500', color: colors.text },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 0.5,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: colors.text,
  },
  fieldHint: { fontSize: 11, color: colors.textLight },
  warningText: { fontSize: 11, color: colors.danger },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  catPillActive: { borderWidth: 2, borderColor: colors.primary, backgroundColor: colors.primaryBg },
  catLabel: { fontSize: 12, color: colors.textSecondary },
  catLabelActive: { color: colors.successText, fontWeight: '500' },
  optGrid: { flexDirection: 'row', gap: 10 },
  optCard: {
    flex: 1,
    borderWidth: 0.5,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    backgroundColor: colors.surface,
    gap: 4,
  },
  optCardActive: { borderWidth: 2, borderColor: colors.primary, backgroundColor: colors.primaryBg },
  optIcon: { fontSize: 20 },
  optTitle: { fontSize: 13, fontWeight: '500', color: colors.text },
  optTitleActive: { color: colors.successText },
  optSub: { fontSize: 11, color: colors.textSecondary },
  optSubActive: { color: colors.primary },
  daysRow: { flexDirection: 'row', gap: 6 },
  dayPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  dayPillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  dayText: { fontSize: 11, color: colors.textSecondary },
  dayTextActive: { color: '#fff', fontWeight: '500' },
  twoCol: { flexDirection: 'row', gap: 12 },
  potBox: {
    backgroundColor: colors.primaryBg,
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    gap: 4,
  },
  potLabel: { fontSize: 11, color: colors.primary },
  potAmount: { fontSize: 22, fontWeight: '500', color: colors.successText },
  summaryCard: {
    backgroundColor: colors.surface,
    borderWidth: 0.5,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  summaryTitle: { fontSize: 16, fontWeight: '500', color: colors.text },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel: { fontSize: 13, color: colors.textSecondary },
  summaryValue: { fontSize: 13, fontWeight: '500', color: colors.text },
  inviteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderWidth: 0.5,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 14,
  },
  inviteIcon: { fontSize: 18 },
  inviteText: { fontSize: 14, color: colors.text },
  nextBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    marginTop: 8,
  },
  nextBtnDisabled: { backgroundColor: colors.grayLight },
  nextBtnText: { fontSize: 15, fontWeight: '500', color: '#fff' },
})
