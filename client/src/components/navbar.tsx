"use client"

import { useRef, useState } from "react"
import { Skull } from "lucide-react"

const TAGLINES = [
  "Roast My Repo",
  "Spaghetti Detected",
  "Your Code Sucks",
  "404: Talent Not Found",
  "Git Blame Yourself",
  "Senior Dev Crying",
  "Please. Just Stop.",
  "Commit to Therapy",
  "No Tests? Seriously?",
]

export function Navbar() {
  const skullRef = useRef<SVGSVGElement | null>(null)
  const [tagline, setTagline] = useState("Roast My Repo")
  const [fading, setFading] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleSkullClick = () => {
    // Skull animation: shake + quick scale-up pop
    skullRef.current?.animate(
      [
        { transform: "scale(1) rotate(0deg)" },
        { transform: "scale(1.25) rotate(-12deg)" },
        { transform: "scale(1.25) rotate(12deg)" },
        { transform: "scale(1.25) rotate(-8deg)" },
        { transform: "scale(1.25) rotate(8deg)" },
        { transform: "scale(1) rotate(0deg)" },
      ],
      { duration: 380, easing: "ease-in-out" }
    )

    // Pick a random tagline that isn't the current one
    const choices = TAGLINES.filter((t) => t !== tagline)
    const next = choices[Math.floor(Math.random() * choices.length)]

    // Fade out → swap → fade in
    setFading(true)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      setTagline(next)
      setFading(false)
      // Reset to default after 2.5 s
      timeoutRef.current = setTimeout(() => {
        setFading(true)
        timeoutRef.current = setTimeout(() => {
          setTagline("Roast My Repo")
          setFading(false)
        }, 150)
      }, 2500)
    }, 150)
  }

  return (
    <nav className="bg-ink text-primary-foreground py-3 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSkullClick}
            aria-label="Shake skull"
            className="w-8 h-8 border-2 border-primary-foreground bg-yellow flex items-center justify-center cursor-pointer"
          >
            <Skull ref={skullRef} className="w-5 h-5 text-ink" />
          </button>
          <span
            className="text-sm font-bold uppercase tracking-widest text-primary-foreground transition-opacity duration-150"
            style={{ opacity: fading ? 0 : 1 }}
          >
            {tagline}
          </span>
        </div>
        {/* <span className="text-xs text-yellow font-medium">
          I&apos;m running into api limits :( Check out
          the recently roasted repos below if I don&apos;t work!
        </span> */}
      </div>
    </nav>
  )
}