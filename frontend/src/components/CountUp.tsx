import { useEffect, useRef, useState } from 'react'

interface Props {
  value: number
  duration?: number
  prefix?: string
  suffix?: string
  decimals?: number
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

export default function CountUp({ value, duration = 1400, prefix = '', suffix = '', decimals = 0 }: Props) {
  const [display, setDisplay] = useState(0)
  const rafRef = useRef<number>()

  useEffect(() => {
    const start = performance.now()
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      setDisplay(value * easeOutExpo(progress))
      if (progress < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [value, duration])

  return (
    <span>
      {prefix}
      {display.toLocaleString(undefined, { maximumFractionDigits: decimals, minimumFractionDigits: decimals })}
      {suffix}
    </span>
  )
}
