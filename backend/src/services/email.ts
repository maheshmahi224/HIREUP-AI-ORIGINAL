import { env } from '../config/env.js';

interface SendMailParams {
  to: string;
  subject: string;
  html: string;
  text: string;
}

async function sendMail({ to, subject, html, text }: SendMailParams) {
  console.log(`\n======================================================`);
  console.log(`📧 [EMAIL OUTBOX] To: ${to}`);
  console.log(`📧 [EMAIL OUTBOX] Subject: ${subject}`);
  console.log(`📧 [EMAIL OUTBOX] Body: ${text}`);
  console.log(`======================================================\n`);

  if (env.RESEND_API_KEY && env.EMAIL_FROM) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: env.EMAIL_FROM,
          to: [to],
          subject,
          html,
          text,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Email Service] Resend API error:', errorText);
      }
    } catch (err) {
      console.error('[Email Service] Failed to send email via Resend:', err);
    }
  }
}

export async function sendOtpEmail(email: string, code: string) {
  const subject = `🔑 Your HireUp AI Verification Code: ${code}`;
  const text = `Your HireUp AI verification code is ${code}. It expires in 10 minutes.`;
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 24px; background-color: #FAFAFA; border-radius: 12px;">
      <h2 style="color: #FF2D55; margin-top: 0;">HireUp AI Verification Code</h2>
      <p style="font-size: 15px; color: #374151;">Use the verification code below to complete your action on HireUp AI:</p>
      <div style="background: #FFFFFF; border: 2px solid #FF2D55; padding: 18px; border-radius: 10px; text-align: center; margin: 20px 0;">
        <span style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #FF2D55;">${code}</span>
      </div>
      <p style="font-size: 13px; color: #6B7280;">This code is valid for 10 minutes. Please do not share this code with anyone.</p>
    </div>
  `;
  await sendMail({ to: email, subject, html, text });
}

export async function sendTicketCreatedEmail(to: string, userName: string, ticketId: string, subject: string) {
  const mailSubject = `🎟️ Support Ticket Created: #${ticketId}`;
  const text = `Hello ${userName}, your support ticket #${ticketId} ("${subject}") has been received. Our team will review and resolve it shortly.`;
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 24px; background-color: #FAFAFA; border-radius: 12px;">
      <h2 style="color: #FF2D55; margin-top: 0;">Support Ticket Received #${ticketId}</h2>
      <p style="font-size: 15px; color: #374151;">Hello <strong>${userName}</strong>,</p>
      <p style="font-size: 14px; color: #4B5563;">We have received your support request for <strong>"${subject}"</strong>.</p>
      <div style="background: #ECFDF5; border: 1.5px solid #A7F3D0; padding: 14px; border-radius: 8px; margin: 16px 0; color: #065F46;">
        <strong>Ticket Status: OPEN</strong><br />
        <span>Ticket ID: <strong>#${ticketId}</strong></span>
      </div>
      <p style="font-size: 13px; color: #6B7280;">Our Admin Support team is actively inspecting your request and will notify you as soon as it is resolved.</p>
    </div>
  `;
  await sendMail({ to, subject: mailSubject, html, text });
}

export async function sendTicketResolvedEmail(to: string, userName: string, ticketId: string, subject: string, adminNotes?: string) {
  const mailSubject = `✅ Support Ticket Resolved: #${ticketId}`;
  const text = `Hello ${userName}, your support ticket #${ticketId} ("${subject}") has been marked as RESOLVED.${adminNotes ? ` Admin Note: ${adminNotes}` : ''}`;
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 24px; background-color: #FAFAFA; border-radius: 12px;">
      <h2 style="color: #059669; margin-top: 0;">Support Ticket Resolved #${ticketId}</h2>
      <p style="font-size: 15px; color: #374151;">Hello <strong>${userName}</strong>,</p>
      <p style="font-size: 14px; color: #4B5563;">Your support ticket regarding <strong>"${subject}"</strong> has been resolved by our Admin team.</p>
      
      <div style="background: #D1FAE5; border: 1.5px solid #6EE7B7; padding: 14px; border-radius: 8px; margin: 16px 0; color: #065F46;">
        <strong>Status: RESOLVED ✓</strong><br />
        <span>Ticket ID: <strong>#${ticketId}</strong></span>
      </div>

      ${adminNotes ? `
        <div style="background: #FFFFFF; border-left: 4px solid #FF2D55; padding: 12px 16px; margin: 16px 0; border-radius: 4px;">
          <small style="color: #FF2D55; font-weight: 800;">ADMIN NOTE:</small>
          <p style="margin: 4px 0 0; font-size: 14px; color: #111827;">${adminNotes}</p>
        </div>
      ` : ''}

      <p style="font-size: 13px; color: #6B7280;">Thank you for using HireUp AI! If you need further assistance, you can reply directly in our Support Portal.</p>
    </div>
  `;
  await sendMail({ to, subject: mailSubject, html, text });
}
