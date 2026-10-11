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
  const [mode, setMode] = useState<"signIn" | "signUp">("signIn")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { signIn } = useAuthActions()

  const login = async (e: React.FormEvent) => {
    e.preventDefault()
    if (mode === "signUp" && password !== confirmPassword) {
      toast.error("Passwords do not match")
      return
    }
    setLoading(true)
    try {
      await signIn("password", { email, password, flow: mode })
      router.push("/operations")
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
      <div className="space-y-2">
        <Label htmlFor="password" className="text-sm font-medium">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete={mode === "signUp" ? "new-password" : "current-password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="h-11 rounded-xl"
          placeholder={mode === "signUp" ? "Create a password (12+ characters)" : "Enter your password"}
          required
          minLength={mode === "signUp" ? 12 : undefined}
        />
      </div>
      {mode === "signUp" && (
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
            Signing in...
          </span>
        ) : (
          mode === "signUp" ? "Create Account" : "Sign In"
        )}
      </Button>
      <Button
        type="button"
        variant="ghost"
        className="w-full"
        disabled={loading}
        onClick={() => setMode(mode === "signIn" ? "signUp" : "signIn")}
      >
        {mode === "signUp" ? "Already have an account? Sign in" : "New to Rentalin? Create an account"}
      </Button>
    </form>
  )
}
