import { useCallback, useEffect, useRef, useState } from 'react'

// How long the chat can sit untouched before it auto-blurs. Tune this —
// 15s is aggressive on purpose; better to have someone re-click a chat
// they were still reading than leave it exposed for a minute.
const IDLE_TIMEOUT_MS = 15000

/**
 * Drives shoulder-surf protection for the chat pane.
 *
 * The pane blurs whenever ANY of these are true:
 *  - the browser tab/window isn't focused (alt-tabbed, switched apps)
 *  - the user has been inactive for IDLE_TIMEOUT_MS (walked away without switching tabs)
 *  - the user manually triggered a quick-blur (Cmd/Ctrl+B, or the eye icon)
 *
 * It un-blurs only when the user deliberately interacts with the pane
 * again (click/tap) — never automatically, so a person walking back to
 * their desk doesn't get their screen un-blurred just by the tab
 * regaining focus behind them.
 */
export function usePrivacyBlur() {
  const [windowFocused, setWindowFocused] = useState(document.hasFocus())
  const [idle, setIdle] = useState(false)
  const [manuallyBlurred, setManuallyBlurred] = useState(false)
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const resetIdleTimer = useCallback(() => {
    setIdle(false)
    if (idleTimer.current) clearTimeout(idleTimer.current)
    idleTimer.current = setTimeout(() => setIdle(true), IDLE_TIMEOUT_MS)
  }, [])

  // Window/tab focus tracking. visibilitychange catches tab-switching,
  // focus/blur catches switching to a different application entirely.
  useEffect(() => {
    const handleFocus = () => setWindowFocused(true)
    const handleBlur = () => setWindowFocused(false)
    const handleVisibility = () => setWindowFocused(document.visibilityState === 'visible')

    window.addEventListener('focus', handleFocus)
    window.addEventListener('blur', handleBlur)
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('blur', handleBlur)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [])

  // Idle detection. touchstart is in here so this also works once the
  // app extends to mobile — mousemove alone would never fire on touch.
  useEffect(() => {
    const activityEvents = ['mousemove', 'keydown', 'click', 'touchstart', 'scroll']
    activityEvents.forEach((event) => window.addEventListener(event, resetIdleTimer))
    resetIdleTimer()

    return () => {
      activityEvents.forEach((event) => window.removeEventListener(event, resetIdleTimer))
      if (idleTimer.current) clearTimeout(idleTimer.current)
    }
  }, [resetIdleTimer])

  // Manual "someone's walking up right now" shortcut.
  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'b' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        setManuallyBlurred(true)
      }
    }
    window.addEventListener('keydown', handleKeydown)
    return () => window.removeEventListener('keydown', handleKeydown)
  }, [])

  // Deliberate reveal — call this from a click/tap on the blur overlay.
  const reveal = useCallback(() => {
    setManuallyBlurred(false)
    resetIdleTimer()
  }, [resetIdleTimer])

  // Wire this to a button/icon for the manual quick-blur trigger.
  const quickBlur = useCallback(() => setManuallyBlurred(true), [])

  const isBlurred = !windowFocused || idle || manuallyBlurred

  return { isBlurred, reveal, quickBlur }
}