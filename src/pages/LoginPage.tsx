import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthField, AuthShell } from "@/components/plotra/auth-shell";
import { ApiError, login, saveSession } from "@/lib/plotra-api";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to manage your listings, leads and team."
      footer={
        <p className="text-xs">
          Plotra accounts are invite and admin-approval only.{" "}
          <Link to="/request-access" className="font-semibold text-primary">
            Request access
          </Link>
        </p>
      }
    >
      <form
        className="space-y-5"
        onSubmit={async (e) => {
          e.preventDefault();
          const form = new FormData(e.currentTarget);
          const email = String(form.get("email") ?? "");
          const password = String(form.get("password") ?? "");

          setError("");
          setLoading(true);
          try {
            const { token, user } = await login(email, password);
            saveSession(token, user);
            navigate(user.role === "super_admin" ? "/admin" : "/dashboard");
          } catch (err) {
            const message =
              err instanceof ApiError ? err.message : "Could not reach Plotra. Try again.";
            setError(message);
          } finally {
            setLoading(false);
          }
        }}
      >
        <AuthField name="email" label="Email" type="email" required placeholder="you@business.in" />
        <AuthField
          name="password"
          label="Password"
          type="password"
          required
          placeholder="••••••••"
        />
        {error ? <p className="text-xs font-medium text-destructive">{error}</p> : null}
        <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
          {loading ? "Signing in…" : "Sign In"} <ArrowRight />
        </Button>
        <div className="text-center">
          <Link
            to="/forgot-password"
            className="text-xs font-medium text-ink-foreground/60 transition-colors hover:text-primary"
          >
            Forgot password?
          </Link>
        </div>
      </form>
    </AuthShell>
  );
}
