import React, { useRef, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  SafeAreaView,
} from 'react-native'
import Svg, {
  Circle, Rect, Path, G, Line, Defs, LinearGradient, Stop,
} from 'react-native-svg'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useRouter } from 'expo-router'
import { colors } from '@/constants/colors'

const { width, height } = Dimensions.get('window')

const SLIDES = [
  {
    key: 'what',
    badge: '계(稧)란?',
    headline: '함께 모아,\n차례로 받아요',
    body: '친구·가족·동료와 매달 일정 금액을 넣고\n순번에 따라 한 사람씩 목돈을 받아가는\n신뢰 기반 저축 모임이에요.',
  },
  {
    key: 'how',
    badge: '어떻게 작동하나요?',
    headline: '매달 납입,\n내 순번에 목돈을',
    body: '모든 멤버가 회차마다 납입하면\n그 회차의 수령자가 전액을 가져가요.\n마지막 사람까지 모두 받을 때까지 반복해요.',
  },
  {
    key: 'manage',
    badge: '모니서클로 관리하기',
    headline: '앱 하나로\n모든 것을 투명하게',
    body: '납입 증빙 업로드, 지출 투표, 순번 확인,\n알림까지 — 계주와 멤버 모두\n모니서클 하나로 쉽게 관리해요.',
  },
]

// ── Per-slide illustrations ───────────────────────────────────────────────────

function IllustrationWhat() {
  return (
    <Svg width={220} height={220} viewBox="0 0 220 220">
      <Defs>
        <LinearGradient id="bg0" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#E0F5F4" />
          <Stop offset="1" stopColor="#B2DFDB" />
        </LinearGradient>
      </Defs>
      <Circle cx={110} cy={110} r={100} fill="url(#bg0)" />
      {/* Center circle — the pot */}
      <Circle cx={110} cy={110} r={28} fill="#0D7377" />
      <Circle cx={110} cy={110} r={22} fill="#1A9E9E" />
      {/* ₩ symbol */}
      <Path d="M102 107 L110 120 L118 107" stroke="#fff" strokeWidth={2.5} fill="none" strokeLinecap="round" />
      <Line x1="104" y1="112" x2="116" y2="112" stroke="#fff" strokeWidth={2} />
      <Line x1="104" y1="116" x2="116" y2="116" stroke="#fff" strokeWidth={2} />
      {/* Member avatars around the ring */}
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const angle = (i / 6) * 2 * Math.PI - Math.PI / 2
        const rx = 110 + Math.cos(angle) * 68
        const ry = 110 + Math.sin(angle) * 68
        const isActive = i === 0
        return (
          <G key={i}>
            <Circle cx={rx} cy={ry} r={isActive ? 22 : 18} fill={isActive ? '#0D7377' : '#fff'} stroke={isActive ? '#085041' : '#B2DFDB'} strokeWidth={2} />
            <Circle cx={rx} cy={ry - 5} r={5} fill={isActive ? '#fff' : '#B2DFDB'} />
            <Path
              d={`M${rx - 8} ${ry + 10} Q${rx} ${ry + 2} ${rx + 8} ${ry + 10}`}
              stroke={isActive ? '#fff' : '#B2DFDB'}
              strokeWidth={2}
              fill="none"
            />
          </G>
        )
      })}
      {/* Connecting dots to center */}
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const angle = (i / 6) * 2 * Math.PI - Math.PI / 2
        const rx = 110 + Math.cos(angle) * 44
        const ry = 110 + Math.sin(angle) * 44
        return <Circle key={i} cx={rx} cy={ry} r={3} fill={i === 0 ? '#0D7377' : '#90CAF9'} opacity={0.6} />
      })}
    </Svg>
  )
}

function IllustrationHow() {
  return (
    <Svg width={220} height={220} viewBox="0 0 220 220">
      <Defs>
        <LinearGradient id="bg1" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#E8F5E9" />
          <Stop offset="1" stopColor="#C8E6C9" />
        </LinearGradient>
      </Defs>
      <Circle cx={110} cy={110} r={100} fill="url(#bg1)" />
      {/* Calendar card */}
      <Rect x={55} y={55} width={110} height={110} rx={14} fill="#fff" stroke="#A5D6A7" strokeWidth={2} />
      <Rect x={55} y={55} width={110} height={30} rx={14} fill="#2E7D32" />
      <Rect x={55} y={70} width={110} height={15} fill="#2E7D32" />
      {/* Calendar header text */}
      <Rect x={75} y={63} width={70} height={8} rx={4} fill="#81C784" />
      {/* Grid */}
      {[0, 1, 2, 3, 4].map((row) =>
        [0, 1, 2, 3, 4, 5, 6].map((col) => {
          const cx = 68 + col * 14
          const cy = 102 + row * 14
          const isHighlight = row === 1 && col === 3
          const isPast = row === 0 || (row === 1 && col < 3)
          return (
            <Circle
              key={`${row}-${col}`}
              cx={cx} cy={cy} r={5}
              fill={isHighlight ? '#2E7D32' : isPast ? '#E8F5E9' : '#F5F5F5'}
              stroke={isHighlight ? '#1B5E20' : 'none'}
              strokeWidth={1}
            />
          )
        })
      )}
      {/* Checkmark on highlighted day */}
      <Path d="M105 98 L108 102 L115 94" stroke="#fff" strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {/* Money stack on right */}
      {[0, 1, 2].map((i) => (
        <Rect key={i} x={148 + i * 3} y={148 - i * 5} width={32} height={20} rx={4} fill={['#A5D6A7', '#81C784', '#4CAF50'][i]} opacity={0.9} />
      ))}
    </Svg>
  )
}

function IllustrationManage() {
  return (
    <Svg width={220} height={220} viewBox="0 0 220 220">
      <Defs>
        <LinearGradient id="bg2" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#EDE7F6" />
          <Stop offset="1" stopColor="#D1C4E9" />
        </LinearGradient>
      </Defs>
      <Circle cx={110} cy={110} r={100} fill="url(#bg2)" />
      {/* Phone outline */}
      <Rect x={70} y={45} width={80} height={130} rx={14} fill="#fff" stroke="#B39DDB" strokeWidth={2} />
      <Circle cx={110} cy={58} r={4} fill="#D1C4E9" />
      <Rect x={100} y={56} width={20} height={4} rx={2} fill="#D1C4E9" />
      {/* Screen content rows */}
      {/* Row 1 — proof uploaded */}
      <Rect x={80} y={72} width={60} height={22} rx={6} fill="#E8F5E9" />
      <Circle cx={91} cy={83} r={7} fill="#4CAF50" />
      <Path d="M88 83 L90 86 L95 80" stroke="#fff" strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Rect x={102} y={78} width={30} height={4} rx={2} fill="#A5D6A7" />
      <Rect x={102} y={85} width={20} height={3} rx={1.5} fill="#C8E6C9" />
      {/* Row 2 — vote */}
      <Rect x={80} y={100} width={60} height={22} rx={6} fill="#FFF3E0" />
      <Circle cx={91} cy={111} r={7} fill="#FF9800" />
      <Path d="M88 112 L91 108 L94 112 L91 115 Z" fill="#fff" />
      <Rect x={102} y={106} width={28} height={4} rx={2} fill="#FFCC80" />
      <Rect x={102} y={113} width={18} height={3} rx={1.5} fill="#FFE0B2" />
      {/* Row 3 — notification bell */}
      <Rect x={80} y={128} width={60} height={22} rx={6} fill="#EDE7F6" />
      <Circle cx={91} cy={139} r={7} fill="#7E57C2" />
      <Path d="M91 134 Q96 136 95 141 L87 141 Q86 136 91 134 Z" fill="#fff" />
      <Circle cx={91} cy={143} r={2} fill="#fff" />
      <Rect x={102} y={134} width={25} height={4} rx={2} fill="#CE93D8" />
      <Rect x={102} y={141} width={15} height={3} rx={1.5} fill="#E1BEE7" />
      {/* Shield badge */}
      <Path d="M155 60 Q165 60 165 70 L165 80 Q165 90 155 95 Q145 90 145 80 L145 70 Q145 60 155 60 Z" fill="#7E57C2" />
      <Path d="M150 77 L153 81 L161 73" stroke="#fff" strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

const ILLUSTRATIONS = [IllustrationWhat, IllustrationHow, IllustrationManage]
const ACCENT = [colors.primary, '#2E7D32', '#5E35B1']
const ACCENT_BG = ['#E0F5F4', '#E8F5E9', '#EDE7F6']

// ── Slide component ───────────────────────────────────────────────────────────

function Slide({ item, index }: { item: typeof SLIDES[0]; index: number }) {
  const Illustration = ILLUSTRATIONS[index]
  return (
    <View style={[styles.slide, { width }]}>
      <View style={[styles.illuWrap, { backgroundColor: ACCENT_BG[index] }]}>
        <Illustration />
      </View>
      <View style={[styles.badgeWrap, { backgroundColor: ACCENT[index] + '18' }]}>
        <Text style={[styles.badge, { color: ACCENT[index] }]}>{item.badge}</Text>
      </View>
      <Text style={styles.headline}>{item.headline}</Text>
      <Text style={styles.body}>{item.body}</Text>
    </View>
  )
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function OnboardingScreen() {
  const router = useRouter()
  const listRef = useRef<FlatList>(null)
  const [current, setCurrent] = useState(0)

  async function finish() {
    await AsyncStorage.setItem('onboarding_v1', 'done')
    router.replace('/(auth)/login')
  }

  function next() {
    if (current < SLIDES.length - 1) {
      listRef.current?.scrollToIndex({ index: current + 1, animated: true })
      // setCurrent updated by onMomentumScrollEnd
    } else {
      finish()
    }
  }

  const isLast = current === SLIDES.length - 1

  return (
    <SafeAreaView style={styles.container}>
      {/* Skip */}
      <View style={styles.topBar}>
        <View style={{ flex: 1 }} />
        {!isLast && (
          <TouchableOpacity onPress={finish} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={styles.skipText}>건너뛰기</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Slides */}
      <FlatList
        ref={listRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.key}
        renderItem={({ item, index }) => <Slide item={item} index={index} />}
        getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width)
          setCurrent(index)
        }}
      />

      {/* Dots */}
      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i === current
                ? [styles.dotActive, { backgroundColor: ACCENT[current] }]
                : styles.dotInactive,
            ]}
          />
        ))}
      </View>

      {/* CTA */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: ACCENT[current] }]}
          onPress={next}
          activeOpacity={0.85}
        >
          <Text style={styles.btnText}>
            {isLast ? '시작하기 →' : '다음'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 4,
    minHeight: 44,
  },
  skipText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  slide: {
    paddingHorizontal: 32,
    paddingTop: 16,
    alignItems: 'center',
    gap: 20,
  },
  illuWrap: {
    width: 220,
    height: 220,
    borderRadius: 110,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  badgeWrap: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
  },
  badge: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  headline: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    lineHeight: 38,
  },
  body: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 20,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 24,
  },
  dotInactive: {
    width: 8,
    backgroundColor: colors.borderLight,
  },
  bottomBar: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  btn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  btnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    letterSpacing: 0.3,
  },
})
