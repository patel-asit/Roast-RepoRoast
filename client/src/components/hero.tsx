"use client"

import { useState, useEffect, useRef } from "react"
import { fetchRepoSummary, fetchRoast, parseGitHubUrl, type RepoSummary, type RoastResult } from "@/lib/github"
import { AvatarStrip } from "./avatar-strip"
import { SampleRepos } from "./sample-repos"
import { toast } from "@/components/ui/toaster"
import { ExternalLink, Share2 } from "lucide-react"
import { ArrowLeftIcon } from "./ui/arrow-left"
import { RoastingLoadingState } from "./roasting-loading-state"
import TextType from "./TextType"

export function HeroSection() {
  const [url, setUrl] = useState("")
  const [result, setResult] = useState<RoastResult | null>(null)
  const [roasting, setRoasting] = useState(false)
  const [profanity, setProfanity] = useState(true)
  const [roastedUrl, setRoastedUrl] = useState("")

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

  const handleRoastClick = async () => {
    setRoasting(true)
    setResult(null)
    setRoastedUrl(url)
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

  const handleBack = () => {
    setResult(null)
    setRoasting(false)
    setRoastedUrl("")
  }

  // Loading state
  if (roasting) return <RoastingLoadingState />

  // reader mode type view
  if (result) {
    return (
      <section className="bg-cream min-h-[60vh] px-4 py-12 sm:px-6">
        <div className="max-w-xl mx-auto flex flex-col gap-6">
          {/* Top bar */}
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 border-2 border-ink bg-cream text-ink px-3 py-1.5 text-xs font-bold uppercase tracking-widest hover:bg-ink hover:text-primary-foreground transition-colors duration-100 cursor-pointer shrink-0"
            >
              <ArrowLeftIcon size={15} />
            </button>

            <div className="flex items-center gap-2 shrink-0">
              <a
                href={roastedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 border-2 border-ink bg-cream text-ink px-3 py-1.5 text-xs font-mono hover:bg-ink hover:text-primary-foreground transition-colors duration-100"
              >
                {parseGitHubUrl(roastedUrl)?.repo ?? roastedUrl}
                <ExternalLink size={15} />
              </a>

              <button
                className="flex items-center justify-center border-2 border-ink bg-cream text-ink w-7 h-7 hover:bg-ink hover:text-primary-foreground transition-colors duration-100 cursor-pointer"
                aria-label="Share"
              >
                <Share2 size={15} />
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-ink/20 w-full" />

          {/* Roast content */}
          <div className="flex flex-col gap-6">
            <div className="text-sm text-ink leading-7 whitespace-pre-wrap">
              <TextType
                text={result.roast}
                typingSpeed={10}
                pauseDuration={0}
                showCursor
                loop={false}
                cursorCharacter="_"
                cursorBlinkDuration={0.5}
              />
            </div>
            <div className="border-t-2 border-ink/20 pt-5">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Verdict: {result.verdict}
              </p>
            </div>
          </div>
        </div>
      </section>
    )
  }

  // Default form view
  return (
    <section className="bg-cream pt-14 pb-6 px-4 sm:pt-20 sm:pb-8 sm:px-6 md:pt-24 md:pb-10">
      <div className="max-w-5xl mx-auto flex flex-col items-center text-center">
        <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold uppercase tracking-widest text-ink text-balance">
          Roast My Repo
        </h1>
        <p className="mt-4 sm:mt-6 text-sm text-muted-foreground max-w-xl text-pretty">
          {"Drop your repo URL. We'll find every bullshit thing you put on github."}
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
              onClick={handleRoastClick}
              disabled={roasting}
              className="border-2 border-ink bg-yellow text-ink px-4 sm:px-6 md:px-8 py-3 text-xs sm:text-sm font-bold uppercase tracking-widest cursor-pointer shrink-0 disabled:opacity-50 select-none relative overflow-hidden"
              style={{
                boxShadow: 'inset 0px -4px 0px rgba(0,0,0,0.4), inset 0px 2px 0px rgba(255,255,255,0.5), inset 4px 0px 0px rgba(255,255,255,0.3), inset -4px 0px 0px rgba(0,0,0,0.2)',
                paddingBottom: '16px',
                paddingTop: '8px',
              }}
              onMouseDown={e => {
                if (!roasting) {
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = 'inset 0px 4px 0px rgba(0,0,0,0.3), inset 0px -1px 0px rgba(255,255,255,0.2), inset 4px 0px 0px rgba(0,0,0,0.15), inset -4px 0px 0px rgba(255,255,255,0.1)';
                  (e.currentTarget as HTMLButtonElement).style.paddingBottom = '12px';
                  (e.currentTarget as HTMLButtonElement).style.paddingTop = '12px';
                }
              }}
              onMouseUp={e => {
                (e.currentTarget as HTMLButtonElement).style.boxShadow = 'inset 0px -4px 0px rgba(0,0,0,0.4), inset 0px 2px 0px rgba(255,255,255,0.5), inset 4px 0px 0px rgba(255,255,255,0.3), inset -4px 0px 0px rgba(0,0,0,0.2)';
                (e.currentTarget as HTMLButtonElement).style.paddingBottom = '16px';
                (e.currentTarget as HTMLButtonElement).style.paddingTop = '8px';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.boxShadow = 'inset 0px -4px 0px rgba(0,0,0,0.4), inset 0px 2px 0px rgba(255,255,255,0.5), inset 4px 0px 0px rgba(255,255,255,0.3), inset -4px 0px 0px rgba(0,0,0,0.2)';
                (e.currentTarget as HTMLButtonElement).style.paddingBottom = '16px';
                (e.currentTarget as HTMLButtonElement).style.paddingTop = '8px';
              }}
            >
              Roast It
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
        <SampleRepos onSelect={setUrl} />
      </div>
    </section>
  )
}
