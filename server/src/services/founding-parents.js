/**
 * Founding Parent Program Service
 *
 * Grants a 15% lifetime discount to parents who sign up within the first 48 hours
 * of the KidCircle Austin launch (July 1st, 2026).
 */
import { v4 as uuidv4 } from 'uuid';
import db from '../db/connection.js';

// 08:00 Central Time (CDT, UTC-5) = 13:00 UTC
const LAUNCH_DATE = new Date('2026-07-01T13:00:00Z');
const FOUNDING_WINDOW_HOURS = 48;

/**
 * Check if the founding parent window is still open
 */
export function isFoundingWindowOpen() {
  const now = new Date();
  const elapsed = (now.getTime() - LAUNCH_DATE.getTime()) / (1000 * 60 * 60);
  return elapsed >= 0 && elapsed <= FOUNDING_WINDOW_HOURS;
}

/**
 * Get remaining time in the founding window (in hours)
 */
export function getFoundingWindowRemaining() {
  const now = new Date();
  const elapsed = (now.getTime() - LAUNCH_DATE.getTime()) / (1000 * 60 * 60);
  const remaining = FOUNDING_WINDOW_HOURS - elapsed;
  return Math.max(0, remaining);
}

/**
 * Enroll a user in the Founding Parent program
 * @param {string} userId - The user to enroll
 * @returns {Promise<Object>} The enrollment record
 */
export async function enrollFoundingParent(userId) {
  if (!userId) {
    throw new Error('userId is required');
  }

  if (!isFoundingWindowOpen()) {
    throw new Error('The Founding Parent window has closed. Please check KidCircle for current offers.');
  }

  // Check if already enrolled
  const existing = await db.execute({
    sql: 'SELECT * FROM founding_parents WHERE user_id = ?',
    args: [userId],
  });

  if (existing.rows.length > 0) {
    return existing.rows[0];
  }

  const id = uuidv4();
  const code = 'FP-' + userId.substring(0, 8).toUpperCase() + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();
  const expiresAt = new Date(LAUNCH_DATE.getTime() + FOUNDING_WINDOW_HOURS * 60 * 60 * 1000).toISOString();

  await db.execute({
    sql: `INSERT INTO founding_parents (id, user_id, discount_percent, discount_code, expires_at)
          VALUES (?, ?, ?, ?, ?)`,
    args: [id, userId, 15, code, expiresAt],
  });

  // Also mark the user as a founding parent on the users table
  // This makes is_founding_parent visible without joins
  await db.execute({
    sql: `UPDATE users SET is_founding_parent = 1, founding_discount_percent = 15 WHERE id = ?`,
    args: [userId],
  });

  const result = await db.execute({
    sql: 'SELECT * FROM founding_parents WHERE id = ?',
    args: [id],
  });

  return result.rows[0];
}

/**
 * Get founding parent status for a user
 */
export async function getFoundingStatus(userId) {
  const result = await db.execute({
    sql: 'SELECT * FROM founding_parents WHERE user_id = ? AND active = 1',
    args: [userId],
  });
  return result.rows[0] || null;
}

/**
 * Get the total count of founding parents (for dashboard/marketing)
 */
export async function getFoundingParentCount() {
  const result = await db.execute({
    sql: 'SELECT COUNT(*) as count FROM founding_parents WHERE active = 1',
  });
  return result.rows[0]?.count || 0;
}

/**
 * Deactivate a founding parent discount (admin use)
 */
export async function deactivateFoundingParent(userId) {
  await db.execute({
    sql: 'UPDATE founding_parents SET active = 0 WHERE user_id = ?',
    args: [userId],
  });
  return { message: 'Founding parent discount deactivated' };
}