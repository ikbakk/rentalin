"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthActions } from "@convex-dev/auth/react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

export function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [mode, setMode] = useState<"signIn" | "signUp" | "reset" | "reset-verification">("signIn")
  const [code, setCode] = useState("")
  const [notice, setNotice] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { signIn } = useAuthActions()

  const login = async (e: React.FormEvent) => {
    e.preventDefault()
    if ((mode === "signUp" || mode === "reset-verification") && password !== confirmPassword) {
      toast.error("Passwords do not match")
      return
    }
    setLoading(true)
    try {
      if (mode === "reset") {
        try { await signIn("password", { email: email.trim(), flow: "reset" }) } catch { /* identical response for unknown emails */ }
        setNotice("If this email has a Rentalin account, a reset code will arrive shortly. Check your spam folder too.")
        setMode("reset-verification")
      } else {
        await signIn("password", mode === "reset-verification"
          ? { email: email.trim(), newPassword: password, code: code.trim().toUpperCase(), flow: mode }
          : { email: email.trim(), password, flow: mode })
        router.push("/operations")
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Login failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={login} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-11 rounded-xl"
          placeholder="you@example.com"
          required
        />
      </div>
      {notice && <p role="status" className="text-sm text-muted-foreground">{notice}</p>}
      {mode === "reset-verification" && <div className="space-y-2">
        <Label htmlFor="reset-code">Reset code</Label>
        <Input id="reset-code" autoComplete="one-time-code" value={code} onChange={event => setCode(event.target.value)} maxLength={12} minLength={12} required />
      </div>}
      {mode !== "reset" && <div className="space-y-2">
        <Label htmlFor="password" className="text-sm font-medium">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete={mode === "signUp" || mode === "reset-verification" ? "new-password" : "current-password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="h-11 rounded-xl"
          placeholder={mode === "signUp" || mode === "reset-verification" ? "Create a password (12+ characters)" : "Enter your password"}
          required
          minLength={mode === "signUp" || mode === "reset-verification" ? 12 : undefined}
        />
      </div>}
      {(mode === "signUp" || mode === "reset-verification") && (
        <div className="space-y-2">
          <Label htmlFor="confirm-password" className="text-sm font-medium">Confirm password</Label>
          <Input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="h-11 rounded-xl"
            required
            minLength={12}
          />
        </div>
      )}
      <Button
        type="submit"
        className="h-11 w-full rounded-xl text-base font-medium"
        disabled={loading}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <Loader2 className="size-4 animate-spin" />
            Please wait…
          </span>
        ) : (
          mode === "reset" ? "Send reset code" : mode === "reset-verification" ? "Reset password" : mode === "signUp" ? "Create Account" : "Sign In"
        )}
      </Button>
      {mode === "signIn" && <Button type="button" variant="link" disabled={loading} className="w-full" onClick={() => { setMode("reset"); setPassword(""); setConfirmPassword(""); setNotice("") }}>Forgot password?</Button>}
      {mode === "reset-verification" && <Button type="button" variant="link" disabled={loading} className="w-full" onClick={() => { setMode("reset"); setCode(""); setNotice("") }}>Request another code</Button>}
      <Button
        type="button"
        variant="ghost"
        className="w-full"
        disabled={loading}
        onClick={() => { setMode(mode === "signIn" ? "signUp" : "signIn"); setNotice(""); setCode(""); setPassword(""); setConfirmPassword("") }}
      >
        {mode === "signIn" ? "New to Rentalin? Create an account" : "Back to sign in"}
      </Button>
    </form>
  )
}
