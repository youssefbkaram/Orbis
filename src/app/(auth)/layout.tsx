import { Suspense, type ReactNode } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/session";
import styles from "./AuthLayout.module.scss";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div aria-busy="true" className={styles.loading} />}>
      <AnonymousAuthPages>{children}</AnonymousAuthPages>
    </Suspense>
  );
}

async function AnonymousAuthPages({ children }: { children: ReactNode }) {
  const session = await getServerSession();

  if (session) {
    redirect("/tasks");
  }

  return <main className={styles.stage}>{children}</main>;
}