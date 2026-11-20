import nodemailer from "nodemailer";
import { env } from "../env";

type AuthEmail = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

const transporter =
  env.SMTP_HOST &&
  env.SMTP_PORT &&
  env.SMTP_USER &&
  env.SMTP_PASSWORD
    ? nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_PORT === 465,
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASSWORD,
        },
      })
    : undefined;

export async function sendAuthEmail({ to, subject, text, html }: AuthEmail) {
  if (!transporter || !env.SMTP_FROM) {
    throw new Error(
      "Email delivery is not configured. Set all SMTP_* environment variables.",
    );
  }

  await transporter.sendMail({
    from: env.SMTP_FROM,
    to,
    subject,
    text,
    html,
  });
}
