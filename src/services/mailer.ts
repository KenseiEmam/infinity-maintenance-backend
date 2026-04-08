import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail({
  to,
  subject,
  text,
  html,
  replyTo,
}: {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  replyTo?: string;
}) {
  const payload: any = {
    from: 'Infinity Medical Kuwait <onboarding@resend.dev>',
    to: [to],
    subject,
  };

  if (text) payload.text = text;
  if (html) payload.html = html;
  if (replyTo) payload.replyTo = replyTo;

  const { data, error } = await resend.emails.send(payload);

  if (error) throw error;

  return data;
}