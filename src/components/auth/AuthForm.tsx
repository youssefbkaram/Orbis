"use client";

import Link from "next/link";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { authClient } from "@/lib/auth/client";
import { AuthNotice } from "./AuthNotice";
import styles from "./AuthForm.module.scss";

type AuthMode = "sign-in" | "sign-up";

type AuthFormProps = {
  mode: AuthMode;
  emailEnabled: boolean;
  emailVerificationEnabled: boolean;
  googleEnabled: boolean;
};

const emailSchema = z.email();
const passwordSchema = z.string().min(12).max(128);
const nameSchema = z.string().trim().min(2).max(80);

export function AuthForm({
  mode,
  emailEnabled,
  emailVerificationEnabled,
  googleEnabled,
}: AuthFormProps) {
  const router = useRouter();
  const isSignUp = mode === "sign-up";
  const [pending, setPending] = useState(false);
  const [googlePending, setGooglePending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [unverifiedEmail, setUnverifiedEmail] = useState("");
  const [resending, setResending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    setUnverifiedEmail("");

    const formData = new FormData(event.currentTarget);
    const email = emailSchema.safeParse(formData.get("email"));
    const password = passwordSchema.safeParse(formData.get("password"));
    const name = isSignUp
      ? nameSchema.safeParse(formData.get("name"))
      : undefined;

    if (!email.success || !password.success || (name && !name.success)) {
      setError(
        name && !name.success
          ? "Enter a name between 2 and 80 characters."
          : !email.success
            ? "Enter a valid email address."
            : "Your password must be between 12 and 128 characters.",
      );
      return;
    }

    setPending(true);
    try {
      if (isSignUp && name?.success) {
        const result = await authClient.signUp.email({
          name: name.data,
          email: email.data,
          password: password.data,
          callbackURL: emailVerificationEnabled ? "/verify-email" : "/tasks",
        });

        if (result.error) {
          setError(messageForAuthError(result.error.message));
        } else if (emailVerificationEnabled) {
          setNotice("Check your inbox for a link to verify your email address.");
        } else {
          router.replace("/tasks");
          router.refresh();
        }
      } else {
        const result = await authClient.signIn.email({
          email: email.data,
          password: password.data,
          rememberMe: formData.get("rememberMe") === "on",
          callbackURL: "/tasks",
        });

        if (result.error) {
          setError(messageForAuthError(result.error.message));
          if (result.error.status === 403) setUnverifiedEmail(email.data);
        } else {
          router.replace("/tasks");
          router.refresh();
        }
      }
    } catch {
      setError("We couldn’t complete that request. Please try again.");
    } finally {
      setPending(false);
    }
  }

  async function handleGoogleSignIn() {
    setError("");
    setGooglePending(true);
    try {
      const result = await authClient.signIn.social({
        provider: "google",
        callbackURL: "/tasks",
      });

      if (result.error) {
        setError(messageForAuthError(result.error.message));
        setGooglePending(false);
      }
    } catch {
      setError("Google sign-in is unavailable right now. Please try again.");
      setGooglePending(false);
    }
  }

  async function resendVerificationEmail() {
    setError("");
    setNotice("");
    setResending(true);

    try {
      const result = await authClient.sendVerificationEmail({
        email: unverifiedEmail,
        callbackURL: "/verify-email",
      });

      if (result.error) {
        setError(messageForAuthError(result.error.message));
      } else {
        setNotice("If the account needs verification, a new link is on its way.");
      }
    } catch {
      setError("We couldn’t send a verification link. Please try again.");
    } finally {
      setResending(false);
    }
  }

  return (
    <div className={styles.formArea}>
      {error && <AuthNotice kind="error">{error}</AuthNotice>}
      {notice && <AuthNotice kind="success">{notice}</AuthNotice>}

      {emailEnabled && (
        <>
          <form className={styles.form} onSubmit={handleSubmit}>
            {isSignUp && (
              <label className={styles.field}>
                <span>Full name</span>
                <input
                  autoComplete="name"
                  maxLength={80}
                  name="name"
                  placeholder="Your name"
                  required
                />
              </label>
            )}

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

            <label className={styles.field}>
              <span>Password</span>
              <input
                autoComplete={isSignUp ? "new-password" : "current-password"}
                maxLength={128}
                minLength={12}
                name="password"
                placeholder={isSignUp ? "At least 12 characters" : "Your password"}
                required
                type="password"
              />
            </label>

            {!isSignUp && (
              <div className={styles.formOptions}>
                <label className={styles.remember}>
                  <input defaultChecked name="rememberMe" type="checkbox" />
                  <span>Keep me signed in</span>
                </label>
                <Link href="/forgot-password">Forgot password?</Link>
              </div>
            )}

            <button className={styles.submitButton} disabled={pending} type="submit">
              {pending
                ? isSignUp
                  ? "Creating your account…"
                  : "Signing in…"
                : isSignUp
                  ? "Create account"
                  : "Sign in"}
            </button>
          </form>

          {unverifiedEmail && (
            <button
              className={styles.textButton}
              disabled={resending}
              onClick={resendVerificationEmail}
              type="button"
            >
              {resending ? "Sending verification email…" : "Resend verification email"}
            </button>
          )}
        </>
      )}

      {emailEnabled && googleEnabled && (
        <div aria-hidden="true" className={styles.divider}>
          <span>or continue with</span>
        </div>
      )}

      {googleEnabled && (
        <button
          className={styles.googleButton}
          disabled={googlePending}
          onClick={handleGoogleSignIn}
          type="button"
        >
          <GoogleMark />
          {googlePending ? "Connecting to Google…" : "Continue with Google"}
        </button>
      )}

      {!emailEnabled && !googleEnabled && (
        <AuthNotice kind="info">
          Authentication isn’t configured yet. Add your Neon database URL and
          Better Auth secret to your local environment file.
        </AuthNotice>
      )}

      {isSignUp && emailEnabled && !emailVerificationEnabled && (
        <p className={styles.providerHint}>
          Email verification and password recovery require email delivery
          settings. Accounts can be created and used without them for now.
        </p>
      )}

      {emailEnabled && !googleEnabled && (
        <p className={styles.providerHint}>
          Google sign-in will appear once its OAuth credentials are configured.
        </p>
      )}
      {!emailEnabled && googleEnabled && (
        <p className={styles.providerHint}>
          Email sign-in will appear once SMTP email delivery is configured.
        </p>
      )}
    </div>
  );
}

function messageForAuthError(message: string | undefined) {
  if (!message) return "We couldn’t complete that request. Please try again.";
  if (/invalid email or password/i.test(message)) {
    return "The email or password is incorrect.";
  }
  if (/email not verified/i.test(message)) {
    return "Please verify your email address before signing in.";
  }
  if (/rate.?limit/i.test(message)) {
    return "Too many attempts. Please wait a moment and try again.";
  }

  return message || "We couldn’t complete that request. Please try again.";
}

function GoogleMark() {
  return (
    <svg aria-hidden="true" className={styles.googleMark} viewBox="0 0 48 48">
      <path
        fill="#4285F4"
        d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5.1h6.6c3.9-3.6 6.1-8.8 6.1-15Z"
      />
      <path
        fill="#34A853"
        d="M24 44c5.5 0 10.1-1.8 13.5-4.8l-6.6-5.1c-1.8 1.2-4.1 2-6.9 2-5.3 0-9.8-3.6-11.4-8.4H5.8v5.3A20 20 0 0 0 24 44Z"
      />
      <path
        fill="#FBBC05"
        d="M12.6 27.7a12 12 0 0 1 0-7.4V15H5.8a20 20 0 0 0 0 18l6.8-5.3Z"
      />
      <path
        fill="#EA4335"
        d="M24 11.9c3 0 5.6 1 7.7 3l5.8-5.8A19.3 19.3 0 0 0 24 4 20 20 0 0 0 5.8 15l6.8 5.3c1.6-4.8 6.1-8.4 11.4-8.4Z"
      />
    </svg>
  );
}
