"use client"

import { useState } from "react"

export function HeroSection() {
  const [url, setUrl] = useState("")

  return (
    <section className="bg-cream py-20 px-6 md:py-24">
      <div className="max-w-5xl mx-auto flex flex-col items-center text-center">
        <h1 className="text-5xl md:text-7xl font-bold uppercase tracking-widest text-ink text-balance">
          Destroy My Repo
        </h1>
        <p className="mt-6 text-sm text-muted-foreground max-w-xl text-pretty">
          {"Drop your repo URL. We'll find every bullshit thing you put in your code."}
        </p>

        <div className="mt-10 flex w-full max-w-xl">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="paste-your-shitty-repo-url-here"
            className="flex-1 border-2 border-ink bg-card text-card-foreground px-4 py-3 text-sm font-normal tracking-normal placeholder:text-muted-foreground focus:outline-none"
          />
          <button className="border-2 border-ink border-l-0 bg-ink text-primary-foreground px-6 md:px-8 py-3 text-sm font-bold uppercase tracking-widest hover:bg-yellow hover:text-ink transition-all duration-100 cursor-pointer shrink-0">
            Destroy It
          </button>
        </div>
      </div>
    </section>
  )
}
