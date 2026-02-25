"use client"

import { useState, useEffect } from "react"
import { Facehash } from "facehash"
import { cn } from "@/lib/utils"
import { Marquee } from "@/components/ui/marquee"

interface RoastedRepo {
  domain: string
  verdict: string
}

const ROW_ONE: RoastedRepo[] = [
  {
    domain: "todo-app-v47",
    verdict: "Forty-seven rewrites and you still can't mark a task done.",
  },
  {
    domain: "my-portfolio-2019",
    verdict: "A graveyard of unfinished projects dressed up with CSS animations.",
  },
  {
    domain: "blockchain-water",
    verdict: "You put water on a blockchain. Water. On a blockchain.",
  },
  {
    domain: "gpt-wrapper-saas",
    verdict: "You copy-pasted the OpenAI docs and called it a product.",
  },
  {
    domain: "leetcode-solutions",
    verdict: "250 easy problems, zero medium ones. Very telling.",
  },
  {
    domain: "startup-landing-v3",
    verdict: "Three landing pages, zero users, infinite buzzwords.",
  },
]

const ROW_TWO: RoastedRepo[] = [
  {
    domain: "nodejs-chat-app",
    verdict: "A Socket.io tutorial with your name slapped on the README.",
  },
  {
    domain: "ml-stock-predictor",
    verdict: "Linear regression in a trench coat pretending to be AI.",
  },
  {
    domain: "awesome-list-list",
    verdict: "A list of lists of lists. You contributed nothing to this world.",
  },
  {
    domain: "discord-bot-v2",
    verdict: "Slash commands that don't work and a bot that's offline 24/7.",
  },
  {
    domain: "crypto-tracker-pro",
    verdict: "Built during the bull run. Last commit: November 2022.",
  },
  {
    domain: "rust-rewrite",
    verdict: "You rewrote your broken JavaScript in Rust. Still broken.",
  },
]

const AVATAR_BG_COLORS = [
  "bg-mint", "bg-hotpink", "bg-gold", "bg-lavender",
  "bg-rosecoral", "bg-skyblue", "bg-peachglow", "bg-mint", "bg-hotpink",
]

const SERVER_URL = (process.env.NEXT_PUBLIC_REPO_ROAST_SERVER_URL ?? "http://localhost:5000").replace(/\/$/, "")

let lastColor: string | null = null;
function getRandomColor(colors: string[]) {
  let filtered = colors;
  if (lastColor && colors.length > 1) {
    filtered = colors.filter((c) => c !== lastColor);
  }
  const color = filtered[Math.floor(Math.random() * filtered.length)];
  lastColor = color;
  return color;
}

function RepoCard({ repo }: { repo: RoastedRepo; index: number }) {
  const [color] = useState(() => getRandomColor(AVATAR_BG_COLORS));
  return (
    <div
      className="bg-ink min-w-52 max-w-52 sm:min-w-75 sm:max-w-75 h-32 shrink-0 select-none cursor-pointer"
      style={{ animation: "scale-up-center 1s cubic-bezier(0.4, 0, 0.2, 1) both" }}
    >
      <div
        className={cn(
          "h-full border-2 border-ink bg-card p-3 sm:p-5 -translate-x-1 -translate-y-1 hover:-translate-x-1.5 hover:-translate-y-1.5 active:translate-x-0 active:translate-y-0 duration-200"
        )}
      >
        <div className="flex items-center gap-3">
          <div className={cn("w-7 h-7 sm:w-9 sm:h-9 border-2 border-ink shrink-0 overflow-hidden", color)}>
            <span className="sm:hidden"><Facehash name={repo.domain} size={28} /></span>
            <span className="hidden sm:block"><Facehash name={repo.domain} size={36} /></span>
          </div>
          <span className="text-xs font-bold uppercase tracking-widest text-card-foreground truncate">
            {repo.domain}
          </span>
        </div>
        <p className="mt-2 text-xs text-muted-foreground leading-relaxed line-clamp-3">
          {repo.verdict}
        </p>
      </div>
    </div>
  )
}

export function RecentlyRoasted() {
  const [rowOne, setRowOne] = useState<RoastedRepo[]>(ROW_ONE)
  const [rowTwo, setRowTwo] = useState<RoastedRepo[]>(ROW_TWO)

  useEffect(() => {
    fetch(`${SERVER_URL}/recent-roasts`)
      .then((r) => r.json())
      .then((data: { roasts: RoastedRepo[] }) => {
        const roasts = data.roasts
        if (!roasts || roasts.length < 2) return
        const mid = Math.ceil(roasts.length / 2)
        setRowOne(roasts.slice(0, mid))
        setRowTwo(roasts.slice(mid))
      })
      .catch(() => { /* keep static fallback */ })
  }, [])

  return (
    <section className="pt-6 pb-14 sm:pt-8 sm:pb-20 md:pt-10 md:pb-24 bg-cream overflow-hidden">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 mb-8 sm:mb-10">
        <h2 className="text-sm md:text-base font-bold uppercase tracking-widest text-muted-foreground text-center">
          Recently Roasted
        </h2>
      </div>

      <div className="relative flex flex-col gap-5">
        <Marquee pauseOnHover className="[--duration:35s] [--gap:0.75rem] sm:[--gap:1.25rem]">
          {rowOne.map((repo, index) => (
            <RepoCard key={repo.domain} repo={repo} index={index} />
          ))}
        </Marquee>
        <Marquee reverse pauseOnHover className="[--duration:40s] [--gap:0.75rem] sm:[--gap:1.25rem]">
          {rowTwo.map((repo, index) => (
            <RepoCard key={repo.domain} repo={repo} index={index} />
          ))}
        </Marquee>
        <div className="pointer-events-none absolute inset-y-0 left-0 w-1/6 bg-linear-to-r from-cream to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-1/6 bg-linear-to-l from-cream to-transparent" />
      </div>

      <div className="mt-10 text-center">
        <a
          href="https://github.com/hkhan701/RepoRoast"
          target="_blank"
          className="text-sm font-normal uppercase tracking-widest text-muted-foreground underline underline-offset-4 hover:text-ink transition-colors"
        >
          {"view source code here"}
        </a>
      </div>
    </section>
  )
}
