/**
 * Notification Settings API — Backend for user notification preference toggles.
 * Supports email, push, SMS, reminder, and marketing preference storage.
 */
import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/connection.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

const DEFAULT_SETTINGS = {
  email_notifications: 1,
  push_notifications: 1,
  sms_notifications: 0,
  reminder_notifications: 1,
  marketing_emails: 0,
};

/**
 * GET /api/notification-settings — Get current user's notification settings
 * Creates default settings if none exist yet.
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;

    let result = await db.execute({
      sql: 'SELECT * FROM notification_settings WHERE user_id = ?',
      args: [userId],
    });

    if (result.rows.length === 0) {
      // Create default settings
      const id = uuidv4();
      await db.execute({
        sql: `INSERT INTO notification_settings (id, user_id, email_notifications, push_notifications,
              sms_notifications, reminder_notifications, marketing_emails)
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [id, userId, 1, 1, 0, 1, 0],
      });

      result = await db.execute({
        sql: 'SELECT * FROM notification_settings WHERE user_id = ?',
        args: [userId],
      });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get notification settings error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * PUT /api/notification-settings — Update notification preferences
 * Body: { email_notifications?, push_notifications?, sms_notifications?,
 *         reminder_notifications?, marketing_emails? }
 */
router.put('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;
    const {
      email_notifications,
      push_notifications,
      sms_notifications,
      reminder_notifications,
      marketing_emails,
    } = req.body;

    // Validate boolean/int values
    const toggles = {
      email_notifications: email_notifications !== undefined ? (email_notifications ? 1 : 0) : undefined,
      push_notifications: push_notifications !== undefined ? (push_notifications ? 1 : 0) : undefined,
      sms_notifications: sms_notifications !== undefined ? (sms_notifications ? 1 : 0) : undefined,
      reminder_notifications: reminder_notifications !== undefined ? (reminder_notifications ? 1 : 0) : undefined,
      marketing_emails: marketing_emails !== undefined ? (marketing_emails ? 1 : 0) : undefined,
    };

    // Ensure a row exists
    const existing = await db.execute({
      sql: 'SELECT id FROM notification_settings WHERE user_id = ?',
      args: [userId],
    });

    if (existing.rows.length === 0) {
      const id = uuidv4();
      await db.execute({
        sql: `INSERT INTO notification_settings (id, user_id, email_notifications, push_notifications,
              sms_notifications, reminder_notifications, marketing_emails)
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [
          id, userId,
          toggles.email_notifications ?? 1,
          toggles.push_notifications ?? 1,
          toggles.sms_notifications ?? 0,
          toggles.reminder_notifications ?? 1,
          toggles.marketing_emails ?? 0,
        ],
      });
    } else {
      // Build dynamic UPDATE
      const updates = [];
      const args = [];
      for (const [col, val] of Object.entries(toggles)) {
        if (val !== undefined) {
          updates.push(`${col} = ?`);
          args.push(val);
        }
      }

      if (updates.length > 0) {
        updates.push("updated_at = datetime('now')");
        args.push(userId);

        await db.execute({
          sql: `UPDATE notification_settings SET ${updates.join(', ')} WHERE user_id = ?`,
          args,
        });
      }
    }

    const result = await db.execute({
      sql: 'SELECT * FROM notification_settings WHERE user_id = ?',
      args: [userId],
    });

    res.json({
      message: 'Notification preferences updated',
      settings: result.rows[0],
    });
  } catch (err) {
    console.error('Update notification settings error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export { router };
