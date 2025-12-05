import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

// SMTP Configuration
const SMTP_CONFIG = {
  host: (process.env.SMTP_HOST || 'smtp.office365.com').trim(), // Remove any whitespace
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // Use STARTTLS
  requireTLS: true, // Force TLS encryption
  auth: {
    user: (process.env.SMTP_USER || 'hello@linkist.ai').trim(),
    pass: (process.env.SMTP_PASS || '').trim(),
  },
  tls: {
    rejectUnauthorized: true, // Verify SSL certificate
    minVersion: 'TLSv1.2' // Microsoft 365 requires TLS 1.2+
  },
  connectionTimeout: 10000, // 10 seconds
  greetingTimeout: 5000, // 5 seconds
  socketTimeout: 10000, // 10 seconds
  dnsTimeout: 5000 // 5 seconds for DNS lookup
};

const EMAIL_CONFIG = {
  from: process.env.EMAIL_FROM ?
    (process.env.EMAIL_FROM.includes('<') ? process.env.EMAIL_FROM : `Linkist NFC <${process.env.EMAIL_FROM}>`) :
    'Linkist NFC <hello@linkist.ai>',
  replyTo: process.env.EMAIL_REPLY_TO || 'support@linkist.ai',
  isProduction: process.env.NODE_ENV === 'production',
  isSMTPConfigured: Boolean(process.env.SMTP_USER && process.env.SMTP_PASS),
};

// Lazy initialization to avoid build-time errors
let transporter: Transporter | null = null;

const getTransporterInstance = (): Transporter | null => {
  // Detailed environment validation
  const envVars = {
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS,
    EMAIL_FROM: process.env.EMAIL_FROM,
    EMAIL_REPLY_TO: process.env.EMAIL_REPLY_TO
  };

  console.log('🔧 SMTP Configuration Check:', {
    hasUser: Boolean(envVars.SMTP_USER),
    hasPass: Boolean(envVars.SMTP_PASS),
    hasHost: Boolean(envVars.SMTP_HOST),
    hasPort: Boolean(envVars.SMTP_PORT),
    userLength: envVars.SMTP_USER?.length || 0,
    passLength: envVars.SMTP_PASS?.length || 0,
    hostValue: envVars.SMTP_HOST || 'NOT_SET',
    portValue: envVars.SMTP_PORT || 'NOT_SET',
    userValue: envVars.SMTP_USER || 'NOT_SET',
    fromValue: envVars.EMAIL_FROM || 'NOT_SET',
    host: SMTP_CONFIG.host,
    port: SMTP_CONFIG.port,
    secure: SMTP_CONFIG.secure,
    isConfigured: EMAIL_CONFIG.isSMTPConfigured,
    NODE_ENV: process.env.NODE_ENV
  });

  // Validate required environment variables
  const missingVars = [];
  if (!envVars.SMTP_HOST?.trim()) missingVars.push('SMTP_HOST');
  if (!envVars.SMTP_PORT?.trim()) missingVars.push('SMTP_PORT');
  if (!envVars.SMTP_USER?.trim()) missingVars.push('SMTP_USER');
  if (!envVars.SMTP_PASS?.trim()) missingVars.push('SMTP_PASS');

  if (missingVars.length > 0) {
    console.error('❌ SMTP configuration incomplete. Missing variables:', missingVars);
    console.error('Environment check:', {
      SMTP_HOST: envVars.SMTP_HOST ? `"${envVars.SMTP_HOST}"` : 'MISSING',
      SMTP_PORT: envVars.SMTP_PORT ? `"${envVars.SMTP_PORT}"` : 'MISSING',
      SMTP_USER: envVars.SMTP_USER ? `"${envVars.SMTP_USER}"` : 'MISSING',
      SMTP_PASS: envVars.SMTP_PASS ? `${envVars.SMTP_PASS.length} chars` : 'MISSING'
    });
    return null;
  }

  if (!EMAIL_CONFIG.isSMTPConfigured) {
    console.warn('❌ SMTP not configured:', {
      user: process.env.SMTP_USER ? 'present' : 'missing',
      pass: process.env.SMTP_PASS ? 'present' : 'missing',
    });
    return null;
  }

  if (!transporter) {
    console.log('✅ Initializing SMTP transporter with config:', {
      host: SMTP_CONFIG.host,
      port: SMTP_CONFIG.port,
      user: SMTP_CONFIG.auth.user,
      secure: SMTP_CONFIG.secure,
      requireTLS: SMTP_CONFIG.requireTLS,
      connectionTimeout: SMTP_CONFIG.connectionTimeout,
      dnsTimeout: SMTP_CONFIG.dnsTimeout
    });

    try {
      transporter = nodemailer.createTransport(SMTP_CONFIG);
      console.log('✅ SMTP transporter created successfully');
    } catch (error) {
      console.error('❌ Failed to create SMTP transporter:', error);
      return null;
    }
  }

  return transporter;
};

export interface SendOTPEmailParams {
  to: string;
  otp: string;
  expiresInMinutes: number;
}

export async function sendOTPEmail({ to, otp, expiresInMinutes }: SendOTPEmailParams) {
  try {
    const transporterInstance = getTransporterInstance();

    if (!transporterInstance) {
      console.error('❌ SMTP transporter not configured');
      return { success: false, error: 'SMTP service not configured' };
    }

    const mailOptions = {
      from: EMAIL_CONFIG.from,
      to,
      subject: 'Your Linkist Verification Code',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta name="color-scheme" content="light dark">
          <meta name="supported-color-schemes" content="light dark">
          <title>Email Verification Code</title>
          <style>
            /* Ensure dark mode compatibility */
            @media (prefers-color-scheme: dark) {
              .email-body { background-color: #1f2937 !important; color: #f3f4f6 !important; }
              .email-content { background-color: #374151 !important; }
              .text-dark { color: #f3f4f6 !important; }
              .text-muted { color: #d1d5db !important; }
            }
          </style>
        </head>
        <body class="email-body" style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
          <div style="background: #000000; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <!-- Logo with white text on black background - visible in all modes -->
            <img src="https://linkist.2men.co/logo2.png" alt="Linkist" style="height: 60px; width: auto; max-width: 100%;" />
          </div>

          <div class="email-content" style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 class="text-dark" style="color: #111827; margin-top: 0;">Verify Your Email</h2>

            <p class="text-dark" style="font-size: 16px; color: #4b5563;">
              Use this verification code to complete your email verification:
            </p>

            <div style="background: white; border: 2px solid #dc2626; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
              <div style="font-size: 36px; font-weight: bold; color: #dc2626; letter-spacing: 8px;">
                ${otp}
              </div>
            </div>

            <p class="text-muted" style="font-size: 14px; color: #6b7280;">
              This code will expire in <strong>${expiresInMinutes} minutes</strong>.
            </p>

            <p class="text-muted" style="font-size: 14px; color: #6b7280;">
              If you didn't request this code, please ignore this email.
            </p>

            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

            <p class="text-muted" style="font-size: 12px; color: #9ca3af; text-align: center; margin: 0;">
              © 2025 Linkist NFC. All rights reserved.<br>
              Professional NFC business cards for modern networking.
            </p>
          </div>
        </body>
        </html>
      `,
    };

    const info = await transporterInstance.sendMail(mailOptions);

    console.log('✅ Email sent successfully:', info.messageId);
    return { success: true, id: info.messageId };

  } catch (error) {
    console.error('❌ Failed to send email:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : String(error),
      code: (error as any)?.code,
      response: (error as any)?.response,
      responseCode: (error as any)?.responseCode,
      command: (error as any)?.command
    });
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export interface OrderEmailParams {
  to: string;
  subject: string;
  html: string;
  tags?: Array<{ name: string; value: string }>;
}

export async function sendOrderEmail({ to, subject, html, tags }: OrderEmailParams) {
  try {
    const transporterInstance = getTransporterInstance();

    if (!transporterInstance) {
      console.error('❌ SMTP transporter not configured');
      return { success: false, error: 'SMTP service not configured' };
    }

    const mailOptions = {
      from: EMAIL_CONFIG.from,
      to,
      subject,
      html,
      replyTo: EMAIL_CONFIG.replyTo,
      headers: tags ? {
        'X-Email-Type': tags.find(t => t.name === 'email_type')?.value || 'general',
        'X-Order-Number': tags.find(t => t.name === 'order_number')?.value || '',
        'X-Environment': tags.find(t => t.name === 'environment')?.value || 'development',
      } : undefined
    };

    const info = await transporterInstance.sendMail(mailOptions);

    console.log('✅ Order email sent successfully:', info.messageId);
    return { success: true, id: info.messageId, error: null };

  } catch (error) {
    console.error('❌ Failed to send order email:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : String(error),
      code: (error as any)?.code,
      response: (error as any)?.response,
      responseCode: (error as any)?.responseCode,
      command: (error as any)?.command
    });
    return { success: false, id: null, error: error instanceof Error ? error.message : String(error) };
  }
}

// Verify SMTP connection
export async function verifySMTPConnection(): Promise<boolean> {
  try {
    console.log('🔄 Verifying SMTP connection...');
    const transporterInstance = getTransporterInstance();

    if (!transporterInstance) {
      console.error('❌ No transporter instance available');
      return false;
    }

    await transporterInstance.verify();
    console.log('✅ SMTP connection verified successfully');
    return true;
  } catch (error) {
    console.error('❌ SMTP connection failed:', error);
    console.error('Connection error details:', {
      message: error instanceof Error ? error.message : String(error),
      code: (error as any)?.code,
      syscall: (error as any)?.syscall,
      hostname: (error as any)?.hostname,
      command: (error as any)?.command
    });
    return false;
  }
}

export { EMAIL_CONFIG, getTransporterInstance };
