/**
 * Hot Spot Notification Service
 *
 * Tracks "near-miss" bookings — when a parent views a fully booked provider,
 * they can opt in to get notified when a spot opens up (via swap, cancellation, or new session).
 */
import { v4 as uuidv4 } from 'uuid';
import db from '../db/connection.js';
import { createNotification, NOTIFICATION_TYPES } from './notifications.js';

/**
 * Register interest in a hot spot (provider/booked date)
 * @param {string} userId - The parent who missed out
 * @param {string} providerId - The provider they're interested in
 * @param {string} [bookingDate] - Optional specific date they want
 */
export async function registerHotSpotInterest({ userId, providerId, bookingDate = null }) {
  if (!userId || !providerId) {
    throw new Error('userId and providerId are required');
  }

  // Check if already registered
  const existing = await db.execute({
    sql: `SELECT * FROM hot_spot_interests
          WHERE user_id = ? AND provider_id = ? AND (booking_date = ? OR (booking_date IS NULL AND ? IS NULL))
          AND active = 1`,
    args: [userId, providerId, bookingDate, bookingDate],
  });

  if (existing.rows.length > 0) {
    return { ...existing.rows[0], already_registered: true };
  }

  const id = uuidv4();
  await db.execute({
    sql: `INSERT INTO hot_spot_interests (id, user_id, provider_id, booking_date, active)
          VALUES (?, ?, ?, ?, 1)`,
    args: [id, userId, providerId, bookingDate || null],
  });

  const result = await db.execute({
    sql: `SELECT h.*, p.name as provider_name
          FROM hot_spot_interests h
          JOIN providers p ON h.provider_id = p.id
          WHERE h.id = ?`,
    args: [id],
  });

  return result.rows[0];
}

/**
 * Notify all interested users when a spot opens up at a provider
 * @param {string} providerId - The provider with newly available spots
 * @param {Object} options
 * @param {string} [options.bookingDate] - Specific date that opened up
 * @param {string} [options.source] - How the spot opened (swap, cancellation, new_session)
 * @param {string} [options.swapId] - If opened via swap, the swap listing ID
 */
export async function notifyHotSpotAvailable({ providerId, bookingDate = null, source = 'swap', swapId = null }) {
  // Find all active interests for this provider
  let sql = `SELECT h.*, u.name as user_name
             FROM hot_spot_interests h
             JOIN users u ON h.user_id = u.id
             WHERE h.provider_id = ? AND h.active = 1`;
  const args = [providerId];

  if (bookingDate) {
    sql += ' AND (h.booking_date = ? OR h.booking_date IS NULL)';
    args.push(bookingDate);
  }

  const interests = await db.execute({ sql, args });

  if (interests.rows.length === 0) {
    return { notified: 0 };
  }

  // Get provider name
  const providerResult = await db.execute({
    sql: 'SELECT name FROM providers WHERE id = ?',
    args: [providerId],
  });
  const providerName = providerResult.rows[0]?.name || 'A popular program';

  // Build source-specific message
  const sourceMessages = {
    swap: `A spot just opened up at ${providerName} through the Camp & Class Swap! Someone listed their booking — it could be yours if you're quick!`,
    cancellation: `Good news! A spot has opened up at ${providerName} due to a cancellation. Check availability now!`,
    new_session: `${providerName} has added a new session! Spots are filling fast — secure yours today.`,
  };
  const message = sourceMessages[source] || `A spot has opened up at ${providerName}! Check availability now.`;

  let notified = 0;
  for (const interest of interests.rows) {
    try {
      await createNotification({
        userId: interest.user_id,
        type: 'hot_spot_available',
        category: 'hot_spot',
        title: `🔥 Hot Spot Available at ${providerName}!`,
        message,
        data: {
          provider_id: providerId,
          provider_name: providerName,
          booking_date: bookingDate,
          source,
          swap_id: swapId,
          interest_id: interest.id,
        },
      });

      // Deactivate the interest so they don't get notified again for the same spot
      await db.execute({
        sql: 'UPDATE hot_spot_interests SET active = 0, notified_at = datetime(\'now\') WHERE id = ?',
        args: [interest.id],
      });

      notified++;
    } catch (err) {
      console.error(`Failed to notify user ${interest.user_id}:`, err.message);
    }
  }

  return { notified, provider_name: providerName, source };
}

/**
 * Get hot spot interests for a user
 */
export async function getUserHotSpotInterests(userId) {
  const result = await db.execute({
    sql: `SELECT h.*, p.name as provider_name, p.logo_url
          FROM hot_spot_interests h
          JOIN providers p ON h.provider_id = p.id
          WHERE h.user_id = ? AND h.active = 1
          ORDER BY h.created_at DESC`,
    args: [userId],
  });
  return result.rows;
}

/**
 * Unregister from hot spot notifications
 */
export async function removeHotSpotInterest(interestId) {
  await db.execute({
    sql: 'UPDATE hot_spot_interests SET active = 0 WHERE id = ?',
    args: [interestId],
  });
  return { message: 'Hot spot notification removed' };
}

/**
 * Get all active hot spots (for admin dashboard)
 */
export async function getActiveHotSpots() {
  const result = await db.execute({
    sql: `SELECT p.id as provider_id, p.name as provider_name, COUNT(h.id) as interested_count
          FROM hot_spot_interests h
          JOIN providers p ON h.provider_id = p.id
          WHERE h.active = 1
          GROUP BY p.id, p.name
          ORDER BY interested_count DESC
          LIMIT 20`,
  });
  return result.rows;
}