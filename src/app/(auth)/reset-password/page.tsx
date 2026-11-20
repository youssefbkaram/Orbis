import { Suspense } from "react";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthNotice } from "@/components/auth/AuthNotice";
import { ResetPasswordForm } from "@/components/auth/RecoveryForm";
import { authFeatures } from "@/lib/env";

export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  return (
    <Suspense fallback={<div aria-busy="true" className="min-h-40" />}>
      <ResetPasswordContent searchParams={searchParams} />
    </Suspense>
  );
}

async function ResetPasswordContent({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const { token } = await searchParams;

  return (
    <AuthCard
      description="Choose a new password for your Orbis account."
      footerHref="/sign-in"
      footerLinkText="Back to sign in"
      footerText="Changed your mind?"
      title="Set a new password"
    >
      {authFeatures.passwordRecoveryEnabled ? (
        <ResetPasswordForm token={typeof token === "string" ? token : ""} />
      ) : (
        <AuthNotice kind="info">
          Password recovery requires email/password sign-in and SMTP delivery to
          be configured for this workspace.
        </AuthNotice>
      )}
    </AuthCard>
  );
}
