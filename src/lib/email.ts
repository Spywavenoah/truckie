import { prisma } from "./prisma";
import nodemailer from "nodemailer";

let smtpTransporter: nodemailer.Transporter | null = null;
let lastSettingsId: string | null = null;
let lastFromName: string | null = null;
let lastFromEmail: string | null = null;

async function getSmtpTransporter() {
  const settings = await prisma.smtpSettings.findFirst({ where: { isActive: true } });

  if (!settings) return null;

  if (lastSettingsId === settings.id && smtpTransporter) return smtpTransporter;

  smtpTransporter = nodemailer.createTransport({
    host: settings.host,
    port: settings.port,
    secure: settings.secure,
    auth: { user: settings.username, pass: settings.password },
  });

  lastSettingsId = settings.id;
  lastFromName = settings.fromName;
  lastFromEmail = settings.fromEmail;
  return smtpTransporter;
}

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
}) {
  const transporter = await getSmtpTransporter();

  if (transporter) {
    try {
      await transporter.sendMail({
        from: lastFromName
          ? `"${lastFromName}" <${lastFromEmail}>`
          : lastFromEmail || "noreply@truckleasepro.com",
        to: params.to,
        subject: params.subject,
        html: params.html,
      });
      return;
    } catch (error) {
      console.error("SMTP send failed, falling back to SendGrid:", error);
    }
  }

  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    console.warn("SENDGRID_API_KEY not set — skipping email to", params.to);
    return;
  }

  const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: params.to }] }],
      from: { email: process.env.EMAIL_FROM || "noreply@truckleasepro.com", name: "TruckLease Pro" },
      subject: params.subject,
      content: [{ type: "text/html", value: params.html }],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("SendGrid error:", res.status, text);
  }
}

export function verificationEmailHtml(otp: string, email: string, baseUrl: string): string {
  const verifyUrl = `${baseUrl}/auth/verify-email?email=${encodeURIComponent(email)}&otp=${otp}`;
  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h2 style="color:#002366">Verify Your Email</h2>
      <p>Click the button below to verify your email address:</p>
      <div style="text-align:center;margin:24px 0">
        <a href="${verifyUrl}" style="display:inline-block;padding:14px 40px;background:#CC0000;color:#fff;text-decoration:none;border-radius:6px;font-size:16px;font-weight:700">Verify Email</a>
      </div>
      <p style="color:#666;font-size:14px">Or enter this verification code:</p>
      <div style="font-size:32px;font-weight:700;letter-spacing:8px;color:#CC0000;text-align:center;padding:16px;background:#f5f5f5;border-radius:8px">${otp}</div>
      <p style="color:#666;font-size:14px">This code/link expires in 10 minutes.</p>
      <hr style="border:none;border-top:1px solid #eee"/>
      <p style="color:#999;font-size:12px">TruckLease Pro — Nigeria's trusted truck & equipment leasing platform</p>
    </div>
  `;
}

export function resetPasswordEmailHtml(resetUrl: string): string {
  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h2 style="color:#002366">Reset Your Password</h2>
      <p>Click the button below to reset your password. This link expires in 1 hour.</p>
      <a href="${resetUrl}" style="display:inline-block;padding:12px 32px;background:#CC0000;color:#fff;text-decoration:none;border-radius:6px;font-size:16px">Reset Password</a>
      <p style="color:#666;font-size:14px;margin-top:16px">If you didn't request this, please ignore this email.</p>
      <hr style="border:none;border-top:1px solid #eee"/>
      <p style="color:#999;font-size:12px">TruckLease Pro</p>
    </div>
  `;
}

export function bookingNotificationHtml(params: {
  recipientName: string;
  action: string;
  assetTitle: string;
  bookingId: string;
  dashboardUrl: string;
}): string {
  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h2 style="color:#002366">Hello ${params.recipientName}</h2>
      <p>${params.action}</p>
      <p><strong>Asset:</strong> ${params.assetTitle}<br/>
         <strong>Booking Ref:</strong> #${params.bookingId.substring(0, 8)}</p>
      <a href="${params.dashboardUrl}" style="display:inline-block;padding:12px 32px;background:#CC0000;color:#fff;text-decoration:none;border-radius:6px">View Dashboard</a>
      <hr style="border:none;border-top:1px solid #eee"/>
      <p style="color:#999;font-size:12px">TruckLease Pro</p>
    </div>
  `;
}
