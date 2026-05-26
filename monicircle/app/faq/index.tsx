import { useState } from 'react';
import {
  StyleSheet, View, Text, ScrollView, SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { spacing, fontSize, radius, fontWeight } from '@/constants/theme';
import { isKorean } from '@/i18n';

type FAQItem = { q: string; a: string };
type FAQSection = { title: string; items: FAQItem[] };

const FAQ_KO: FAQSection[] = [
  {
    title: '계 (계 모임) 기본',
    items: [
      { q: '계가 뭔가요?', a: '계는 여러 사람이 모여 정기적으로 돈을 모아 돌아가며 받는 한국 전통 저축 방식입니다. 예를 들어 8명이 매월 50만원씩 모으면 한 명이 매달 400만원을 받고, 8개월이 지나면 모두 한 번씩 받게 됩니다.' },
      { q: '앱이 실제 돈을 처리하나요?', a: '아닙니다. 모니서클은 기록 관리 앱입니다. 납입금은 카카오페이, 토스, 계좌이체 등으로 직접 주고받고, 증빙 사진을 업로드하면 계주가 확인하고 승인합니다.' },
      { q: '한 명이 여러 계에 참여할 수 있나요?', a: '네, 동시에 여러 계에 참여하거나 직접 계주로 운영할 수 있습니다.' },
    ],
  },
  {
    title: '계주 (운영자)',
    items: [
      { q: '계주가 하는 일은 무엇인가요?', a: '계주는 계를 만들고 멤버 참여를 승인하며, 납입 순번을 확정하고, 납입 증빙을 승인/거절합니다. 그룹 설정을 관리하고 문제가 생기면 조정하는 역할입니다.' },
      { q: '순번은 어떻게 정하나요?', a: '각 멤버가 원하는 순번을 요청합니다. 같은 순번을 원하는 사람이 있으면 계주가 조정합니다. 계주가 "순번 확정" 버튼을 누르면 이후로는 변경이 불가능합니다 (계주가 잠금 해제 후 다시 설정 가능).' },
      { q: '미납자가 있으면 어떻게 되나요?', a: '납입일 다음 날 자동으로 미납 처리되며 계주와 해당 멤버에게 알림이 갑니다. 앱에서 미납으로 표시만 될 뿐, 자동 패널티는 없습니다. 계주가 직접 멤버와 소통하여 해결해야 합니다.' },
    ],
  },
  {
    title: '납입 및 증빙',
    items: [
      { q: '어떻게 납입하나요?', a: '카카오페이, 토스, 또는 계좌이체로 계주 또는 해당 회차 수령자에게 직접 송금합니다. 송금 후 앱에서 송금 화면 캡처를 업로드하면 계주가 확인합니다.' },
      { q: '납입 증빙이 거절되면?', a: '거절 사유가 표시됩니다. 올바른 금액으로 다시 납입하거나 정확한 증빙을 다시 업로드하세요.' },
      { q: '납입일이 주말이나 공휴일이면?', a: '앱은 날짜를 자동으로 이동하지 않습니다. 공휴일 전에 납입하거나 계주와 미리 협의하세요.' },
    ],
  },
  {
    title: '공동 적립금',
    items: [
      { q: '공동 적립금이 뭔가요?', a: '매 회차마다 멤버들이 추가로 소액(예: 1만원)을 모아두는 공동 자금입니다. 회식, 선물 등 그룹 공동 지출에 사용할 수 있으며, 지출은 과반수 투표로 결정됩니다.' },
      { q: '계 종료 후 남은 적립금은?', a: '계 종료 시 남은 잔액이 멤버 수로 균등 분배됩니다. 각 멤버가 받을 금액이 앱에 표시됩니다.' },
    ],
  },
  {
    title: '보안 및 개인정보',
    items: [
      { q: '내 계좌 정보가 안전한가요?', a: '모니서클은 계좌번호를 저장하지 않습니다. 납입 방법(카카오페이, 토스 등)만 선택하며, 실제 계좌 정보는 멤버 간 직접 공유됩니다.' },
      { q: '그룹을 비공개로 설정하면?', a: '초대 링크나 코드를 받은 사람만 참여를 요청할 수 있습니다. 공개 그룹 탐색에 표시되지 않습니다.' },
    ],
  },
];

const FAQ_EN: FAQSection[] = [
  {
    title: 'About 계 (Savings Circle)',
    items: [
      { q: 'What is a 계 (Gye)?', a: 'A 계 (Gye) is a traditional Korean rotating savings group. Members pool a fixed amount each cycle, and one member receives the full pot per round. Everyone receives once by the end.' },
      { q: 'Does the app handle real money?', a: 'No. MoniCircle is a record-keeping app. Members send money directly via Kakao Pay, Toss, or bank transfer, then upload a screenshot as proof. The organizer approves it.' },
      { q: 'Can I join multiple circles?', a: 'Yes, you can participate in multiple circles simultaneously or run your own as an organizer.' },
    ],
  },
  {
    title: 'Organizer (계주)',
    items: [
      { q: 'What does the organizer do?', a: 'The organizer creates the circle, approves member join requests, sets the rotation order, and approves or rejects payment proofs. They manage group settings and resolve conflicts.' },
      { q: 'How is the rotation order set?', a: 'Members request their preferred slot. If two members want the same slot, the organizer decides. Once "Lock Order" is pressed, the order is final (the organizer can unlock to readjust if needed).' },
      { q: 'What happens if someone doesn\'t pay?', a: 'The day after the due date, they\'re automatically marked overdue and both the organizer and the member receive a notification. No automatic penalty is applied — the organizer handles it directly.' },
    ],
  },
  {
    title: 'Payments & Proof',
    items: [
      { q: 'How do I pay?', a: 'Send money directly via bank transfer (or Kakao Pay/Toss for Korean users), then upload a screenshot of your payment in the app. The organizer will confirm it.' },
      { q: 'What if my proof is rejected?', a: 'You\'ll see a rejection reason. Pay the correct amount and re-upload your proof.' },
      { q: 'What if the due date falls on a weekend?', a: 'The app doesn\'t auto-adjust dates. Pay before the holiday or coordinate with your organizer in advance.' },
    ],
  },
  {
    title: 'Shared Fund',
    items: [
      { q: 'What is the shared fund?', a: 'An optional extra contribution per member each round (e.g. ₩10,000) pooled for group expenses like meals or gifts. Spending requires majority vote approval.' },
      { q: 'What happens to leftover funds at the end?', a: 'Remaining balance is split equally among all members. Each member\'s share is shown in the app.' },
    ],
  },
];

export default function FAQScreen() {
  const router = useRouter();
  const faq = isKorean() ? FAQ_KO : FAQ_EN;
  const [openItem, setOpenItem] = useState<string | null>(null);

  function toggle(key: string) {
    setOpenItem((prev) => (prev === key ? null : key));
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={20} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>자주 묻는 질문</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {faq.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.items.map((item, i) => {
              const key = `${section.title}-${i}`;
              const isOpen = openItem === key;
              return (
                <TouchableOpacity
                  key={key}
                  style={[styles.item, isOpen && styles.itemOpen]}
                  onPress={() => toggle(key)}
                  activeOpacity={0.8}
                >
                  <View style={styles.itemHeader}>
                    <Text style={styles.question}>{item.q}</Text>
                    <Text style={[styles.chevron, isOpen && styles.chevronOpen]}>›</Text>
                  </View>
                  {isOpen && (
                    <Text style={styles.answer}>{item.a}</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {isKorean()
              ? '더 궁금한 점은 프로필 → 설정에서 문의하세요.'
              : 'For further questions, contact us via Profile → Settings.'}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  title: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl },
  section: { gap: spacing.sm },
  sectionTitle: {
    fontSize: fontSize.xs, fontWeight: fontWeight.bold, color: colors.primary,
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.xs,
  },
  item: {
    backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md,
    borderWidth: 1, borderColor: colors.border,
  },
  itemOpen: { borderColor: colors.primary + '40', backgroundColor: colors.primary + '04' },
  itemHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  question: { flex: 1, fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.text, lineHeight: 20 },
  chevron: { fontSize: 22, color: colors.textLight, transform: [{ rotate: '0deg' }] },
  chevronOpen: { color: colors.primary, transform: [{ rotate: '90deg' }] },
  answer: {
    fontSize: fontSize.sm, color: colors.textSecondary, lineHeight: 20,
    marginTop: spacing.sm, paddingTop: spacing.sm,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  footer: { alignItems: 'center', paddingVertical: spacing.lg },
  footerText: { fontSize: fontSize.xs, color: colors.textLight, textAlign: 'center' },
});
