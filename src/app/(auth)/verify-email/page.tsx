import { AuthCard } from "@/components/auth/AuthCard";
import { AuthNotice } from "@/components/auth/AuthNotice";
import { authFeatures } from "@/lib/env";

export default function VerifyEmailPage() {
  return (
    <AuthCard
      description="Open the verification link we sent you to finish setting up your account."
      footerHref="/sign-in"
      footerLinkText="Return to sign in"
      footerText="Already verified?"
      title="Check your email"
    >
      {authFeatures.emailVerificationEnabled ? (
        <AuthNotice kind="info">
          Verification links expire after one hour. If you can’t find the
          message, return to sign in and request a new verification email.
        </AuthNotice>
      ) : (
        <AuthNotice kind="info">
          Email verification is only available after SMTP delivery is configured
          for this workspace.
        </AuthNotice>
      )}
    </AuthCard>
  );
}
