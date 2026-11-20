import { AuthCard } from "@/components/auth/AuthCard";
import { AuthForm } from "@/components/auth/AuthForm";
import { authFeatures } from "@/lib/env";

export default function SignUpPage() {
  return (
    <AuthCard
      description="Create an account to start organizing what matters."
      footerHref="/sign-in"
      footerLinkText="Sign in"
      footerText="Already have an account?"
      title="Create your account"
    >
      <AuthForm
        emailEnabled={authFeatures.emailPasswordEnabled}
        emailVerificationEnabled={authFeatures.emailVerificationEnabled}
        googleEnabled={authFeatures.googleEnabled}
        mode="sign-up"
      />
    </AuthCard>
  );
}
