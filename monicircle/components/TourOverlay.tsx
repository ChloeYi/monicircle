import { useEffect, useState, useCallback } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Modal, Dimensions } from 'react-native'
import Svg, { Defs, Mask, Rect as SvgRect } from 'react-native-svg'
import { useTour } from '@/context/tour'
import { colors } from '@/constants/colors'

const { width: W, height: H } = Dimensions.get('window')
const PAD = 8
const TOOLTIP_W = 280

type HighlightRect = { x: number; y: number; width: number; height: number }

export default function TourOverlay() {
  const { isActive, currentStep, steps, nextStep, skipTour } = useTour()
  const [rect, setRect] = useState<HighlightRect | null>(null)
  const isLast = currentStep === steps.length - 1

  const measureStep = useCallback(() => {
    const step = steps[currentStep]
    if (!step?.ref?.current) return
    step.ref.current.measureInWindow((x, y, width, height) => {
      setRect({ x: x - PAD, y: y - PAD, width: width + PAD * 2, height: height + PAD * 2 })
    })
  }, [currentStep, steps])

  useEffect(() => {
    if (!isActive) { setRect(null); return }
    const timer = setTimeout(measureStep, 80)
    return () => clearTimeout(timer)
  }, [isActive, currentStep, measureStep])

  if (!isActive || !rect) return null

  const step = steps[currentStep]
  const placement = step?.placement ?? (rect.y > H / 2 ? 'top' : 'bottom')
  const tooltipTop = placement === 'bottom'
    ? rect.y + rect.height + 16
    : rect.y - 16 - 120
  const tooltipLeft = Math.min(Math.max((W - TOOLTIP_W) / 2, 16), W - TOOLTIP_W - 16)

  return (
    <Modal transparent animationType="fade" visible statusBarTranslucent>
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        {/* SVG overlay with cutout */}
        <Svg width={W} height={H} style={StyleSheet.absoluteFill}>
          <Defs>
            <Mask id="hole">
              <SvgRect x={0} y={0} width={W} height={H} fill="white" />
              <SvgRect
                x={rect.x}
                y={rect.y}
                width={rect.width}
                height={rect.height}
                rx={12}
                ry={12}
                fill="black"
              />
            </Mask>
          </Defs>
          <SvgRect x={0} y={0} width={W} height={H} fill="rgba(0,0,0,0.72)" mask="url(#hole)" />
        </Svg>

        {/* Tooltip */}
        <View style={[styles.tooltip, { top: tooltipTop, left: tooltipLeft, width: TOOLTIP_W }]}>
          <View style={styles.stepRow}>
            <Text style={styles.stepCount}>{currentStep + 1} / {steps.length}</Text>
            <TouchableOpacity onPress={skipTour}>
              <Text style={styles.skipText}>Skip tour</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.title}>{step?.title}</Text>
          <Text style={styles.body}>{step?.body}</Text>
          <TouchableOpacity style={styles.nextBtn} onPress={nextStep} activeOpacity={0.85}>
            <Text style={styles.nextBtnText}>{isLast ? 'Done' : 'Next →'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  tooltip: {
    position: 'absolute',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
    gap: 6,
  },
  stepRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  stepCount: { fontSize: 11, color: colors.textLight, fontWeight: '500' },
  skipText: { fontSize: 11, color: colors.textSecondary },
  title: { fontSize: 15, fontWeight: '600', color: colors.text },
  body: { fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
  nextBtn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    padding: 11,
    alignItems: 'center',
    marginTop: 4,
  },
  nextBtnText: { fontSize: 13, fontWeight: '600', color: '#fff' },
})
