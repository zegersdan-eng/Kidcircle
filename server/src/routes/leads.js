/**
 * Leads API Routes
 * Handles waitlist signups.
 */
import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/connection.js';
import { emailService } from '../services/email.js';

const router = Router();

/**
 * POST /api/leads — Register a new lead for the waitlist
 * Body: { email, first_name, zip_code, source }
 */
router.post('/', async (req, res) => {
  try {
    const { email, first_name, zip_code, source } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const emailLower = email.toLowerCase();

    // Check if lead already exists
    const existing = await db.execute({
      sql: 'SELECT * FROM leads WHERE email = ?',
      args: [emailLower],
    });

    if (existing.rows.length > 0) {
      return res.status(200).json({ 
        message: 'You are already on the waitlist! We will notify you as soon as we launch.',
        lead: existing.rows[0] 
      });
    }

    const id = uuidv4();
    await db.execute({
      sql: `INSERT INTO leads (id, email, first_name, zip_code, source)
            VALUES (?, ?, ?, ?, ?)`,
      args: [
        id, 
        emailLower, 
        first_name || null, 
        zip_code || null, 
        source || 'homepage_waitlist'
      ],
    });

    // Automatically trigger 'Welcome' email for the Survival Guide
    if (source === 'homepage_survival_guide') {
      // Fire and forget (or handle in background)
      emailService.sendSurvivalGuide(emailLower, first_name)
        .then(() => {
          return db.execute({
            sql: 'UPDATE leads SET guide_sent = 1, last_notified_at = datetime(\'now\') WHERE id = ?',
            args: [id],
          });
        })
        .catch(err => console.error('[LeadCapture] Failed to send survival guide email:', err));
    }

    res.status(201).json({
      message: '🎉 Thanks for joining the KidCircle waitlist! We will be in touch soon.',
      id
    });
  } catch (err) {
    console.error('Lead capture error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * GET /api/leads/count — Get total waitlist count
 */
router.get('/count', async (req, res) => {
  try {
    const result = await db.execute('SELECT COUNT(*) as count FROM leads');
    res.json({ total_leads: result.rows[0].count });
  } catch (err) {
    console.error('Lead count error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export { router };
