"use client"

import { useRef } from "react"
import { Skull } from "lucide-react"

export function Footer() {
  const skullRef = useRef<SVGSVGElement | null>(null)

  const handleSkullClick = () => {
    skullRef.current?.animate(
      [
        { transform: "translateX(0)" },
        { transform: "translateX(-3px)" },
        { transform: "translateX(3px)" },
        { transform: "translateX(-3px)" },
        { transform: "translateX(3px)" },
        { transform: "translateX(0)" },
      ],
      { duration: 280, easing: "ease-in-out" }
    )
  }

  return (
    <footer className="bg-ink text-primary-foreground py-12 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSkullClick}
              aria-label="Shake skull"
              className="w-8 h-8 border-2 border-primary-foreground bg-yellow flex items-center justify-center cursor-pointer"
            >
              <Skull ref={skullRef} className="w-5 h-5 text-ink" />
            </button>
            <span className="text-sm font-bold uppercase tracking-widest text-primary-foreground">
              Destroy My Repo
            </span>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t-2 border-primary-foreground/20">
          <p className="text-sm text-primary-foreground/60">
            {"Built to roast. No feelings were considered."}
          </p>
        </div>
      </div>
    </footer>
  )
}
