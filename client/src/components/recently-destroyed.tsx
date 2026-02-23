"use client"

interface DestroyedStartup {
  domain: string
  roast: string
  iconColor: string
}

const ROW_ONE: DestroyedStartup[] = [
  {
    domain: "buzzmetric.io",
    roast: "A vanity dashboard for people who confuse clicks with customers.",
    iconColor: "bg-gold",
  },
  {
    domain: "fasting.dev",
    roast: "A fucking stopwatch for people who are starving.",
    iconColor: "bg-mint",
  },
  {
    domain: "onadigitalnote.com",
    roast: "Shit-tier Shopify templates for brainless fucks.",
    iconColor: "bg-hotpink",
  },
  {
    domain: "nexosmart.com",
    roast: "Shit-tier templates sold by people who peaked in 2019.",
    iconColor: "bg-gold",
  },
  {
    domain: "cloudpulse.ai",
    roast: "Another AI wrapper pretending to be revolutionary.",
    iconColor: "bg-mint",
  },
  {
    domain: "shipsync.co",
    roast: "Slack notifications about your other Slack notifications.",
    iconColor: "bg-hotpink",
  },
]

const ROW_TWO: DestroyedStartup[] = [
  {
    domain: "revpdf.com",
    roast: "Your offline PDF app is a secure storage of shit.",
    iconColor: "bg-mint",
  },
  {
    domain: "rybbit.com",
    roast: "Stop playing with your digital frog dick and die.",
    iconColor: "bg-hotpink",
  },
  {
    domain: "axxowastaken.me",
    roast: "Just a pathetic little kid playing pirate pretend.",
    iconColor: "bg-gold",
  },
  {
    domain: "metricflow.dev",
    roast: "A prettier way to watch your startup bleed money.",
    iconColor: "bg-mint",
  },
  {
    domain: "pixelvault.io",
    roast: "Dropbox but worse and with a cooler name. Congrats.",
    iconColor: "bg-hotpink",
  },
  {
    domain: "schedulebot.app",
    roast: "Google Calendar with extra steps and a $20/mo fee.",
    iconColor: "bg-gold",
  },
]

function StartupCard({ startup }: { startup: DestroyedStartup }) {
  return (
    <div className="relative border-2 border-ink bg-card p-5 shadow-offset min-w-[300px] max-w-[300px] shrink-0 select-none">
      <div className="flex items-center gap-3">
        <div
          className={`w-9 h-9 ${startup.iconColor} border-2 border-ink flex items-center justify-center shrink-0`}
        >
          <span className="text-xs font-bold text-ink uppercase">
            {startup.domain.charAt(0)}
          </span>
        </div>
        <span className="text-xs font-bold uppercase tracking-widest text-card-foreground truncate">
          {startup.domain}
        </span>
      </div>
      <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
        {startup.roast}
      </p>
    </div>
  )
}

function MarqueeRow({
  startups,
  direction = "left",
  speed = 30,
}: {
  startups: DestroyedStartup[]
  direction?: "left" | "right"
  speed?: number
}) {
  const animationName = direction === "left" ? "marquee-left" : "marquee-right"

  return (
    <div className="flex overflow-hidden">
      <div
        className="flex gap-5 shrink-0"
        style={{
          animation: `${animationName} ${speed}s linear infinite`,
        }}
      >
        {startups.map((startup, i) => (
          <StartupCard key={`${startup.domain}-${i}`} startup={startup} />
        ))}
        {/* spacer to keep gap consistent between end and duplicate start */}
        <div className="w-0" aria-hidden="true" />
      </div>
      <div
        className="flex gap-5 shrink-0 pl-5"
        aria-hidden="true"
        style={{
          animation: `${animationName} ${speed}s linear infinite`,
        }}
      >
        {startups.map((startup, i) => (
          <StartupCard key={`dup-${startup.domain}-${i}`} startup={startup} />
        ))}
        <div className="w-0" />
      </div>
    </div>
  )
}

export function RecentlyDestroyed() {
  return (
    <section className="py-20 md:py-24 bg-cream overflow-hidden">
      <div className="max-w-5xl mx-auto px-6 mb-10">
        <h2 className="text-sm md:text-base font-bold uppercase tracking-widest text-muted-foreground text-center">
          Recently Destroyed
        </h2>
      </div>

      <div
        className="relative flex flex-col gap-5"
        style={{
          maskImage:
            "linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)",
        }}
      >
        <MarqueeRow startups={ROW_ONE} direction="left" speed={35} />
        <MarqueeRow startups={ROW_TWO} direction="right" speed={40} />
      </div>

      <div className="mt-10 text-center">
        <a
          href="#"
          className="text-sm font-normal uppercase tracking-widest text-muted-foreground underline underline-offset-4 hover:text-ink transition-colors"
        >
          {"Want some compliments on your repo instead? Click here."}
        </a>
      </div>
    </section>
  )
}
