import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL as string,
    to,
    subject: "Reset your JobTrace password",
    html: `<p>You requested a password reset. Click the link below to set a new password:</p>
<p><a href="${resetUrl}">${resetUrl}</a></p>
<p>This link expires in 1 hour. If you didn't request this, you can ignore this email.</p>`,
  });
}
