"use client"

import { Toaster as Sonner, toast as sonnerToast } from "sonner"

export function Toaster() {
  return (
    <Sonner
      position="top-center"
      gap={8}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "w-full flex items-start gap-3 border-2 border-ink bg-cream text-ink px-4 py-3 shadow-[4px_4px_0px_#111111] font-mono text-xs",
          title: "font-bold uppercase tracking-widest text-xs",
          description: "text-xs font-normal tracking-normal mt-0.5 opacity-80",
          closeButton:
            "!border-2 !border-ink !bg-cream !text-ink !rounded-none hover:!bg-ink hover:!text-cream transition-colors !top-3 !right-3 !left-auto !translate-x-0 !translate-y-0",
          actionButton:
            "!border-2 !border-ink !bg-ink !text-cream !rounded-none text-xs font-bold uppercase tracking-widest px-3 py-1 hover:!bg-yellow hover:!text-ink transition-colors",
        },
      }}
    />
  )
}

// ── typed helpers ────────────────────────────────────────────────────────────

type ToastOptions = Parameters<typeof sonnerToast>[1]

function base(type: "success" | "error" | "warning" | "default") {
  const accent: Record<string, string> = {
    success: "border-l-4 border-l-mint",
    error: "border-l-4 border-l-rosecoral",
    warning: "border-l-4 border-l-gold",
    default: "",
  }
  return {
    unstyled: true,
    classNames: {
      toast: `w-full flex items-start gap-3 border-2 border-ink bg-cream text-ink px-4 py-3 shadow-[4px_4px_0px_#111111] font-mono text-xs ${accent[type]}`,
      title: "font-bold uppercase tracking-widest text-xs",
      description: "text-xs font-normal tracking-normal mt-0.5 opacity-80",
    },
  } satisfies ToastOptions
}

export const toast = {
  success: (title: string, opts?: ToastOptions) =>
    sonnerToast.success(title, { ...base("success"), ...opts }),

  error: (title: string, opts?: ToastOptions) =>
    sonnerToast.error(title, { ...base("error"), ...opts }),

  warning: (title: string, opts?: ToastOptions) =>
    sonnerToast.warning(title, { ...base("warning"), ...opts }),

  message: (title: string, opts?: ToastOptions) =>
    sonnerToast(title, { ...base("default"), ...opts }),
}
