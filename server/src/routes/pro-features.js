import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/connection.js';
import { createNotification, NOTIFICATION_TYPES } from '../services/notifications.js';

const router = Router();

// ============================================================
// REFERRAL TRACKING
// ============================================================

/**
 * GET /api/referrals/code/:userId — Get or generate a referral code
 */
router.get('/code/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if user already has a code
    let result = await db.execute({
      sql: 'SELECT * FROM referrals WHERE referrer_id = ? AND status = \'active\'',
      args: [userId],
    });

    if (result.rows.length > 0) {
      return res.json({ referral_code: result.rows[0].code, status: 'active' });
    }

    // Generate a new code
    const id = uuidv4();
    const code = 'KC' + userId.substring(0, 6).toUpperCase();

    await db.execute({
      sql: 'INSERT INTO referrals (id, referrer_id, code) VALUES (?, ?, ?)',
      args: [id, userId, code],
    });

    res.json({ referral_code: code, status: 'active' });
  } catch (err) {
    console.error('Referral code error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * POST /api/referrals/claim — Claim a referral when a new user signs up
 * Body: { referee_id, referral_code }
 */
router.post('/claim', async (req, res) => {
  try {
    const { referee_id, referral_code } = req.body;

    if (!referee_id || !referral_code) {
      return res.status(400).json({ message: 'referee_id and referral_code are required' });
    }

    // Find the referral
    const result = await db.execute({
      sql: 'SELECT * FROM referrals WHERE code = ? AND status = \'active\'',
      args: [referral_code],
    });

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Invalid or expired referral code' });
    }

    const referral = result.rows[0];

    // Prevent self-referral
    if (referral.referrer_id === referee_id) {
      return res.status(400).json({ message: 'Cannot refer yourself' });
    }

    // Mark referral as used and link referee
    await db.execute({
      sql: `UPDATE referrals SET
            status = 'used',
            referee_id = ?,
            reward_earned = 1,
            updated_at = datetime('now')
            WHERE id = ?`,
      args: [referee_id, referral.id],
    });

    // Award 1 month Pro credit to referrer (extend their pro subscription)
    // In production this would integrate with billing
    const referrer = await db.execute({
      sql: 'SELECT * FROM users WHERE id = ?',
      args: [referral.referrer_id],
    });

    // Notify the referrer about their earned reward
    if (referrer.rows.length > 0) {
      const refName = referrer.rows[0].name || 'A friend';
      await createNotification({
        userId: referral.referrer_id,
        type: NOTIFICATION_TYPES.REFERRAL_REWARD,
        category: 'referral',
        title: '🎉 Referral Reward Earned!',
        message: `Someone used your referral code! You've earned 1 month of KidCircle Pro free. Thank you for spreading the word about trusted programs in Austin!`,
        data: {
          referral_code: referral.code,
          referral_id: referral.id,
          reward: '1 month Pro credit',
          referee_id,
        },
      });
    }

    res.json({
      message: 'Referral claimed successfully',
      referrer_id: referral.referrer_id,
      reward: '1 month Pro credit awarded',
    });
  } catch (err) {
    console.error('Referral claim error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * GET /api/referrals/stats/:userId — Get referral stats
 */
router.get('/stats/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await db.execute({
      sql: `SELECT COUNT(*) as total_referrals,
            SUM(CASE WHEN status = 'used' THEN 1 ELSE 0 END) as successful,
            SUM(reward_earned) as total_rewards
            FROM referrals WHERE referrer_id = ?`,
      args: [userId],
    });

    const codeResult = await db.execute({
      sql: 'SELECT code FROM referrals WHERE referrer_id = ? AND status = \'active\'',
      args: [userId],
    });

    res.json({
      referral_code: codeResult.rows[0]?.code || null,
      ...result.rows[0],
    });
  } catch (err) {
    console.error('Referral stats error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============================================================
// CAMP & CLASS SWAP MARKETPLACE
// ============================================================

/**
 * POST /api/swaps/list — List a verified booking for swap
 * Body: {
 *   listing_user_id, provider_id, original_price, swap_price,
 *   booking_date, booking_detail (optional)
 * }
 * Rules: swap_price cannot exceed original_price (anti-scalping)
 */
router.post('/list', async (req, res) => {
  try {
    const { listing_user_id, provider_id, original_price, swap_price, booking_date, booking_detail } = req.body;

    // Validation
    const errors = [];
    if (!listing_user_id) errors.push('listing_user_id is required');
    if (!provider_id) errors.push('provider_id is required');
    if (!original_price || original_price <= 0) errors.push('original_price must be > 0');
    if (!swap_price || swap_price <= 0) errors.push('swap_price must be > 0');

    // Anti-scalping: price cannot exceed original
    if (swap_price && original_price && swap_price > original_price) {
      errors.push('swap_price cannot exceed original_price (anti-scalping policy)');
    }

    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    // Verify user is Pro
    const userResult = await db.execute({
      sql: 'SELECT tier FROM users WHERE id = ?',
      args: [listing_user_id],
    });

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (userResult.rows[0].tier !== 'pro') {
      return res.status(403).json({ message: 'Only Pro members can list swaps. Upgrade to Pro!' });
    }

    // Verify provider exists
    const provCheck = await db.execute({
      sql: 'SELECT id, name FROM providers WHERE id = ?',
      args: [provider_id],
    });

    if (provCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    const id = uuidv4();
    await db.execute({
      sql: `INSERT INTO swaps (id, listing_user_id, provider_id, original_price, swap_price,
            booking_date, booking_detail, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'listed')`,
      args: [id, listing_user_id, provider_id, original_price, swap_price,
             booking_date || null, booking_detail || null],
    });

    const result = await db.execute({
      sql: 'SELECT * FROM swaps WHERE id = ?',
      args: [id],
    });

    // Notify users interested in this provider or its category
    const provInfo = await db.execute({
      sql: 'SELECT category_id, name FROM providers WHERE id = ?',
      args: [provider_id],
    });

    if (provInfo.rows.length > 0) {
      const provider = provInfo.rows[0];

      // Find users who have favorited this provider or have interest in the same category
      const interestedUsers = await db.execute({
        sql: `SELECT DISTINCT u.id, u.name
              FROM users u
              LEFT JOIN favorites f ON f.user_id = u.id AND f.provider_id = ?
              LEFT JOIN user_interests ui ON ui.user_id = u.id AND (ui.provider_id = ? OR ui.category_id = ?)
              WHERE (f.id IS NOT NULL OR ui.id IS NOT NULL)
              AND u.id != ?
              LIMIT 20`,
        args: [provider_id, provider_id, provider.category_id, listing_user_id],
      });

      for (const user of interestedUsers.rows) {
        await createNotification({
          userId: user.id,
          type: NOTIFICATION_TYPES.SWAP_MATCHED,
          category: 'swap',
          title: '🎫 Swap Available!',
          message: `A new spot just opened up at ${provider.name} through the Camp & Class Swap! Someone is offering their booking at a great price. Check it out before it's claimed.\n\n⚠️ Transfer Policy: All swap listings are subject to individual provider transfer rules. Some providers may restrict or charge fees for transfers. Always verify with the provider before assuming a swap is valid. KidCircle acts as a marketplace only — we recommend confirming transferability with the provider directly.`,
          data: {
            swap_id: id,
            provider_id,
            provider_name: provider.name,
            swap_price,
            original_price,
            booking_date: booking_date || null,
          },
        });
      }
    }

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('List swap error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * GET /api/swaps — Browse available swaps (filterable)
 * Query: provider_id, status (default 'listed'), min_price, max_price
 */
router.get('/', async (req, res) => {
  try {
    const { provider_id, status = 'listed', min_price, max_price } = req.query;

    let sql = `SELECT s.*, u.name as listing_user_name, p.name as provider_name
               FROM swaps s
               JOIN providers p ON s.provider_id = p.id
               JOIN users u ON s.listing_user_id = u.id
               WHERE 1=1`;
    const args = [];

    if (status) {
      sql += ' AND s.status = ?';
      args.push(status);
    }
    if (provider_id) {
      sql += ' AND s.provider_id = ?';
      args.push(provider_id);
    }
    if (min_price) {
      sql += ' AND s.swap_price >= ?';
      args.push(Number(min_price));
    }
    if (max_price) {
      sql += ' AND s.swap_price <= ?';
      args.push(Number(max_price));
    }

    sql += ' ORDER BY s.created_at DESC LIMIT 50';

    const result = await db.execute({ sql, args });
    res.json(result.rows);
  } catch (err) {
    console.error('List swaps error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * POST /api/swaps/:id/claim — Claim a swap (puts in escrow)
 */
router.post('/:id/claim', async (req, res) => {
  try {
    const { id } = req.params;
    const { claiming_user_id } = req.body;

    if (!claiming_user_id) {
      return res.status(400).json({ message: 'claiming_user_id is required' });
    }

    // Check user is Pro
    const userResult = await db.execute({
      sql: 'SELECT tier FROM users WHERE id = ?',
      args: [claiming_user_id],
    });

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (userResult.rows[0].tier !== 'pro') {
      return res.status(403).json({ message: 'Only Pro members can claim swaps' });
    }

    // Get the swap
    const swapResult = await db.execute({
      sql: 'SELECT * FROM swaps WHERE id = ? AND status = \'listed\'',
      args: [id],
    });

    if (swapResult.rows.length === 0) {
      return res.status(404).json({ message: 'Swap not found or already claimed' });
    }

    const swap = swapResult.rows[0];

    // Prevent listing user from claiming their own swap
    if (swap.listing_user_id === claiming_user_id) {
      return res.status(400).json({ message: 'Cannot claim your own listing' });
    }

    // Move to escrow
    await db.execute({
      sql: `UPDATE swaps SET
            status = 'escrow',
            claiming_user_id = ?,
            updated_at = datetime('now')
            WHERE id = ?`,
      args: [claiming_user_id, id],
    });

    // Notify the listing user that someone claimed their swap
    const listingUserResult = await db.execute({
      sql: 'SELECT u.name as lister_name, p.name as provider_name FROM swaps s JOIN users u ON s.listing_user_id = u.id JOIN providers p ON s.provider_id = p.id WHERE s.id = ?',
      args: [id],
    });

    if (listingUserResult.rows.length > 0) {
      const { lister_name, provider_name } = listingUserResult.rows[0];
      await createNotification({
        userId: swap.listing_user_id,
        type: NOTIFICATION_TYPES.SWAP_CLAIMED,
        category: 'swap',
        title: '🔄 Swap Claimed!',
        message: `Someone has claimed your ${provider_name} swap listing! Please coordinate with the provider to confirm the transfer. The funds are held in escrow until you confirm.\n\n⚠️ Transfer Policy: The claiming user's access is pending provider confirmation. If the provider does not permit transfers or charges a transfer fee, you must disclose this to the claimer before confirming. KidCircle recommends confirming with the provider first.`,
        data: {
          swap_id: id,
          provider_name,
          claiming_user_id,
          status: 'escrow',
        },
      });
    }

    res.json({
      message: 'Swap claimed — funds held in escrow pending provider confirmation',
      swap_id: id,
      status: 'escrow',
      listing_fee: swap.listing_fee,
    });
  } catch (err) {
    console.error('Claim swap error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * POST /api/swaps/:id/confirm — Provider confirms swap (releases escrow)
 */
router.post('/:id/confirm', async (req, res) => {
  try {
    const { id } = req.params;

    const swapResult = await db.execute({
      sql: 'SELECT * FROM swaps WHERE id = ? AND status = \'escrow\'',
      args: [id],
    });

    if (swapResult.rows.length === 0) {
      return res.status(404).json({ message: 'Swap not found or not in escrow' });
    }

    // Confirm — release funds
    await db.execute({
      sql: `UPDATE swaps SET
            status = 'confirmed',
            updated_at = datetime('now')
            WHERE id = ?`,
      args: [id],
    });

    // Notify the claiming user that the swap is confirmed
    const confirmResult = await db.execute({
      sql: 'SELECT s.listing_user_id, s.claiming_user_id, p.name as provider_name FROM swaps s JOIN providers p ON s.provider_id = p.id WHERE s.id = ?',
      args: [id],
    });

    if (confirmResult.rows.length > 0) {
      const { claiming_user_id, provider_name } = confirmResult.rows[0];

      if (claiming_user_id) {
        await createNotification({
          userId: claiming_user_id,
          type: NOTIFICATION_TYPES.SWAP_CONFIRMED,
          category: 'swap',
          title: '✅ Swap Confirmed!',
          message: `Great news! Your swap for ${provider_name} has been confirmed by the provider. The booking is now yours. Have a wonderful time!\n\n⚠️ Note: The swap was confirmed based on the provider's transfer policy at the time of confirmation. KidCircle is a marketplace platform and is not responsible for provider policy changes after confirmation. If you encounter any issues, please contact the provider directly.`,
          data: {
            swap_id: id,
            provider_name,
            status: 'confirmed',
          },
        });
      }
    }

    res.json({
      message: 'Swap confirmed — funds released to lister',
      swap_id: id,
      status: 'confirmed',
    });
  } catch (err) {
    console.error('Confirm swap error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * POST /api/swaps/:id/cancel — Cancel a swap (provider veto or lister timeout)
 */
router.post('/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const swapResult = await db.execute({
      sql: "SELECT * FROM swaps WHERE id = ? AND status IN ('listed', 'escrow')",
      args: [id],
    });

    if (swapResult.rows.length === 0) {
      return res.status(404).json({ message: 'Swap not found or already finalized' });
    }

    await db.execute({
      sql: `UPDATE swaps SET
            status = 'cancelled',
            updated_at = datetime('now')
            WHERE id = ?`,
      args: [id],
    });

    const refundMsg = swapResult.rows[0].status === 'escrow'
      ? ' — full refund issued to claimer'
      : '';

    // Notify relevant parties
    const cancelSwap = swapResult.rows[0];
    const cancelResult = await db.execute({
      sql: 'SELECT p.name as provider_name FROM swaps s JOIN providers p ON s.provider_id = p.id WHERE s.id = ?',
      args: [id],
    });
    const providerName = cancelResult.rows[0]?.provider_name || 'Unknown';

    // Notify the claiming user if swap was in escrow
    if (cancelSwap.claiming_user_id) {
      await createNotification({
        userId: cancelSwap.claiming_user_id,
        type: NOTIFICATION_TYPES.SWAP_CANCELLED_REFUND,
        category: 'swap',
        title: '❌ Swap Cancelled',
        message: `The swap for ${providerName} has been cancelled.${refundMsg} ${reason ? `Reason: ${reason}` : ''}\n\n⚠️ Refund Policy: If the swap was in escrow, a full refund has been issued to you. KidCircle acts as a marketplace only and is not responsible for provider decisions to deny transfers. If you believe the cancellation was in error, please contact the provider directly.`,
        data: {
          swap_id: id,
          provider_name: providerName,
          previous_status: cancelSwap.status,
          reason: reason || null,
          refund_issued: cancelSwap.status === 'escrow',
        },
      });
    }

    // Also notify the listing user
    await createNotification({
      userId: cancelSwap.listing_user_id,
      type: NOTIFICATION_TYPES.SWAP_CANCELLED_REFUND,
      category: 'swap',
      title: '🔄 Swap Cancelled',
      message: `Your swap listing for ${providerName} has been cancelled.${refundMsg} ${reason ? `Reason: ${reason}` : ''}\n\n⚠️ Important: The swap listing has been removed. If a claim was in escrow, the funds have been returned to the claimer. Please review with the provider before listing future swaps — some providers have restrictions on transferability.`,
      data: {
        swap_id: id,
        provider_name: providerName,
        reason: reason || null,
      },
    });

    res.json({
      message: `Swap cancelled${refundMsg}`,
      swap_id: id,
      status: 'cancelled',
      reason: reason || 'Not specified',
    });
  } catch (err) {
    console.error('Cancel swap error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * POST /api/swaps/extract — Mock AI extraction from booking confirmation
 * Accepts simulated booking data and extracts provider/date info
 * Body: { raw_text: "...booking details..." }
 */
router.post('/extract', async (req, res) => {
  try {
    const { raw_text } = req.body;

    if (!raw_text) {
      return res.status(400).json({ message: 'raw_text is required (simulated booking confirmation)' });
    }

    // Mock AI extraction: search for common patterns
    const text = raw_text;

    // Extract provider name: search for known provider names first, then fall back to patterns
    const knownProviders = await db.execute({
      sql: 'SELECT name FROM providers ORDER BY LENGTH(name) DESC',
    });
    const knownNames = knownProviders.rows.map(r => r.name);

    let providerName = 'Unknown Provider';
    for (const name of knownNames) {
      if (text.toLowerCase().includes(name.toLowerCase())) {
        providerName = name;
        break;
      }
    }

    if (providerName === 'Unknown Provider') {
      // Fallback: look for capitalized business name patterns
      const providerMatch = text.match(/(?:Camp|Program|Class|Academy|Studio|School|Center|Theatre)\s+[\w\s&]+/i);
      if (providerMatch) {
        providerName = providerMatch[0].trim();
      }
    }

    // Extract dates
    const dateMatch = text.match(/\b(\w+\s\d{1,2}(?:st|nd|rd|th)?,?\s?\d{4})\b/g)
      || text.match(/\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b/g);
    const dates = dateMatch || [];

    // Extract price
    const priceMatch = text.match(/\$\d+(?:\.\d{2})?/g);
    const prices = priceMatch ? priceMatch.map(p => parseFloat(p.replace('$', ''))) : [];
    const originalPrice = prices.length > 0 ? Math.max(...prices) : null;

    // Extract age range
    const ageMatch = text.match(/(?:ages?|years?)\s(\d+)(?:\s*-\s*(\d+))?/i);
    const ageRange = ageMatch ? `${ageMatch[1]}${ageMatch[2] ? `-${ageMatch[2]}` : '+'}` : null;

    // Find matching provider in our database
    let matchedProvider = null;
    if (providerName !== 'Unknown Provider') {
      const provResult = await db.execute({
        sql: 'SELECT id, name FROM providers WHERE name LIKE ? LIMIT 1',
        args: [`%${providerName.substring(0, 20)}%`],
      });
      if (provResult.rows.length > 0) {
        matchedProvider = provResult.rows[0];
      }
    }

    res.json({
      extracted: {
        provider_name: providerName,
        matched_provider_id: matchedProvider?.id || null,
        matched_provider_name: matchedProvider?.name || null,
        dates,
        original_price: originalPrice,
        age_range: ageRange,
        confidence: originalPrice ? 'high' : 'medium',
      },
    });
  } catch (err) {
    console.error('Extract error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export { router };