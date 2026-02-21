import { Skull } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-ink text-primary-foreground py-12 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 border-2 border-primary-foreground bg-yellow flex items-center justify-center">
              <Skull className="w-5 h-5 text-ink" />
            </div>
            <span className="text-sm font-bold uppercase tracking-widest text-primary-foreground">
              Destroy My Repo
            </span>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t-2 border-primary-foreground/20">
          <p className="text-sm text-primary-foreground/60">
            {"Built to roast. No feelings were considered."}
          </p>
        </div>
      </div>
    </footer>
  )
}
