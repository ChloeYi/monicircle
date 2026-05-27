import AsyncStorage from '@react-native-async-storage/async-storage'
import { createContext, useContext, useState, useCallback, type PropsWithChildren, type RefObject } from 'react'
import { type View } from 'react-native'

export type TourStep = {
  ref: RefObject<View | null>
  title: string
  body: string
  placement?: 'top' | 'bottom'
}

type TourContextValue = {
  isActive: boolean
  currentStep: number
  steps: TourStep[]
  startTour: (steps: TourStep[]) => void
  nextStep: () => void
  skipTour: () => void
}

const TourContext = createContext<TourContextValue | null>(null)

const STORAGE_KEY = 'tour_completed_v2'

export function TourProvider({ children }: PropsWithChildren) {
  const [isActive, setIsActive] = useState(false)
  const [steps, setSteps] = useState<TourStep[]>([])
  const [currentStep, setCurrentStep] = useState(0)

  const startTour = useCallback(async (s: TourStep[]) => {
    const done = await AsyncStorage.getItem(STORAGE_KEY)
    if (done) return
    setSteps(s)
    setCurrentStep(0)
    setIsActive(true)
  }, [])

  const finishTour = useCallback(async () => {
    await AsyncStorage.setItem(STORAGE_KEY, '1')
    setIsActive(false)
    setSteps([])
    setCurrentStep(0)
  }, [])

  const nextStep = useCallback(() => {
    setCurrentStep((prev) => {
      if (prev + 1 >= steps.length) {
        finishTour()
        return prev
      }
      return prev + 1
    })
  }, [steps.length, finishTour])

  const skipTour = useCallback(() => {
    finishTour()
  }, [finishTour])

  return (
    <TourContext.Provider value={{ isActive, currentStep, steps, startTour, nextStep, skipTour }}>
      {children}
    </TourContext.Provider>
  )
}

export function useTour() {
  const ctx = useContext(TourContext)
  if (!ctx) throw new Error('useTour must be used inside <TourProvider>')
  return ctx
}
