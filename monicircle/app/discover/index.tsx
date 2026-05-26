import { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet, View, Text, FlatList, SafeAreaView,
  TouchableOpacity, ActivityIndicator, TextInput, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getPublicGroups, type GroupCategory, type GroupCycle } from '@/firebase/groups';
import { colors } from '@/constants/colors';
import { spacing, fontSize, radius, fontWeight } from '@/constants/theme';
import { t } from '@/i18n';

type FilterState = {
  category: GroupCategory | 'all';
  cycle: GroupCycle | 'all';
  maxAmount: number | null;
};

const CATEGORIES: (GroupCategory | 'all')[] = ['all', 'friends', 'family', 'church', 'work', 'study', 'other'];
const CATEGORY_ICON: Record<string, string> = {
  all: 'magnify',
  friends: 'account-group-outline',
  family: 'home-heart-outline',
  church: 'church',
  work: 'briefcase-outline',
  study: 'book-outline',
  other: 'circle-outline',
};

export default function DiscoverScreen() {
  const router = useRouter();
  const [groups, setGroups] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<FilterState>({ category: 'all', cycle: 'all', maxAmount: null });

  async function load() {
    const data = await getPublicGroups();
    setGroups(data as any[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    let result = groups;
    if (search.trim()) {
      result = result.filter((g) => g.title?.toLowerCase().includes(search.toLowerCase()));
    }
    if (filters.category !== 'all') {
      result = result.filter((g) => g.category === filters.category);
    }
    if (filters.cycle !== 'all') {
      result = result.filter((g) => g.cycle === filters.cycle);
    }
    if (filters.maxAmount) {
      result = result.filter((g) => g.contributionAmount <= filters.maxAmount!);
    }
    setFiltered(result);
  }, [groups, search, filters]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, []);

  const STATUS_COLOR: Record<string, string> = {
    forming: colors.warning,
    active: colors.success,
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={20} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>{t('home.publicGroups')}</Text>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="계 이름 검색..."
          placeholderTextColor={colors.textLight}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Category filter chips */}
      <FlatList
        horizontal
        data={CATEGORIES}
        keyExtractor={(item) => item}
        contentContainerStyle={styles.chipRow}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.chip, filters.category === item && styles.chipActive]}
            onPress={() => setFilters((f) => ({ ...f, category: item }))}
          >
            <MaterialCommunityIcons
              name={CATEGORY_ICON[item] as any}
              size={16}
              color={filters.category === item ? colors.primary : colors.textSecondary}
            />
            <Text style={[styles.chipText, filters.category === item && styles.chipTextActive]}>
              {item === 'all' ? '전체' : t(`categories.${item}`)}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Cycle + amount filters */}
      <View style={styles.filterRow}>
        {(['all', 'monthly', 'weekly'] as const).map((c) => (
          <TouchableOpacity
            key={c}
            style={[styles.filterTab, filters.cycle === c && styles.filterTabActive]}
            onPress={() => setFilters((f) => ({ ...f, cycle: c }))}
          >
            <Text style={[styles.filterTabText, filters.cycle === c && styles.filterTabTextActive]}>
              {c === 'all' ? '전체' : c === 'monthly' ? t('create.monthly') : t('create.weekly')}
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={[styles.filterTab, filters.maxAmount === 500000 && styles.filterTabActive]}
          onPress={() => setFilters((f) => ({ ...f, maxAmount: f.maxAmount ? null : 500000 }))}
        >
          <Text style={[styles.filterTabText, !!filters.maxAmount && styles.filterTabTextActive]}>
            50만원 이하
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={colors.primary} size="large" /></View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialCommunityIcons name="magnify" size={48} color={colors.textLight} />
              <Text style={styles.emptyText}>조건에 맞는 공개 계 모임이 없습니다</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push(`/group/join/${item.id}`)}
              activeOpacity={0.85}
            >
              <View style={styles.cardTop}>
                <View style={styles.cardIconBox}>
                  <MaterialCommunityIcons name={(CATEGORY_ICON[item.category] ?? 'circle-outline') as any} size={20} color={colors.primary} />
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.cardMeta}>
                    {t(`categories.${item.category}`)} · {t(`create.${item.cycle}`)}
                  </Text>
                </View>
                <View style={[styles.statusDot, { backgroundColor: STATUS_COLOR[item.status] ?? colors.textLight }]} />
              </View>

              <View style={styles.cardStats}>
                <View style={styles.cardStat}>
                  <Text style={styles.cardStatValue}>₩{item.contributionAmount?.toLocaleString()}</Text>
                  <Text style={styles.cardStatLabel}>납입금{t('group.contribution')}</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.cardStat}>
                  <Text style={styles.cardStatValue}>{item.totalMembers}명</Text>
                  <Text style={styles.cardStatLabel}>총 인원</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.cardStat}>
                  <Text style={styles.cardStatValue}>
                    {item.paymentDay}일
                  </Text>
                  <Text style={styles.cardStatLabel}>납입일</Text>
                </View>
              </View>

              <View style={styles.joinRow}>
                <Text style={styles.joinStatus}>{t(`group.${item.status}`)}</Text>
                <Text style={styles.joinBtn}>참여 요청 →</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  title: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text },
  searchRow: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  searchInput: {
    backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1,
    borderColor: colors.border, paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2,
    fontSize: fontSize.md, color: colors.text,
  },
  chipRow: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.sm },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: radius.full,
    paddingHorizontal: spacing.md, paddingVertical: 6,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: fontSize.xs, color: colors.textSecondary },
  chipTextActive: { color: colors.surface, fontWeight: fontWeight.semibold },
  filterRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm,
    paddingHorizontal: spacing.lg, paddingBottom: spacing.sm,
  },
  filterTab: {
    borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: 5,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
  },
  filterTabActive: { backgroundColor: colors.primaryLight + '20', borderColor: colors.primaryLight },
  filterTabText: { fontSize: fontSize.xs, color: colors.textSecondary },
  filterTabTextActive: { color: colors.primary, fontWeight: fontWeight.semibold },
  list: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  empty: { paddingTop: spacing.xxl * 2, alignItems: 'center', gap: spacing.md },
  emptyText: { fontSize: fontSize.md, color: colors.textSecondary, textAlign: 'center' },
  card: {
    backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.md,
    gap: spacing.md, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  cardIconBox: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: colors.primaryBg, alignItems: 'center', justifyContent: 'center',
  },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.text },
  cardMeta: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  cardStats: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.background, borderRadius: radius.md, padding: spacing.md },
  cardStat: { flex: 1, alignItems: 'center' },
  cardStatValue: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: colors.text },
  cardStatLabel: { fontSize: 10, color: colors.textSecondary, marginTop: 2 },
  divider: { width: 1, height: 28, backgroundColor: colors.border },
  joinRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  joinStatus: { fontSize: fontSize.xs, color: colors.textSecondary },
  joinBtn: { fontSize: fontSize.sm, color: colors.primary, fontWeight: fontWeight.semibold },
});
