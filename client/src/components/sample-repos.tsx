const ROW_ONE = [
  { label: "vercel/next.js", url: "github.com/vercel/next.js", cls: "-rotate-2" },
  { label: "torvalds/linux", url: "github.com/torvalds/linux", cls: "rotate-[1.5deg]" },
  { label: "openclaw/openclaw", url: "github.com/openclaw/openclaw", cls: "-rotate-1" },
]

const ROW_TWO = [
  { label: "kelseyhightower/nocode", url: "github.com/kelseyhightower/nocode", cls: "rotate-2" },
  { label: "hkhan701/reporoast", url: "github.com/hkhan701/RepoRoast", cls: "-rotate-[1.5deg]" },
]

export function SampleRepos({ onSelect }: { onSelect: (url: string) => void }) {
  return (
    <div className="mt-6 flex flex-col items-center gap-2">
      <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
        Try a sample
      </span>
      <div className="flex flex-col items-center gap-2">
        <div className="flex flex-wrap justify-center gap-2">
          {ROW_ONE.map((repo) => (
            <button
              key={repo.url}
              type="button"
              onClick={() => onSelect(repo.url)}
              className={`border border-ink/30 bg-cream hover:bg-ink hover:text-primary-foreground text-ink px-2.5 py-1 text-xs font-normal tracking-wide hover:rotate-0 transition-all duration-150 cursor-pointer ${repo.cls}`}
            >
              {repo.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {ROW_TWO.map((repo) => (
            <button
              key={repo.url}
              type="button"
              onClick={() => onSelect(repo.url)}
              className={`border border-ink/30 bg-cream hover:bg-ink hover:text-primary-foreground text-ink px-2.5 py-1 text-xs font-normal tracking-wide hover:rotate-0 transition-all duration-150 cursor-pointer ${repo.cls}`}
            >
              {repo.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
