"use client"

import { useState, useEffect, useRef } from "react"
import { fetchRepoSummary, fetchRoast, parseGitHubUrl, type RepoSummary, type RoastResult } from "@/lib/github"
import { AvatarStrip } from "./avatar-strip"
import { toast } from "@/components/ui/toaster"

export function HeroSection() {
  const [url, setUrl] = useState("")
  const [result, setResult] = useState<RoastResult | null>(null)
  const [roasting, setRoasting] = useState(false)
  const [profanity, setProfanity] = useState(true)

  // Background pre-fetch state
  const summaryRef = useRef<RepoSummary | null>(null)
  const summaryPromiseRef = useRef<Promise<RepoSummary | { error: true; status: number; message: string }> | null>(null)
  const currentUrlRef = useRef<string>("")
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Silently pre-fetch repo summary whenever a valid GitHub URL is entered
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    const parsed = parseGitHubUrl(url)
    if (!parsed) {
      summaryRef.current = null
      summaryPromiseRef.current = null
      currentUrlRef.current = ""
      return
    }

    // URL changed — invalidate cached summary
    summaryRef.current = null
    summaryPromiseRef.current = null
    currentUrlRef.current = url

    debounceRef.current = setTimeout(() => {
      const capturedUrl = url
      const promise = fetchRepoSummary(capturedUrl)
      summaryPromiseRef.current = promise

      promise.then((res) => {
        // Discard if the URL changed by the time this resolves
        if (currentUrlRef.current !== capturedUrl) return
        if (!("error" in res)) {
          summaryRef.current = res
        }
      })
    }, 600)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [url])

  const handleDestroyClick = async () => {
    setRoasting(true)
    setResult(null)
    currentUrlRef.current = url

    let resolvedSummary = summaryRef.current

    if (!resolvedSummary) {
      // Cancel any pending debounce and ensure we have a promise to await
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
        debounceRef.current = null
      }

      const promise = summaryPromiseRef.current ?? fetchRepoSummary(url)
      summaryPromiseRef.current = promise

      const res = await promise
      if ("error" in res) {
        setRoasting(false)
        toast.error(res.message)
        return
      }
      resolvedSummary = res
      summaryRef.current = res
    }

    const roast = await fetchRoast(resolvedSummary, profanity)
    setRoasting(false)
    if ("error" in roast) {
      toast.error(roast.message)
    } else {
      setResult(roast)
    }
  }

  return (
    <>
      <section className="bg-cream py-14 px-4 sm:py-20 sm:px-6 md:py-24">
        <div className="max-w-5xl mx-auto flex flex-col items-center text-center">
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold uppercase tracking-widest text-ink text-balance">
            Roast My Repo
          </h1>
          <p className="mt-4 sm:mt-6 text-sm text-muted-foreground max-w-xl text-pretty">
            {"Drop your repo URL. We'll find every bullshit thing you put in your code."}
          </p>

          <div className="mt-8 sm:mt-10 flex w-full max-w-xl flex-col gap-3">
            <div className="flex">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="paste-your-repo-url-here"
                className="flex-1 min-w-0 border-2 border-ink bg-card text-card-foreground px-3 sm:px-4 py-3 text-sm font-normal tracking-normal placeholder:text-muted-foreground focus:outline-none"
              />
              <button
                onClick={handleDestroyClick}
                disabled={roasting}
                className="border-2 border-ink border-l-0 bg-ink text-primary-foreground px-4 sm:px-6 md:px-8 py-3 text-xs sm:text-sm font-bold uppercase tracking-widest hover:bg-yellow hover:text-ink transition-all duration-100 cursor-pointer shrink-0 disabled:opacity-50"
              >
                {roasting ? "Destroying..." : "Destroy It"}
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

      {result && (
        <div className="bg-cream border-t-2 border-b-2 border-ink py-10 px-4 sm:px-6 my-0">
          <div className="max-w-5xl mx-auto flex flex-col gap-4">
            <p className="text-sm text-ink leading-relaxed whitespace-pre-wrap">{result.roast}</p>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground border-t-2 border-ink/20 pt-4">
              Verdict: {result.verdict}
            </p>
          </div>
        </div>
      )}
    </>
  )
}
