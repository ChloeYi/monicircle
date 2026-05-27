import { useEffect } from 'react'
import { StyleSheet, View, Text } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withSequence,
  runOnJS,
  Easing,
} from 'react-native-reanimated'
import Svg, { Circle, G } from 'react-native-svg'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useRouter } from 'expo-router'
import { colors } from '@/constants/colors'

function LogoMark({ size = 72 }: { size?: number }) {
  const r = size / 2
  const dotR = size * 0.07
  const ringR = size * 0.32
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Outer ring */}
      <Circle cx={r} cy={r} r={r * 0.88} fill="rgba(255,255,255,0.15)" />
      {/* Center circle */}
      <Circle cx={r} cy={r} r={r * 0.32} fill="#fff" opacity={0.95} />
      {/* 6 dots on the ring */}
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const angle = (i / 6) * 2 * Math.PI - Math.PI / 2
        const dx = r + Math.cos(angle) * ringR
        const dy = r + Math.sin(angle) * ringR
        return <Circle key={i} cx={dx} cy={dy} r={dotR} fill="#fff" opacity={i === 0 ? 1 : 0.6} />
      })}
    </Svg>
  )
}

export default function IntroScreen() {
  const router = useRouter()

  // Animation values
  const bgOpacity   = useSharedValue(0)
  const logoScale   = useSharedValue(0.2)
  const logoOpacity = useSharedValue(0)
  const titleOpacity = useSharedValue(0)
  const titleY       = useSharedValue(16)
  const taglineOpacity = useSharedValue(0)
  const screenOpacity  = useSharedValue(1)

  async function navigateNext() {
    const onboardingDone = await AsyncStorage.getItem('onboarding_v1')
    if (onboardingDone === 'done') {
      router.replace('/(auth)/login')
    } else {
      router.replace('/onboarding')
    }
  }

  function startExit() {
    screenOpacity.value = withTiming(0, { duration: 400, easing: Easing.out(Easing.ease) }, () => {
      runOnJS(navigateNext)()
    })
  }

  useEffect(() => {
    // 1. Background fades in
    bgOpacity.value = withTiming(1, { duration: 300 })

    // 2. Logo springs in
    logoOpacity.value = withDelay(200, withTiming(1, { duration: 250 }))
    logoScale.value = withDelay(
      200,
      withSequence(
        withSpring(1.15, { damping: 8, stiffness: 120 }),
        withSpring(1.0,  { damping: 14, stiffness: 200 }),
      )
    )

    // 3. Title slides up and fades in
    titleOpacity.value = withDelay(550, withTiming(1, { duration: 350 }))
    titleY.value       = withDelay(550, withSpring(0, { damping: 16, stiffness: 140 }))

    // 4. Tagline fades in
    taglineOpacity.value = withDelay(850, withTiming(1, { duration: 400 }))

    // 5. Exit after 2s total
    const timer = setTimeout(startExit, 2200)
    return () => clearTimeout(timer)
  }, [])

  const bgStyle = useAnimatedStyle(() => ({ opacity: bgOpacity.value }))
  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }))
  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleY.value }],
  }))
  const taglineStyle = useAnimatedStyle(() => ({ opacity: taglineOpacity.value }))
  const screenStyle  = useAnimatedStyle(() => ({ opacity: screenOpacity.value }))

  return (
    <Animated.View style={[styles.container, screenStyle]}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.bg, bgStyle]} />

      <View style={styles.center}>
        {/* Logo box */}
        <Animated.View style={[styles.logoBox, logoStyle]}>
          <LogoMark size={80} />
        </Animated.View>

        {/* App name */}
        <Animated.Text style={[styles.title, titleStyle]}>
          MoniCircle
        </Animated.Text>

        {/* Tagline */}
        <Animated.Text style={[styles.tagline, taglineStyle]}>
          함께 모아, 차례로 받아요
        </Animated.Text>
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  bg: {
    backgroundColor: colors.primary,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
  },
  logoBox: {
    width: 100,
    height: 100,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.75)',
    letterSpacing: 0.3,
  },
})
