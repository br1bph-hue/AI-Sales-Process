"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const supabase = createSupabaseBrowserClient();
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    const emailRedirectTo = `${appUrl}/auth/callback?next=${encodeURIComponent(
      redirect
    )}`;

    const { error: sbError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo },
    });

    setSubmitting(false);
    if (sbError) {
      setError(sbError.message);
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="dsg-card p-8 text-center">
        <h2 className="dsg-section-header text-base">Check your email</h2>
        <p className="mt-3 text-sm text-dsg-gray-700">
          We sent a sign-in link to <span className="font-medium">{email}</span>.
          Open it from this browser to continue.
        </p>
        <button
          type="button"
          onClick={() => {
            setSent(false);
            setEmail("");
          }}
          className="mt-6 text-sm text-dsg-navy hover:underline"
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="dsg-card p-8 space-y-5">
      <div className="space-y-2">
        <Label htmlFor="email">Work email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
        />
      </div>
      {error && (
        <p className="text-sm text-dsg-red">{error}</p>
      )}
      <Button
        type="submit"
        block
        size="lg"
        disabled={!email || submitting}
      >
        {submitting ? "Sending link..." : "Send sign-in link"}
      </Button>
      <p className="text-xs text-dsg-gray-500">
        We don't use passwords. Each link expires in 60 minutes.
      </p>
    </form>
  );
}
