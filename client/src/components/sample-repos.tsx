const ROW_ONE = [
  { label: "facebook/react", url: "https://github.com/facebook/react", cls: "-rotate-2" },
  { label: "torvalds/linux", url: "https://github.com/torvalds/linux", cls: "rotate-[1.5deg]" },
  { label: "microsoft/vscode", url: "https://github.com/microsoft/vscode", cls: "-rotate-1" },
]

const ROW_TWO = [
  { label: "kelseyhightower/nocode", url: "https://github.com/kelseyhightower/nocode", cls: "rotate-2" },
  { label: "hkhan701/reporoast", url: "https://github.com/hkhan701/RepoRoast", cls: "-rotate-[1.5deg]" },
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
