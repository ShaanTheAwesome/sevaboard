import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Navigate, useNavigate } from "react-router-dom"
import { Flame } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel, FieldError } from "@/components/ui/field"

const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
})

type LoginFormValues = z.infer<typeof loginSchema>

const forgotPasswordSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
})

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>

export function LoginPage() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [authError, setAuthError] = useState<string | null>(null)
  const [mode, setMode] = useState<"login" | "forgot">("login")
  const [resetSent, setResetSent] = useState(false)

  const {
    register: registerLogin,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors, isSubmitting: loginSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  })

  const {
    register: registerForgot,
    handleSubmit: handleForgotSubmit,
    formState: { errors: forgotErrors, isSubmitting: forgotSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  if (!loading && user) {
    return <Navigate to="/" replace />
  }

  const switchMode = (next: "login" | "forgot") => {
    setAuthError(null)
    setResetSent(false)
    setMode(next)
  }

  const onSubmitLogin = async (values: LoginFormValues) => {
    setAuthError(null)
    const { error } = await supabase.auth.signInWithPassword(values)

    if (error) {
      setAuthError(error.message)
      return
    }

    navigate("/", { replace: true })
  }

  const onSubmitForgot = async (values: ForgotPasswordFormValues) => {
    setAuthError(null)
    const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo: `${window.location.origin}/set-password`,
    })

    if (error) {
      setAuthError(error.message)
      return
    }

    setResetSent(true)
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-saffron to-gold">
            <Flame className="size-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">SevaBoard</CardTitle>
          <CardDescription>
            {mode === "login" ? "Sign in to manage your event" : "Reset your password"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {mode === "login" ? (
            <form onSubmit={handleLoginSubmit(onSubmitLogin)} noValidate>
              <FieldGroup>
                <Field data-invalid={!!loginErrors.email}>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    aria-invalid={!!loginErrors.email}
                    {...registerLogin("email")}
                  />
                  <FieldError errors={[loginErrors.email]} />
                </Field>

                <Field data-invalid={!!loginErrors.password}>
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    aria-invalid={!!loginErrors.password}
                    {...registerLogin("password")}
                  />
                  <FieldError errors={[loginErrors.password]} />
                  <button
                    type="button"
                    onClick={() => switchMode("forgot")}
                    className="text-right text-sm text-primary hover:cursor-pointer hover:underline"
                  >
                    Forgot password?
                  </button>
                </Field>

                {authError && (
                  <p role="alert" className="text-sm text-destructive">
                    {authError}
                  </p>
                )}

                <Field>
                  <Button type="submit" disabled={loginSubmitting}>
                    {loginSubmitting ? "Signing in..." : "Sign in"}
                  </Button>
                  <Button
                    type="button"
                    className="bg-gray-600 text-white hover:bg-gray-700 hover:text-gray-300"
                    onClick={() => navigate("/")}
                  >
                    Go back Home
                  </Button>
                </Field>
              </FieldGroup>
            </form>
          ) : (
            <form onSubmit={handleForgotSubmit(onSubmitForgot)} noValidate>
              <FieldGroup>
                {resetSent ? (
                  <p className="text-sm text-muted-foreground">
                    If an account exists for that email, we've sent a password reset
                    link — check your inbox (and spam folder).
                  </p>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">
                      Enter your email and we'll send you a link to set a new password —
                      also works if you never set one up in the first place.
                    </p>

                    <Field data-invalid={!!forgotErrors.email}>
                      <FieldLabel htmlFor="forgot-email">Email</FieldLabel>
                      <Input
                        id="forgot-email"
                        type="email"
                        autoComplete="email"
                        aria-invalid={!!forgotErrors.email}
                        {...registerForgot("email")}
                      />
                      <FieldError errors={[forgotErrors.email]} />
                    </Field>

                    {authError && (
                      <p role="alert" className="text-sm text-destructive">
                        {authError}
                      </p>
                    )}

                    <Field>
                      <Button type="submit" disabled={forgotSubmitting}>
                        {forgotSubmitting ? "Sending..." : "Send reset link"}
                      </Button>
                    </Field>
                  </>
                )}

                <button
                  type="button"
                  onClick={() => switchMode("login")}
                  className="self-start text-sm text-primary hover:cursor-pointer hover:underline"
                >
                  Back to login
                </button>
              </FieldGroup>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Authorized accounts only.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
