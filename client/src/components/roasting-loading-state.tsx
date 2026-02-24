"use client"

import { useEffect, useRef, useState } from "react"
import { Skull } from "lucide-react"

const LOADING_TAGLINES = [
  "Destroying your repo...",
  "Reading your spaghetti...",
  "Judging your variable names...",
  "Counting your TODO comments...",
  "Scanning for console.logs...",
  "Measuring the chaos...",
  "Calculating your shame...",
  "Dissecting your git history...",
  "Auditing your 'temporary' hacks...",
  "Compiling your failures...",
  "Roasting in progress...",
  "Did you even test this?",
]

const BOX_W = 200
const BOX_H = 160
const SKULL_SIZE = 36

// Spring params for the box shake
const STIFFNESS = 0.28
const DAMPING   = 0.72
const IMPULSE   = 7

export function RoastingLoadingState() {
  const skullWrapperRef = useRef<HTMLDivElement | null>(null)
  const boxRef          = useRef<HTMLDivElement | null>(null)

  const posRef = useRef({
    x: Math.random() * (BOX_W - SKULL_SIZE),
    y: Math.random() * (BOX_H - SKULL_SIZE),
    dx: 1.6,
    dy: 1.3,
  })
  // Spring state for the box
  const springRef = useRef({ x: 0, y: 0, vx: 0, vy: 0 })

  const rafRef = useRef<number | null>(null)

  const [tagline, setTagline] = useState(
    () => LOADING_TAGLINES[Math.floor(Math.random() * LOADING_TAGLINES.length)]
  )
  const [fading, setFading] = useState(false)

  // Cycle taglines every 2.5 s
  useEffect(() => {
    const cycle = () => {
      setFading(true)
      setTimeout(() => {
        setTagline((prev) => {
          const choices = LOADING_TAGLINES.filter((t) => t !== prev)
          return choices[Math.floor(Math.random() * choices.length)]
        })
        setFading(false)
      }, 200)
    }
    const interval = setInterval(cycle, 2500)
    return () => clearInterval(interval)
  }, [])

  // DVD-style bounce + box spring shake
  useEffect(() => {
    const skull = skullWrapperRef.current
    const box   = boxRef.current
    if (!skull || !box) return

    const maxX = BOX_W - SKULL_SIZE
    const maxY = BOX_H - SKULL_SIZE

    const tick = () => {
      const p = posRef.current
      const s = springRef.current

      p.x += p.dx
      p.y += p.dy

      // Detect wall hits and inject impulse into the spring
      if (p.x <= 0) {
        p.x = 0; p.dx = Math.abs(p.dx)
        s.vx += IMPULSE  // box jolts right (away from left wall)
      }
      if (p.x >= maxX) {
        p.x = maxX; p.dx = -Math.abs(p.dx)
        s.vx -= IMPULSE  // box jolts left
      }
      if (p.y <= 0) {
        p.y = 0; p.dy = Math.abs(p.dy)
        s.vy += IMPULSE  // box jolts down
      }
      if (p.y >= maxY) {
        p.y = maxY; p.dy = -Math.abs(p.dy)
        s.vy -= IMPULSE  // box jolts up
      }

      // Integrate damped spring: F = -k*x, friction = damping
      s.vx = (s.vx - STIFFNESS * s.x) * DAMPING
      s.vy = (s.vy - STIFFNESS * s.y) * DAMPING
      s.x += s.vx
      s.y += s.vy

      skull.style.transform = `translate(${p.x}px, ${p.y}px)`
      box.style.transform   = `translate(${s.x}px, ${s.y}px)`

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [])

  return (
    <section className="bg-cream min-h-[60vh] flex flex-col items-center justify-center px-4">
      <div className="flex flex-col items-center gap-6">
        <div
          ref={boxRef}
          className="relative border-2 border-ink bg-yellow overflow-hidden"
          style={{ width: BOX_W, height: BOX_H, boxShadow: "4px 4px 0px #111111" }}
        >
          <div
            ref={skullWrapperRef}
            className="absolute top-0 left-0"
            style={{ width: SKULL_SIZE, height: SKULL_SIZE }}
          >
            <Skull className="w-full h-full text-ink" />
          </div>
        </div>
        <p
          className="text-xs font-bold uppercase tracking-widest text-muted-foreground transition-opacity duration-200"
          style={{ opacity: fading ? 0 : 1 }}
        >
          {tagline}
        </p>
      </div>
    </section>
  )
}
