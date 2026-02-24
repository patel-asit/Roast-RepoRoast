"use client"

import { Facehash } from "facehash"
import { cn } from "@/lib/utils"
import { Marquee } from "@/components/ui/marquee"

interface RoastedRepo {
  domain: string
  roast: string
}

const ROW_ONE: RoastedRepo[] = [
  {
    domain: "todo-app-v47",
    roast: "Forty-seven rewrites and you still can't mark a task done.",
  },
  {
    domain: "my-portfolio-2019",
    roast: "A graveyard of unfinished projects dressed up with CSS animations.",
  },
  {
    domain: "blockchain-water",
    roast: "You put water on a blockchain. Water. On a blockchain.",
  },
  {
    domain: "gpt-wrapper-saas",
    roast: "You copy-pasted the OpenAI docs and called it a product.",
  },
  {
    domain: "leetcode-solutions",
    roast: "250 easy problems, zero medium ones. Very telling.",
  },
  {
    domain: "startup-landing-v3",
    roast: "Three landing pages, zero users, infinite buzzwords.",
  },
]

const ROW_TWO: RoastedRepo[] = [
  {
    domain: "nodejs-chat-app",
    roast: "A Socket.io tutorial with your name slapped on the README.",
  },
  {
    domain: "ml-stock-predictor",
    roast: "Linear regression in a trench coat pretending to be AI.",
  },
  {
    domain: "awesome-list-list",
    roast: "A list of lists of lists. You contributed nothing to this world.",
  },
  {
    domain: "discord-bot-v2",
    roast: "Slash commands that don't work and a bot that's offline 24/7.",
  },
  {
    domain: "crypto-tracker-pro",
    roast: "Built during the bull run. Last commit: November 2022.",
  },
  {
    domain: "rust-rewrite",
    roast: "You rewrote your broken JavaScript in Rust. Still broken.",
  },
]

const AVATAR_BG_COLORS = [
  "bg-mint", "bg-hotpink", "bg-gold", "bg-lavender",
  "bg-rosecoral", "bg-skyblue", "bg-peachglow", "bg-mint", "bg-hotpink",
]

function RepoCard({ repo, index }: { repo: RoastedRepo; index: number }) {
  return (
    <div
      className={cn(
        "relative border-2 border-ink bg-card p-3 sm:p-5 shadow-offset min-w-52 max-w-52 sm:min-w-75 sm:max-w-75 shrink-0 select-none"
      )}
    >
      <div className="flex items-center gap-3">
        <div className={cn("w-7 h-7 sm:w-9 sm:h-9 border-2 border-ink shrink-0 overflow-hidden", AVATAR_BG_COLORS[index % AVATAR_BG_COLORS.length])}>
          <Facehash name={repo.domain} size={36} />
        </div>
        <span className="text-xs font-bold uppercase tracking-widest text-card-foreground truncate">
          {repo.domain}
        </span>
      </div>
      <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
        {repo.roast}
      </p>
    </div>
  )
}

export function RecentlyRoasted() {
  return (
    <section className="py-14 sm:py-20 md:py-24 bg-cream overflow-hidden">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 mb-8 sm:mb-10">
        <h2 className="text-sm md:text-base font-bold uppercase tracking-widest text-muted-foreground text-center">
          Recently Roasted
        </h2>
      </div>

      <div className="relative flex flex-col gap-5">
        <Marquee pauseOnHover className="[--duration:35s] [--gap:0.75rem] sm:[--gap:1.25rem]">
          {ROW_ONE.map((repo, index) => (
            <RepoCard key={repo.domain} repo={repo} index={index} />
          ))}
        </Marquee>
        <Marquee reverse pauseOnHover className="[--duration:40s] [--gap:0.75rem] sm:[--gap:1.25rem]">
          {ROW_TWO.map((repo, index) => (
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
