/**
 * Lead Magnet Backfill Script
 * Sends the Austin Summer Survival Guide to leads who signed up before the automation was live.
 */
import db from './connection.js';
import { emailService } from '../services/email.js';

async function backfill() {
  try {
    console.log('[Backfill] Checking for pending lead magnet sends...');

    // Find leads who signed up for the guide but haven't been sent it yet
    const pending = await db.execute({
      sql: `SELECT * FROM leads 
            WHERE source = 'homepage_survival_guide' 
            AND guide_sent = 0`,
    });

    console.log(`[Backfill] Found ${pending.rows.length} pending leads.`);

    for (const lead of pending.rows) {
      try {
        console.log(`[Backfill] Processing ${lead.email}...`);
        
        await emailService.sendSurvivalGuide(lead.email, lead.first_name);

        // Mark as sent
        await db.execute({
          sql: `UPDATE leads SET guide_sent = 1, last_notified_at = datetime('now') WHERE id = ?`,
          args: [lead.id],
        });

        console.log(`[Backfill] Successfully processed ${lead.email}`);
      } catch (err) {
        console.error(`[Backfill] Failed to process ${lead.email}:`, err.message);
      }
    }

    console.log('[Backfill] Completed.');
    process.exit(0);
  } catch (err) {
    console.error('[Backfill] Critical error:', err);
    process.exit(1);
  }
}

backfill();
