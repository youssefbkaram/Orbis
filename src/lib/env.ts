import { z } from "zod";

const optionalString = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().trim().min(1).optional(),
);

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    DATABASE_URL: optionalString.pipe(z.url().optional()),
    BETTER_AUTH_SECRET: optionalString.pipe(z.string().min(32).optional()),
    BETTER_AUTH_URL: optionalString.pipe(z.url().optional()),
    GOOGLE_CLIENT_ID: optionalString,
    GOOGLE_CLIENT_SECRET: optionalString,
    SMTP_HOST: optionalString,
    SMTP_PORT: z.preprocess(
      (value) => (value === "" || value === undefined ? undefined : value),
      z.coerce.number().int().min(1).max(65535).optional(),
    ),
    SMTP_USER: optionalString,
    SMTP_PASSWORD: optionalString,
    SMTP_FROM: optionalString.pipe(z.email().optional()),
  })
  .superRefine((value, context) => {
    if (value.NODE_ENV === "production") {
      for (const key of ["DATABASE_URL", "BETTER_AUTH_SECRET", "BETTER_AUTH_URL"] as const) {
        if (!value[key]) {
          context.addIssue({
            code: "custom",
            message: `${key} is required in production.`,
            path: [key],
          });
        }
      }
    }

    if (Boolean(value.GOOGLE_CLIENT_ID) !== Boolean(value.GOOGLE_CLIENT_SECRET)) {
      context.addIssue({
        code: "custom",
        message: "GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set together.",
      });
    }

    const smtpValues = [
      value.SMTP_HOST,
      value.SMTP_PORT,
      value.SMTP_USER,
      value.SMTP_PASSWORD,
      value.SMTP_FROM,
    ];
    const configuredSmtpValues = smtpValues.filter(Boolean).length;

    if (configuredSmtpValues > 0 && configuredSmtpValues !== smtpValues.length) {
      context.addIssue({
        code: "custom",
        message:
          "Configure SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, and SMTP_FROM together.",
      });
    }
  });

export const env = envSchema.parse(process.env);

const smtpEnabled = Boolean(
  env.SMTP_HOST &&
    env.SMTP_PORT &&
    env.SMTP_USER &&
    env.SMTP_PASSWORD &&
    env.SMTP_FROM,
);

export const authFeatures = {
  backendConfigured: Boolean(env.DATABASE_URL && env.BETTER_AUTH_SECRET),
  googleEnabled: Boolean(
    env.DATABASE_URL &&
      env.BETTER_AUTH_SECRET &&
      env.GOOGLE_CLIENT_ID &&
      env.GOOGLE_CLIENT_SECRET,
  ),
  emailPasswordEnabled: Boolean(env.DATABASE_URL && env.BETTER_AUTH_SECRET),
  emailVerificationEnabled: Boolean(
    env.DATABASE_URL && env.BETTER_AUTH_SECRET && smtpEnabled,
  ),
  passwordRecoveryEnabled: Boolean(
    env.DATABASE_URL && env.BETTER_AUTH_SECRET && smtpEnabled,
  ),
};
