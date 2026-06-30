/**
 * Email Service for KidCircle
 * Handles transactional emails (Welcome, Lead Magnet, Notifications).
 */
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure email storage directory exists for the file provider
const EMAIL_STORAGE = '/home/team/shared/emails';

class EmailService {
  constructor() {
    this.retryLimit = 3;
  }

  /**
   * Send an email
   * @param {Object} options - { to, subject, body, template }
   */
  async sendEmail({ to, subject, body, template }) {
    let attempt = 0;
    while (attempt < this.retryLimit) {
      try {
        attempt++;
        
        // 1. Log the attempt
        console.log(`[EmailService] Attempt ${attempt} to send "${subject}" to ${to}`);

        // 2. Failsafe: Write to shared directory for visibility
        await this._writeToFileProvider({ to, subject, body });

        // 3. Placeholder for Real Provider (e.g. Resend, SendGrid)
        // if (process.env.RESEND_API_KEY) {
        //   await this._sendViaResend({ to, subject, body });
        // }

        console.log(`[EmailService] Successfully "sent" email to ${to}`);
        return { success: true, to, subject };

      } catch (err) {
        console.error(`[EmailService] Failed attempt ${attempt}:`, err.message);
        if (attempt >= this.retryLimit) {
          throw new Error(`Failed to send email after ${this.retryLimit} attempts`);
        }
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100));
      }
    }
  }

  /**
   * Specifically send the Lead Magnet (Survival Guide)
   */
  async sendSurvivalGuide(to, firstName) {
    const name = firstName || 'Parent';
    const subject = "🎁 Your Austin Summer Survival Guide is Here!";
    const body = `
      Hi ${name},

      Welcome to KidCircle! As promised, here is your Ultimate Austin Parent Summer Survival Guide.

      Inside, you'll find:
      - 5 Best Splash Pads that aren't overcrowded
      - The "Secret" Indoor Play Place in North Austin
      - 10% Discount codes for local STEM camps

      Download the Guide: https://kidcircle.ctonew.app/guides/austin-summer-survival-guide.pdf

      We're launching tomorrow at 8:00 AM CT. Keep an eye out for an invite to join your neighborhood Circle!

      Best,
      The KidCircle Team
    `;

    return this.sendEmail({ to, subject, body });
  }

  /**
   * Internal: Write to file system for the team to see in the sandbox
   */
  async _writeToFileProvider({ to, subject, body }) {
    try {
      await fs.mkdir(EMAIL_STORAGE, { recursive: true });
      const filename = `${Date.now()}-${to.replace(/[^a-z0-9]/gi, '_')}.txt`;
      const filePath = path.join(EMAIL_STORAGE, filename);
      const content = `TO: ${to}\nSUBJECT: ${subject}\nDATE: ${new Date().toISOString()}\n\n${body}`;
      await fs.writeFile(filePath, content);
    } catch (err) {
      console.error('[EmailService] File provider failed:', err.message);
    }
  }
}

export const emailService = new EmailService();
