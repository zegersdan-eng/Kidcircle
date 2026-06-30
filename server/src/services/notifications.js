import { v4 as uuidv4 } from 'uuid';
import db from '../db/connection.js';

/**
 * Notification Service for KidCircle
 *
 * Handles creating, sending (mock), and querying notifications.
 * Currently mocks email/push delivery but logs everything to the database.
 */

const NOTIFICATION_TYPES = {
  // Provider notifications
  DOCUMENT_APPROVED: 'provider_doc_approved',
  DOCUMENT_REJECTED: 'provider_doc_rejected',
  BADGE_AWARDED: 'provider_badge_awarded',
  BADGE_DENIED: 'provider_badge_denied',

  // Parent notifications
  SWAP_MATCHED: 'swap_matched',
  REFERRAL_REWARD: 'referral_reward',
  SWAP_CLAIMED: 'swap_claimed',
  SWAP_CONFIRMED: 'swap_confirmed',
  SWAP_CANCELLED_REFUND: 'swap_cancelled_refund',
};

/**
 * Create a notification record in the database and mock-send it.
 *
 * @param {Object} params
 * @param {string} params.userId - The user to notify
 * @param {string} params.type - One of NOTIFICATION_TYPES
 * @param {string} params.title - Short notification title
 * @param {string} params.message - Full notification body
 * @param {string} [params.category] - Optional category for grouping
 * @param {Object} [params.data] - Arbitrary JSON data payload (provider_id, swap_id, doc_id, etc.)
 * @returns {Promise<Object>} The created notification row
 */
async function createNotification({ userId, type, title, message, category = null, data = {} }) {
  const id = uuidv4();
  const dataJson = typeof data === 'object' ? JSON.stringify(data) : data;

  await db.execute({
    sql: `INSERT INTO notifications (id, user_id, type, category, title, message, data, read)
          VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
    args: [id, userId, type, category, title, message, dataJson],
  });

  // Mock email/push delivery — in production this would call SendGrid / SES / Push API
  await mockDeliver(userId, type, title, message, data);

  return { id, userId, type, category, title, message, data: data, read: 0 };
}

/**
 * Mock delivery — simulates email/push sending
 * In production this would integrate with an email provider or push notification service.
 */
async function mockDeliver(userId, type, title, message, data) {
  const channel = type.startsWith('provider') ? 'email (provider)' : 'email (parent)';
  console.log(
    `[NOTIFICATION][${channel}] To user:${userId} | Type:${type} | Title:"${title}" | Body:"${message.substring(0, 80)}..."`
  );

  // In production, actual send logic would go here:
  // - Look up user's email from database
  // - Send via SES/SendGrid/Mailgun
  // - Or push via Firebase Cloud Messaging / APNs

  // Simulate delivery delay
  return Promise.resolve();
}

/**
 * Mark a notification as read
 */
async function markAsRead(notificationId) {
  await db.execute({
    sql: 'UPDATE notifications SET read = 1 WHERE id = ?',
    args: [notificationId],
  });
}

/**
 * Mark all notifications for a user as read
 */
async function markAllAsRead(userId) {
  await db.execute({
    sql: 'UPDATE notifications SET read = 1 WHERE user_id = ?',
    args: [userId],
  });
}

/**
 * Get notifications for a user, with pagination
 */
async function getUserNotifications(userId, { limit = 50, offset = 0, unreadOnly = false } = {}) {
  let sql = 'SELECT * FROM notifications WHERE user_id = ?';
  const args = [userId];

  if (unreadOnly) {
    sql += ' AND read = 0';
  }

  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  args.push(limit, offset);

  const result = await db.execute({ sql, args });
  return result.rows.map(row => ({
    ...row,
    data: row.data ? JSON.parse(row.data) : null,
  }));
}

/**
 * Get unread notification count for a user
 */
async function getUnreadCount(userId) {
  const result = await db.execute({
    sql: 'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND read = 0',
    args: [userId],
  });
  return result.rows[0]?.count || 0;
}

/**
 * Delete old notifications (cleanup for data retention)
 */
async function deleteOldNotifications(olderThanDays = 365) {
  await db.execute({
    sql: `DELETE FROM notifications WHERE created_at < datetime('now', ?)`,
    args: [`-${olderThanDays} days`],
  });
}

export {
  NOTIFICATION_TYPES,
  createNotification,
  markAsRead,
  markAllAsRead,
  getUserNotifications,
  getUnreadCount,
  deleteOldNotifications,
};
