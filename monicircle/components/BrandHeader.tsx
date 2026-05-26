import { View, Text, StyleSheet } from 'react-native'
import { colors } from '@/constants/colors'

export default function BrandHeader({ right }: { right?: React.ReactNode }) {
  return (
    <View style={styles.topbar}>
      <View style={styles.brand}>
        <View style={styles.logoBox}>
          <View style={styles.logoCircleOuter}>
            <View style={styles.logoCircleInner} />
          </View>
          {[0,1,2,3,4,5].map((i) => {
            const angle = (i * 60 - 90) * (Math.PI / 180)
            return (
              <View key={i} style={[styles.logoDot, {
                left: 14 + 8 * Math.cos(angle) - 2,
                top: 14 + 8 * Math.sin(angle) - 2,
              }]} />
            )
          })}
        </View>
        <Text style={styles.title}>MoniCircle</Text>
      </View>
      {right && <View>{right}</View>}
    </View>
  )
}

const styles = StyleSheet.create({
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoBox: {
    width: 28,
    height: 28,
    backgroundColor: colors.primary,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoCircleOuter: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoCircleInner: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#fff',
  },
  logoDot: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.primary,
    letterSpacing: -0.3,
  },
})
