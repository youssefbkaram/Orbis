import { Suspense, type ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell/AppShell";
import { getServerSession } from "@/lib/auth/session";

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div aria-busy="true" className="min-h-screen bg-background" />}>
      <ProtectedWorkspace>{children}</ProtectedWorkspace>
    </Suspense>
  );
}

async function ProtectedWorkspace({ children }: { children: ReactNode }) {
  const session = await getServerSession();

  if (!session) {
    redirect("/sign-in");
  }

  return <AppShell user={session.user}>{children}</AppShell>;
}