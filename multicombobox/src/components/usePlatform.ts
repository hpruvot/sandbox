import { useEffect, useState } from 'react'

const MOBILE_SCREEN_WIDTH = 700

export const usePlatform = () => {
  const [isOnSmallScreen, setIsOnSmallScreen] = useState(
    () => typeof window !== 'undefined' && window.innerWidth <= MOBILE_SCREEN_WIDTH,
  )

  useEffect(() => {
    const handler = () => setIsOnSmallScreen(window.innerWidth <= MOBILE_SCREEN_WIDTH)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  return { isOnSmallScreen }
}
