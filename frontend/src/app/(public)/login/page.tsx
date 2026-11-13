import { LoginForm } from "./login-form"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Login — Rentalin" }

export default function LoginPage() {
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-background p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 size-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 size-80 rounded-full bg-accent/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        <div className="text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-primary/10">
            <svg className="size-8 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8c-.1.2-.1.4-.1.6v4.7c0 .6.4 1 1 1h2" />
              <circle cx="7" cy="17" r="2" />
              <circle cx="17" cy="17" r="2" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">rentalin<span className="text-accent">.</span></h1>
          <p className="mt-2 text-sm text-muted-foreground">
            From first inquiry to final return.
          </p>
        </div>

        <div className="mt-8 rounded-xl border border-border bg-card p-6">
          <LoginForm />
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Vehicle rental management system
        </p>
      </div>
    </div>
  )
}
