import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native'
import { useAuth } from '@/context/auth'
import { createOrUpdateUserProfile } from '@/firebase/auth'
import { colors } from '../../constants/colors'

const strings = {
  en: {
    title: 'Complete your profile',
    sub: 'This info is shared with your circle members',
    fullName: 'Full name',
    namePlaceholder: 'Enter your real name',
    phone: 'Phone number',
    phonePlaceholder: '+1 (000) 000-0000',
    phoneHint: 'Used so group members know how to reach you',
    payment: 'Preferred payment method',
    paymentHint: 'Shown to your group so they know where to send money',
    complete: 'Complete setup',
  },
  ko: {
    title: '프로필 설정',
    sub: '계 모임 멤버들과 공유되는 정보입니다',
    fullName: '이름',
    namePlaceholder: '실명을 입력하세요',
    phone: '전화번호',
    phonePlaceholder: '+82 010-0000-0000',
    phoneHint: '계 모임 멤버들이 연락할 수 있도록 사용됩니다',
    payment: '선호 결제 방법',
    paymentHint: '그룹 멤버들에게 송금 방법을 알려줍니다',
    complete: '설정 완료',
  },
}

export default function ProfileSetupScreen() {
  const { state, refreshAuthState } = useAuth()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [selectedMethod, setSelectedMethod] = useState('')
  const [loading, setLoading] = useState(false)
  const [lang, setLang] = useState<'en' | 'ko'>('en')
  const s = strings[lang]

  const user = state.status === 'needs-profile' ? state.user : null
  const googlePhoto = user?.photoURL

  const initials = name.trim()
    ? name.trim().split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : (user?.email?.[0] ?? '?').toUpperCase()

  const handleComplete = async () => {
    if (!user) return
    setLoading(true)
    try {
      await createOrUpdateUserProfile(user, { name, phone })
      await refreshAuthState()
    } catch (e: any) {
      Alert.alert('Error', e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.langToggle}
          onPress={() => setLang(lang === 'en' ? 'ko' : 'en')}
          activeOpacity={0.7}
        >
          <Text style={styles.langText}>{lang === 'en' ? '한국어' : 'English'}</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.inner} showsVerticalScrollIndicator={false}>

          <View style={styles.header}>
            {googlePhoto ? (
              <Image source={{ uri: googlePhoto }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>
            )}
            <Text style={styles.headerTitle}>{s.title}</Text>
            <Text style={styles.headerSub}>{s.sub}</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.fieldWrap}>
              <Text style={styles.label}>{s.fullName}</Text>
              <TextInput
                style={styles.input}
                placeholder={s.namePlaceholder}
                placeholderTextColor={colors.textLight}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.fieldWrap}>
              <Text style={styles.label}>{s.phone}</Text>
              <TextInput
                style={styles.input}
                placeholder={s.phonePlaceholder}
                placeholderTextColor={colors.textLight}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
              <Text style={styles.fieldHint}>{s.phoneHint}</Text>
            </View>

            <View style={styles.paymentSection}>
              <Text style={styles.label}>{s.payment}</Text>
              <Text style={styles.fieldHint}>{s.paymentHint}</Text>
              <View style={styles.methodGrid}>
                {['Kakao Pay', 'Toss', 'Bank transfer', 'Zelle', 'Venmo'].map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={[styles.methodPill, selectedMethod === m && styles.methodPillSelected]}
                    onPress={() => setSelectedMethod(m)}
                  >
                    <Text style={[styles.methodText, selectedMethod === m && styles.methodTextSelected]}>{m}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.completeBtn, (!name || !phone || loading) && styles.completeBtnDisabled]}
            onPress={handleComplete}
            disabled={!name || !phone || loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.completeBtnText}>{s.complete}</Text>
            }
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  topBar: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4 },
  langToggle: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: colors.primary },
  langText: { fontSize: 12, fontWeight: '500', color: colors.primary },
  inner: { padding: 24, paddingTop: 32, gap: 24 },
  header: { alignItems: 'center', gap: 10 },
  avatarImage: { width: 80, height: 80, borderRadius: 40, borderWidth: 2, borderColor: colors.primaryLighter },
  avatarPlaceholder: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: colors.primaryBg, borderWidth: 2, borderColor: colors.primaryLighter,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitials: { fontSize: 26, fontWeight: '600', color: colors.primary },
  headerTitle: { fontSize: 20, fontWeight: '600', color: colors.text },
  headerSub: { fontSize: 13, color: colors.textSecondary, textAlign: 'center' },
  form: { gap: 20 },
  fieldWrap: { gap: 6 },
  label: { fontSize: 13, fontWeight: '500', color: colors.text },
  input: {
    backgroundColor: colors.surface, borderWidth: 0.5, borderColor: colors.border,
    borderRadius: 10, padding: 13, fontSize: 14, color: colors.text,
  },
  fieldHint: { fontSize: 11, color: colors.textLight, marginTop: 2 },
  paymentSection: { gap: 8 },
  methodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  methodPill: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 0.5, borderColor: colors.border, backgroundColor: colors.surface,
  },
  methodText: { fontSize: 12, color: colors.textSecondary },
  methodPillSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  methodTextSelected: { color: '#fff', fontWeight: '500' },
  completeBtn: { backgroundColor: colors.primary, borderRadius: 12, padding: 15, alignItems: 'center', marginTop: 8 },
  completeBtnDisabled: { backgroundColor: colors.grayLight },
  completeBtnText: { fontSize: 15, fontWeight: '500', color: '#fff' },
})
