import { AuthCard } from "@/components/auth/AuthCard";
import { AuthNotice } from "@/components/auth/AuthNotice";
import { RequestResetForm } from "@/components/auth/RecoveryForm";
import { authFeatures } from "@/lib/env";

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      description="We’ll send a secure link to the email address on your account."
      footerHref="/sign-in"
      footerLinkText="Back to sign in"
      footerText="Remember your password?"
      title="Reset your password"
    >
      {authFeatures.passwordRecoveryEnabled ? (
        <RequestResetForm />
      ) : (
        <AuthNotice kind="info">
          Password recovery requires email/password sign-in and SMTP delivery to
          be configured for this workspace.
        </AuthNotice>
      )}
    </AuthCard>
  );
}
