import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { getEnv } from '../config/env';

// Lazy initialization of transporter - only created when needed
let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: getEnv('SMTP_HOST', 'smtp.gmail.com'),
      port: parseInt(getEnv('SMTP_PORT', '587')),
      secure: getEnv('SMTP_SECURE', 'false') === 'true', // true for 465, false for other ports
      auth: {
        user: getEnv('SMTP_USER'),
        pass: getEnv('SMTP_PASS'),
      },
    });
  }
  return transporter;
}

interface SendVerificationEmailParams {
  email: string;
  fullName: string;
  verificationToken: string;
}

/**
 * Send email verification link to user
 */
export async function sendVerificationEmail({
  email,
  fullName,
  verificationToken,
}: SendVerificationEmailParams) {
  const webUrl = getEnv('WEB_URL', 'https://ai.itoq.ru');
  const verificationLink = `${webUrl}/verify-email?token=${verificationToken}`;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      text-align: center;
      border-radius: 10px 10px 0 0;
    }
    .content {
      background: #f9f9f9;
      padding: 30px;
      border-radius: 0 0 10px 10px;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 15px 30px;
      text-decoration: none;
      border-radius: 5px;
      margin: 20px 0;
      font-weight: bold;
    }
    .footer {
      margin-top: 30px;
      text-align: center;
      font-size: 12px;
      color: #666;
    }
    .warning {
      background: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 15px;
      margin: 20px 0;
      border-radius: 5px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>AI Chat Platform</h1>
    <p>Подтверждение email адреса</p>
  </div>
  <div class="content">
    <p>Здравствуйте, ${fullName || 'пользователь'}!</p>

    <p>Спасибо за регистрацию на AI Chat Platform. Для завершения регистрации подтвердите ваш email адрес.</p>

    <center>
      <a href="${verificationLink}" class="button">Подтвердить email</a>
    </center>

    <p>Или скопируйте эту ссылку в браузер:</p>
    <p style="word-break: break-all; background: white; padding: 10px; border-radius: 5px;">
      ${verificationLink}
    </p>

    <div class="warning">
      <strong>⚠️ Важно:</strong> Ссылка действительна в течение 24 часов.
    </div>

    <p>Если вы не регистрировались на нашей платформе, просто проигнорируйте это письмо.</p>
  </div>
  <div class="footer">
    <p>© 2026 AI Chat Platform. Все права защищены.</p>
    <p>ИП Иванов Иван Иванович, ИНН: 1234567890</p>
  </div>
</body>
</html>
  `;

  const textContent = `
Здравствуйте, ${fullName || 'пользователь'}!

Спасибо за регистрацию на AI Chat Platform. Для завершения регистрации подтвердите ваш email адрес.

Перейдите по ссылке для подтверждения:
${verificationLink}

⚠️ Важно: Ссылка действительна в течение 24 часов.

Если вы не регистрировались на нашей платформе, просто проигнорируйте это письмо.

---
© 2026 AI Chat Platform. Все права защищены.
ИП Иванов Иван Иванович, ИНН: 1234567890
  `;

  await getTransporter().sendMail({
    from: `"AI Chat Platform" <${getEnv('SMTP_FROM', getEnv('SMTP_USER'))}>`,
    to: email,
    subject: 'Подтвердите ваш email - AI Chat Platform',
    text: textContent,
    html: htmlContent,
  });

  console.log(`[Email] Verification email sent to: ${email}`);
}

/**
 * Generate random verification token
 */
export function generateVerificationToken(): string {
  return Array.from({ length: 32 }, () =>
    Math.random().toString(36).charAt(2)
  ).join('');
}

/**
 * Get verification token expiration date (24 hours from now)
 */
export function getVerificationExpires(): Date {
  const expires = new Date();
  expires.setHours(expires.getHours() + 24);
  return expires;
}
