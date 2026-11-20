"use client";

import { z } from "zod";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { authClient } from "@/lib/auth/client";
import { AuthNotice } from "./AuthNotice";
import styles from "./RecoveryForm.module.scss";

const emailSchema = z.email();
const passwordSchema = z.string().min(12).max(128);

export function RequestResetForm() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    const formData = new FormData(event.currentTarget);
    const email = emailSchema.safeParse(formData.get("email"));

    if (!email.success) {
      setError("Enter a valid email address.");
      return;
    }

    setPending(true);
    try {
      const result = await authClient.requestPasswordReset({
        email: email.data,
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (result.error) {
        setError("We couldn’t send the reset email. Please try again later.");
      } else {
        setNotice(
          "If an account exists for that email, a password reset link is on its way.",
        );
      }
    } catch {
      setError("We couldn’t send the reset email. Please try again later.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className={styles.area}>
      {error && <AuthNotice kind="error">{error}</AuthNotice>}
      {notice && <AuthNotice kind="success">{notice}</AuthNotice>}
      <form className={styles.form} onSubmit={handleSubmit}>
        <label className={styles.field}>
          <span>Email address</span>
          <input
            autoComplete="email"
            maxLength={254}
            name="email"
            placeholder="you@example.com"
            required
            type="email"
          />
        </label>
        <button className={styles.submitButton} disabled={pending} type="submit">
          {pending ? "Sending reset link…" : "Send reset link"}
        </button>
      </form>
    </div>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    const formData = new FormData(event.currentTarget);
    const password = passwordSchema.safeParse(formData.get("password"));
    const confirmation = formData.get("confirmPassword");

    if (!password.success) {
      setError("Choose a password between 12 and 128 characters.");
      return;
    }
    if (password.data !== confirmation) {
      setError("The passwords don’t match.");
      return;
    }
    if (!token) {
      setError("This reset link is invalid or has expired. Request a new one.");
      return;
    }

    setPending(true);
    try {
      const result = await authClient.resetPassword({
        newPassword: password.data,
        token,
      });

      if (result.error) {
        setError("This reset link is invalid or has expired. Request a new one.");
      } else {
        setNotice("Your password has been updated. Redirecting to sign in…");
        window.setTimeout(() => router.replace("/sign-in"), 900);
      }
    } catch {
      setError("We couldn’t update your password. Please request a new link.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className={styles.area}>
      {error && <AuthNotice kind="error">{error}</AuthNotice>}
      {notice && <AuthNotice kind="success">{notice}</AuthNotice>}
      <form className={styles.form} onSubmit={handleSubmit}>
        <label className={styles.field}>
          <span>New password</span>
          <input
            autoComplete="new-password"
            maxLength={128}
            minLength={12}
            name="password"
            placeholder="At least 12 characters"
            required
            type="password"
          />
        </label>
        <label className={styles.field}>
          <span>Confirm new password</span>
          <input
            autoComplete="new-password"
            maxLength={128}
            minLength={12}
            name="confirmPassword"
            placeholder="Enter your password again"
            required
            type="password"
          />
        </label>
        <button className={styles.submitButton} disabled={pending} type="submit">
          {pending ? "Updating password…" : "Update password"}
        </button>
      </form>
    </div>
  );
}
