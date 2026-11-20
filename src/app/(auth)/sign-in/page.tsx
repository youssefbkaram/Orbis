import { AuthCard } from "@/components/auth/AuthCard";
import { AuthForm } from "@/components/auth/AuthForm";
import { authFeatures } from "@/lib/env";

export default function SignInPage() {
  return (
    <AuthCard
      description="Welcome back. Sign in to continue to your workspace."
      footerHref="/sign-up"
      footerLinkText="Create an account"
      footerText="New to Orbis?"
      title="Sign in to Orbis"
    >
      <AuthForm
        emailEnabled={authFeatures.emailPasswordEnabled}
        emailVerificationEnabled={authFeatures.emailVerificationEnabled}
        googleEnabled={authFeatures.googleEnabled}
        mode="sign-in"
      />
    </AuthCard>
  );
}
