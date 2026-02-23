"use client"

import { useState } from "react"
import { fetchRepoSummary, type RepoSummary } from "@/lib/github"
import { AvatarStrip } from "./avatar-strip"

export function HeroSection() {
  const [url, setUrl] = useState("")
  const [result, setResult] = useState<RepoSummary | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [profanity, setProfanity] = useState(true)

  const handleDestroyClick = async () => {
    setLoading(true)
    setError(null)
    setResult(null)
    const res = await fetchRepoSummary(url)
    setLoading(false)
    if ("error" in res) {
      setError(res.message)
    } else {
      setResult(res)
    }
  }

  return (
    <>
      <section className="bg-cream py-20 px-6 md:py-24">
        <div className="max-w-5xl mx-auto flex flex-col items-center text-center">
          <h1 className="text-5xl md:text-7xl font-bold uppercase tracking-widest text-ink text-balance">
            Destroy My Repo
          </h1>
          <p className="mt-6 text-sm text-muted-foreground max-w-xl text-pretty">
            {"Drop your repo URL. We'll find every bullshit thing you put in your code."}
          </p>

          <div className="mt-10 flex w-full max-w-xl flex-col gap-3">
            <div className="flex">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="paste-your-shitty-repo-url-here"
                className="flex-1 border-2 border-ink bg-card text-card-foreground px-4 py-3 text-sm font-normal tracking-normal placeholder:text-muted-foreground focus:outline-none"
              />
              <button
                onClick={handleDestroyClick}
                disabled={loading}
                className="border-2 border-ink border-l-0 bg-ink text-primary-foreground px-6 md:px-8 py-3 text-sm font-bold uppercase tracking-widest hover:bg-yellow hover:text-ink transition-all duration-100 cursor-pointer shrink-0 disabled:opacity-50"
              >
                {loading ? "Destroying..." : "Destroy It"}
              </button>
            </div>

            <button
              type="button"
              onClick={() => setProfanity((p) => !p)}
              className={`self-start flex items-center gap-3 border-2 border-ink px-3 py-1.5 cursor-pointer transition-colors duration-100 ${profanity ? "bg-ink text-primary-foreground" : "bg-cream text-ink"}`}
            >
              <span className="text-xs font-bold uppercase tracking-widest">
                {profanity ? "Profanity On" : "Clean Mode"}
              </span>
              <span className={`relative w-8 h-4 border-2 border-current flex items-center transition-colors ${profanity ? "bg-yellow" : "bg-muted"}`}>
                <span className={`absolute w-2.5 h-2.5 bg-ink transition-all duration-150 ${profanity ? "left-3.5" : "left-px"}`} />
              </span>
            </button>
          </div>

          <AvatarStrip />
        </div>
      </section>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 my-4 max-w-5xl mx-auto">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {result && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-6 my-4 max-w-5xl mx-auto">
          <h2 className="text-xl font-bold mb-4">{result.name}</h2>
          <pre className="bg-white p-4 rounded border border-blue-200 overflow-auto text-xs">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </>
  )
}
