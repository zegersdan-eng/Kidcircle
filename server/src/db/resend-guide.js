
import db from './connection.js';
import { emailService } from '../services/email.js';

async function resend() {
  const email = 'zegers.dan@gmail.com';
  console.log(`Resending survival guide to ${email}...`);
  
  try {
    const result = await db.execute({
      sql: 'SELECT * FROM leads WHERE email = ?',
      args: [email.toLowerCase()],
    });

    if (result.rows.length === 0) {
      console.log('Lead not found.');
      return;
    }

    const lead = result.rows[0];
    await emailService.sendSurvivalGuide(lead.email, lead.first_name);
    
    await db.execute({
      sql: 'UPDATE leads SET guide_sent = 1, last_notified_at = datetime(\'now\') WHERE id = ?',
      args: [lead.id],
    });

    console.log('Successfully resent and updated DB.');
  } catch (err) {
    console.error('Failed to resend:', err);
  }
}

resend();
