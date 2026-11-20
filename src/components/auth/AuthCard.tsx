import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./AuthCard.module.scss";

type AuthCardProps = {
  title: string;
  description: string;
  children: ReactNode;
  footerText: string;
  footerLinkText: string;
  footerHref: string;
};

export function AuthCard({
  title,
  description,
  children,
  footerText,
  footerLinkText,
  footerHref,
}: AuthCardProps) {
  return (
    <section aria-labelledby="auth-title" className={styles.card}>
      <Link aria-label="Orbis home" className={styles.brand} href="/">
        <span aria-hidden="true" className={styles.brandMark}>
          <span />
        </span>
        <span>Orbis</span>
      </Link>

      <div className={styles.heading}>
        <h1 id="auth-title">{title}</h1>
        <p>{description}</p>
      </div>

      {children}

      <p className={styles.footer}>
        {footerText}{" "}
        <Link href={footerHref}>{footerLinkText}</Link>
      </p>

      <div className={styles.securityNote}>
        <span aria-hidden="true" className={styles.securityDot} />
        Your account is protected with secure, encrypted authentication.
      </div>
    </section>
  );
}
