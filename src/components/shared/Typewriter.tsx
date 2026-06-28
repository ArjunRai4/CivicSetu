import { useEffect, useRef, useState } from 'react'

// Reveals text progressively for the "AI reasoning streams in" effect (EC2).
export function Typewriter({
  text,
  speed = 14,
  className = '',
  onDone,
}: {
  text: string
  speed?: number
  className?: string
  onDone?: () => void
}) {
  const [count, setCount] = useState(0)
  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone

  useEffect(() => {
    setCount(0)
    if (!text) return
    let i = 0
    const id = setInterval(() => {
      i += Math.max(1, Math.round(text.length / 120))
      if (i >= text.length) {
        setCount(text.length)
        clearInterval(id)
        onDoneRef.current?.()
      } else {
        setCount(i)
      }
    }, speed)
    return () => clearInterval(id)
  }, [text, speed])

  const done = count >= text.length
  return (
    <span className={`${className} ${done ? '' : 'blink-caret'}`}>
      {text.slice(0, count)}
    </span>
  )
}
