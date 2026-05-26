import React, { useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native'
import * as WebBrowser from 'expo-web-browser'
import * as Google from 'expo-auth-session/providers/google'
import { makeRedirectUri } from 'expo-auth-session'
import { Platform } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useAuth } from '@/context/auth'
import { colors } from '../../constants/colors'

WebBrowser.maybeCompleteAuthSession()

const { height } = Dimensions.get('window')

export default function LoginScreen() {
  const { signInWithGoogle, signInWithGoogleWeb, state } = useAuth()
  const isLoading = state.status === 'loading'

  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    redirectUri: makeRedirectUri({ scheme: 'monicircle' }),
  })

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params
      signInWithGoogle(id_token).catch((e: any) =>
        Alert.alert('Sign in failed', e.message)
      )
    } else if (response?.type === 'error') {
      Alert.alert('Sign in failed', response.error?.message ?? 'Unknown error')
    }
  }, [response])

  const handleGoogleLogin = async () => {
    if (Platform.OS === 'web') {
      signInWithGoogleWeb().catch((e: any) =>
        Alert.alert('Sign in failed', e.message)
      )
    } else {
      await promptAsync()
    }
  }

  const handleAppleLogin = async () => {
    // TODO: implement Apple Sign In
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>

        <View style={styles.logoSection}>
          <View style={styles.logoBox}>
            <View style={styles.logoCircleOuter}>
              <View style={styles.logoCircleInner} />
            </View>
            {[0, 1, 2, 3, 4, 5].map((i) => {
              const angle = (i * 60 - 90) * (Math.PI / 180)
              const r = 20
              const cx = 36
              const cy = 36
              return (
                <View
                  key={i}
                  style={[
                    styles.logoDot,
                    {
                      left: cx + r * Math.cos(angle) - 4,
                      top: cy + r * Math.sin(angle) - 4,
                    },
                  ]}
                />
              )
            })}
          </View>
          <Text style={styles.appName}>MoniCircle</Text>
          <Text style={styles.tagline}>Save together, grow together</Text>
        </View>

        <View style={styles.illustrationSection}>
          <View style={styles.circleWrap}>
            {['KM', 'LC', 'JH', 'PJ', 'OH', 'SY'].map((initials, i) => {
              const angle = (i * 60 - 90) * (Math.PI / 180)
              const radius = 80
              const x = Math.cos(angle) * radius
              const y = Math.sin(angle) * radius
              const isActive = i < 2
              return (
                <View
                  key={initials}
                  style={[
                    styles.memberDot,
                    {
                      transform: [{ translateX: x }, { translateY: y }],
                      backgroundColor: isActive ? colors.primary : colors.primaryBg,
                      borderColor: isActive ? colors.primary : colors.primaryLighter,
                    },
                  ]}
                >
                  <Text style={[styles.memberInitials, { color: isActive ? '#fff' : colors.primaryLight }]}>
                    {initials}
                  </Text>
                </View>
              )
            })}
            <View style={styles.circlePotBox}>
              <Text style={styles.circlePotAmount}>₩4,000,000</Text>
              <Text style={styles.circlePotLabel}>this round</Text>
            </View>
          </View>
        </View>

        <View style={styles.buttonSection}>
          <TouchableOpacity style={[styles.googleBtn, (!request || isLoading) && { opacity: 0.6 }]} onPress={handleGoogleLogin} disabled={!request || isLoading} activeOpacity={0.85}>
            <View style={styles.googleIcon}>
              <Text style={styles.googleIconText}>G</Text>
            </View>
            <Text style={styles.googleBtnText}>Continue with Google</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.appleBtn} onPress={handleAppleLogin} activeOpacity={0.85}>
            <MaterialCommunityIcons name="apple" size={20} color="#fff" />
            <Text style={styles.appleBtnText}>Continue with Apple</Text>
          </TouchableOpacity>

          <Text style={styles.terms}>
            By continuing you agree to our{' '}
            <Text style={styles.termsLink}>Terms of Service</Text>
            {' '}and{' '}
            <Text style={styles.termsLink}>Privacy Policy</Text>
          </Text>
        </View>

      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 30,
    overflow: 'hidden',
  },
  inner: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingTop: 40,
    paddingBottom: 32,
  },
  logoSection: {
    alignItems: 'center',
  },
  logoBox: {
    width: 72,
    height: 72,
    backgroundColor: colors.primary,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoCircleOuter: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoCircleInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#fff',
  },
  logoDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primaryLighter,
  },
  appName: {
    fontSize: 28,
    fontWeight: '500',
    color: colors.primary,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  illustrationSection: {
    alignItems: 'center',
    justifyContent: 'center',
    height: height * 0.28,
  },
  circleWrap: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 80,
    borderWidth: 2,
    borderColor: colors.primaryLighter,
    backgroundColor: colors.primaryBg,
  },
  memberDot: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberInitials: {
    fontSize: 10,
    fontWeight: '500',
  },
  circlePotBox: {
    alignItems: 'center',
  },
  circlePotAmount: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.primary,
  },
  circlePotLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  buttonSection: {
    gap: 12,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 0.5,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  googleIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4285F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIconText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  googleBtnText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  appleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.dark,
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  appleBtnText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
  },
  terms: {
    fontSize: 11,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 4,
  },
  termsLink: {
    color: colors.primary,
  },
})
