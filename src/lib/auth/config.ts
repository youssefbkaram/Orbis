import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";
import { authFeatures, env } from "../env";
import { db } from "../db/client";
import * as schema from "../db/schema";
import { sendAuthEmail } from "./mail";

const baseURL = env.BETTER_AUTH_URL ?? "http://localhost:3000";
const database = authFeatures.backendConfigured && db
  ? drizzleAdapter(db, {
      provider: "pg",
      schema,
      transaction: false,
    })
  : undefined;
const googleProvider =
  authFeatures.googleEnabled &&
  env.GOOGLE_CLIENT_ID &&
  env.GOOGLE_CLIENT_SECRET
    ? {
        google: {
          clientId: env.GOOGLE_CLIENT_ID,
          clientSecret: env.GOOGLE_CLIENT_SECRET,
        },
      }
    : undefined;

export const auth = betterAuth({
  ...(database ? { database } : {}),
  ...(env.BETTER_AUTH_SECRET ? { secret: env.BETTER_AUTH_SECRET } : {}),
  baseURL,
  trustedOrigins: [baseURL],
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  emailAndPassword: {
    enabled: authFeatures.emailPasswordEnabled,
    ...(authFeatures.emailPasswordEnabled
      ? {
          autoSignIn: !authFeatures.emailVerificationEnabled,
          requireEmailVerification: authFeatures.emailVerificationEnabled,
          minPasswordLength: 12,
          maxPasswordLength: 128,
          ...(authFeatures.passwordRecoveryEnabled
            ? {
                sendResetPassword: async ({
                  user,
                  url,
                }: {
                  user: { email: string };
                  url: string;
                }) =>
                  sendAuthEmail({
                    to: user.email,
                    subject: "Reset your Orbis password",
                    text: `Use this link to reset your Orbis password. The link expires in one hour:\n\n${url}\n\nIf you did not request this, you can ignore this email.`,
                    html: `<p>Use this link to reset your Orbis password. The link expires in one hour:</p><p><a href="${escapeHtml(url)}">Reset password</a></p><p>If you did not request this, you can ignore this email.</p>`,
                  }),
              }
            : {}),
        }
      : {}),
  },
  ...(authFeatures.emailVerificationEnabled
    ? {
        emailVerification: {
          sendOnSignUp: true,
          autoSignInAfterVerification: true,
          expiresIn: 60 * 60,
          sendVerificationEmail: async ({
            user,
            url,
          }: {
            user: { email: string };
            url: string;
          }) =>
            sendAuthEmail({
              to: user.email,
              subject: "Verify your Orbis email address",
              text: `Verify your email address to finish setting up Orbis. This link expires in one hour:\n\n${url}`,
              html: `<p>Verify your email address to finish setting up Orbis. This link expires in one hour:</p><p><a href="${escapeHtml(url)}">Verify email address</a></p>`,
            }),
        },
      }
    : {}),
  ...(googleProvider ? { socialProviders: googleProvider } : {}),
  rateLimit: {
    enabled: true,
    storage: authFeatures.backendConfigured ? "database" : "memory",
    window: 60,
    max: 100,
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/sign-up/email": { window: 300, max: 3 },
      "/request-password-reset": { window: 300, max: 3 },
      "/send-verification-email": { window: 300, max: 3 },
    },
  },
});

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[character] ?? character;
  });
}