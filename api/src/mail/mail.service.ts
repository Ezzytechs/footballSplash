import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OtpPurpose } from '@prisma/client';
import { Resend } from 'resend';

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
}

interface SendOtpOptions {
  to: string;
  name: string;
  code: string;
  purpose: OtpPurpose;
  expiresInMinutes: number;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly resend: Resend | null;
  private readonly from: string;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('RESEND_API_KEY');
    this.resend = apiKey ? new Resend(apiKey) : null;
    this.from =
      this.config.get<string>('MAIL_FROM') ??
      'SportNews <onboarding@resend.dev>';

    if (!this.resend) {
      this.logger.warn(
        'RESEND_API_KEY is not set. Emails will be logged instead of sent.',
      );
    }
  }

  async sendOtpEmail(options: SendOtpOptions): Promise<void> {
    const isPasswordReset = options.purpose === OtpPurpose.PASSWORD_RESET;
    const isLogin = options.purpose === OtpPurpose.LOGIN;

    const subject = isPasswordReset
      ? 'Reset your SportNews password'
      : 'Your SportNews verification code';

    const heading = isPasswordReset
      ? 'Reset your password'
      : 'Verify your email address';

    const intro = isPasswordReset
      ? 'Use the code below to choose a new password.'
      : isLogin
        ? 'Use the code below to sign in to your account.'
        : 'Use the code below to finish creating your account.';

    const html = this.layout(
      heading,
      `<p style="margin:0 0 16px">Hi ${escapeHtml(options.name)},</p>
       <p style="margin:0 0 24px">${intro}</p>
       <p style="margin:0 0 24px;font-size:32px;font-weight:700;letter-spacing:8px;color:#0f172a">${options.code}</p>
       <p style="margin:0;color:#475569">This code expires in ${options.expiresInMinutes} minutes. If you did not request it, you can safely ignore this email.</p>`,
    );

    const text = [
      `Hi ${options.name},`,
      '',
      intro,
      '',
      options.code,
      '',
      `This code expires in ${options.expiresInMinutes} minutes. If you did not request it, you can safely ignore this email.`,
    ].join('\n');

    await this.send({ to: options.to, subject, html, text });
  }

  private async send({ to, subject, html, text }: SendEmailOptions) {
    if (!this.resend) {
      this.logger.warn(
        `Skipping "${subject}" to ${to} (Resend not configured)`,
      );

      if (process.env.NODE_ENV !== 'production') {
        this.logger.debug(text.replace(/\n+/g, ' '));
      }

      return;
    }

    const { error } = await this.resend.emails.send({
      from: this.from,
      to,
      subject,
      html,
      text,
    });

    if (error) {
      this.logger.error(
        `Failed to send "${subject}" to ${to}: ${error.message}`,
      );
      throw new InternalServerErrorException(
        'Unable to send email. Please try again later.',
      );
    }
  }

  private layout(heading: string, body: string): string {
    return `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:24px;background:#f1f5f9;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#0f172a">
    <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:12px;padding:32px">
      <h1 style="margin:0 0 24px;font-size:22px">${heading}</h1>
      ${body}
    </div>
    <p style="max-width:480px;margin:16px auto 0;font-size:12px;color:#64748b;text-align:center">SportNews — sports news, fixtures and analysis.</p>
  </body>
</html>`;
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
