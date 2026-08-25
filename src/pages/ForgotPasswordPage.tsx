import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthField, AuthShell } from "@/components/plotra/auth-shell";
import { ApiError, forgotPassword, resetPassword } from "@/lib/plotra-api";

type Stage = "request" | "sent" | "reset" | "done";

export default function ForgotPasswordPage() {
  const [searchParams] = useSearchParams();
  const tokenFromLink = searchParams.get("token") ?? undefined;
  const [stage, setStage] = useState<Stage>(tokenFromLink ? "reset" : "request");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  return (
    <AuthShell
      title={stage === "reset" ? "Choose a new password" : "Password recovery"}
      subtitle={
        stage === "reset"
          ? "Minimum 8 characters. Use something you don't reuse elsewhere."
          : "We'll email you a secure reset link."
      }
      footer={
        <Link to="/login" className="text-xs font-semibold text-primary">
          ← Back to login
        </Link>
      }
    >
      {stage === "request" ? (
        <form
          className="space-y-5"
          onSubmit={async (e) => {
            e.preventDefault();
            const form = new FormData(e.currentTarget);
            const email = String(form.get("email") ?? "");
            setSubmitting(true);
            try {
              await forgotPassword(email);
            } catch {
              // Intentionally silent — endpoint responds same regardless of whether account exists
            } finally {
              setSubmitting(false);
              setStage("sent");
            }
          }}
        >
          <AuthField
            name="email"
            label="Email"
            type="email"
            required
            placeholder="you@business.in"
          />
          <Button type="submit" variant="hero" size="lg" className="w-full" disabled={submitting}>
            {submitting ? "Sending…" : "Send reset link"} <ArrowRight />
          </Button>
        </form>
      ) : null}

      {stage === "sent" ? (
        <div className="space-y-5">
          <p className="rounded-xl border border-accent/30 bg-accent/10 p-4 text-sm text-ink-foreground/85">
            If an account exists, a password reset link has been sent. Open it to continue.
          </p>
        </div>
      ) : null}

      {stage === "reset" ? (
        <form
          className="space-y-5"
          onSubmit={async (e) => {
            e.preventDefault();
            if (password.length < 8) return setError("Password must be at least 8 characters.");
            if (password !== confirm) return setError("Passwords do not match.");
            if (!tokenFromLink)
              return setError("This reset link is missing its token. Request a new one.");

            setError("");
            setSubmitting(true);
            try {
              await resetPassword(tokenFromLink, password);
              setStage("done");
            } catch (err) {
              const message =
                err instanceof ApiError ? err.message : "Could not reset your password. Try again.";
              setError(message);
            } finally {
              setSubmitting(false);
            }
          }}
        >
          <AuthField
            label="New password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <AuthField
            label="Confirm password"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
          {error ? <p className="text-xs font-medium text-destructive">{error}</p> : null}
          <Button type="submit" variant="hero" size="lg" className="w-full" disabled={submitting}>
            {submitting ? "Updating…" : "Update password"} <ArrowRight />
          </Button>
        </form>
      ) : null}

      {stage === "done" ? (
        <div className="space-y-5 text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-full bg-accent/20 text-accent">
            <Check className="size-6" />
          </span>
          <p className="text-sm text-ink-foreground/80">
            Your password has been updated. You can sign in now.
          </p>
          <Button asChild variant="hero" size="lg" className="w-full">
            <Link to="/login">Back to login</Link>
          </Button>
        </div>
      ) : null}
    </AuthShell>
  );
}
