import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  Platform,
} from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { colors } from '../../constants/colors'
import { useAuth } from '@/context/auth'
import BrandHeader from '@/components/BrandHeader'
import { useLanguage } from '@/context/language'

export default function ProfileScreen() {
  const { signOut } = useAuth()
  const { lang, setLang } = useLanguage()

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Log out?')) signOut()
      return
    }
    Alert.alert('Log out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: () => signOut() },
    ])
  }

  return (
    <SafeAreaView style={styles.container}>
      <BrandHeader right={
        <TouchableOpacity>
          <Text style={styles.editText}>Edit</Text>
        </TouchableOpacity>
      } />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>CL</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>Chloe Lee</Text>
            <Text style={styles.profilePhone}>010-1234-5678</Text>
            <Text style={styles.profileEmail}>chloe@email.com</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>2</Text>
            <Text style={styles.statLabel}>Organizing</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>3</Text>
            <Text style={styles.statLabel}>Member of</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>5</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>SETTINGS</Text>
        <View style={styles.menuCard}>
          {[
            { icon: 'bell-outline', label: 'Notification settings', chevron: true },
            { icon: 'credit-card-outline', label: 'Payment methods', chevron: true },
          ].map((item, i) => (
            <TouchableOpacity
              key={item.label}
              style={[styles.menuRow, i === 1 && { borderBottomWidth: 0 }]}
            >
              <MaterialCommunityIcons name={item.icon as any} size={20} color={colors.textSecondary} style={styles.menuIcon} />
              <Text style={styles.menuLabel}>{item.label}</Text>
              {item.chevron && <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textLight} />}
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[styles.menuRow, { borderBottomWidth: 0 }]}
            onPress={() => setLang(lang === 'en' ? 'ko' : 'en')}
          >
            <MaterialCommunityIcons name="web" size={20} color={colors.textSecondary} style={styles.menuIcon} />
            <Text style={styles.menuLabel}>Language</Text>
            <View style={styles.langToggle}>
              <Text style={[styles.langOption, lang === 'en' && styles.langOptionActive]}>EN</Text>
              <Text style={styles.langDivider}>·</Text>
              <Text style={[styles.langOption, lang === 'ko' && styles.langOptionActive]}>한국어</Text>
            </View>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionLabel}>SUPPORT</Text>
        <View style={styles.menuCard}>
          {[
            { icon: 'help-circle-outline', label: 'FAQ' },
            { icon: 'file-document-outline', label: 'Terms of service' },
            { icon: 'lock-outline', label: 'Privacy policy' },
          ].map((item, i) => (
            <TouchableOpacity
              key={item.label}
              style={[styles.menuRow, i === 2 && { borderBottomWidth: 0 }]}
            >
              <MaterialCommunityIcons name={item.icon as any} size={20} color={colors.textSecondary} style={styles.menuIcon} />
              <Text style={styles.menuLabel}>{item.label}</Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textLight} />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.coffeeBtn} activeOpacity={0.85}>
          <MaterialCommunityIcons name="coffee-outline" size={20} color={colors.warningText} />
          <Text style={styles.coffeeBtnText}>Buy me a coffee</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          activeOpacity={0.85}
        >
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>MoniCircle v1.0.0</Text>

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
  editText: { fontSize: 14, color: colors.primary },
  scroll: { padding: 16, gap: 16, paddingBottom: 40 },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.surface,
    borderWidth: 0.5,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: { fontSize: 18, fontWeight: '500', color: colors.primary },
  profileInfo: { flex: 1, gap: 3 },
  profileName: { fontSize: 16, fontWeight: '500', color: colors.text },
  profilePhone: { fontSize: 13, color: colors.textSecondary },
  profileEmail: { fontSize: 12, color: colors.textLight },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: colors.border,
    gap: 4,
  },
  statValue: { fontSize: 20, fontWeight: '500', color: colors.primary },
  statLabel: { fontSize: 11, color: colors.textSecondary },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: -4,
  },
  menuCard: {
    backgroundColor: colors.surface,
    borderWidth: 0.5,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.borderLight,
  },
  menuIcon: { width: 24 },
  langToggle: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  langOption: { fontSize: 13, color: colors.textLight, fontWeight: '500' },
  langOptionActive: { color: colors.primary },
  langDivider: { fontSize: 13, color: colors.textLight },
  menuLabel: { flex: 1, fontSize: 14, color: colors.text },
  menuValue: { fontSize: 13, color: colors.textSecondary },
  coffeeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.warningBg,
    borderRadius: 12,
    padding: 14,
    borderWidth: 0.5,
    borderColor: colors.warning,
  },
  coffeeBtnText: { fontSize: 14, fontWeight: '500', color: colors.warningText },
  logoutBtn: {
    backgroundColor: colors.surface,
    borderWidth: 0.5,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  logoutText: { fontSize: 14, color: colors.danger },
  version: {
    fontSize: 12,
    color: colors.textLight,
    textAlign: 'center',
  },
})
