export const createLongPressController = ({
  delay = 2000,
  onClick,
  onLongPress,
  setTimer = setTimeout,
  clearTimer = clearTimeout,
}) => {
  let timer = null
  let longPressed = false

  const cancelTimer = () => {
    if (timer !== null) clearTimer(timer)
    timer = null
  }

  return {
    start() {
      cancelTimer()
      longPressed = false
      timer = setTimer(() => {
        timer = null
        longPressed = true
        onLongPress?.()
      }, delay)
    },
    end() {
      const shouldClick = timer !== null && !longPressed
      cancelTimer()
      if (shouldClick) onClick?.()
    },
    cancel() {
      cancelTimer()
      longPressed = false
    },
  }
}
