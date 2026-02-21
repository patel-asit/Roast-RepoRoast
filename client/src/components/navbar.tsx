import { Skull } from "lucide-react"

export function Navbar() {
  return (
    <nav className="bg-ink text-primary-foreground py-3 px-6">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary-foreground bg-yellow flex items-center justify-center">
            <Skull className="w-5 h-5 text-ink" />
          </div>
          <span className="text-sm font-bold uppercase tracking-widest text-primary-foreground">
            Destroy My Repo
          </span>
        </div>
      </div>
    </nav>
  )
}
