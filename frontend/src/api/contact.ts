import type { APIRoute } from 'astro';
import { Resend } from 'resend';

const resend = new Resend(import.meta.env.RESEND_API_KEY);

export const POST: APIRoute = async ({ request }) => {
  const { name, email, topic, message } = await request.json();
  const { error } = await resend.emails.send({
    from: 'Sivan Site <onboarding@resend.dev>', // use sandbox now; swap to your verified domain later
    to: ['you@yourinbox.com'],
    replyTo: email,
    subject: `[Tutoring] ${topic ?? 'General'} — ${name}`,
    text: `From: ${name} <${email}>\n\n${message}`,
  });
  if (error) return new Response(JSON.stringify({ ok:false }), { status: 500 });
  return new Response(JSON.stringify({ ok:true }), { status: 200 });
};
