/**
 * Hot Spot Notification API Routes
 */
import { Router } from 'express';
import {
  registerHotSpotInterest,
  notifyHotSpotAvailable,
  getUserHotSpotInterests,
  removeHotSpotInterest,
  getActiveHotSpots,
} from '../services/hot-spots.js';

const router = Router();

/**
 * POST /api/hot-spots/register — Register interest in a hot spot
 * Body: { user_id, provider_id, booking_date? }
 */
router.post('/register', async (req, res) => {
  try {
    const { user_id, provider_id, booking_date } = req.body;

    if (!user_id || !provider_id) {
      return res.status(400).json({ message: 'user_id and provider_id are required' });
    }

    const interest = await registerHotSpotInterest({ userId: user_id, providerId: provider_id, bookingDate: booking_date });
    const msg = interest.already_registered
      ? 'You\'re already subscribed for notifications when this spot opens up!'
      : '🔔 You\'ll be notified when a spot opens up at this provider!';

    res.status(interest.already_registered ? 200 : 201).json({
      message: msg,
      interest,
    });
  } catch (err) {
    console.error('Hot spot register error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * POST /api/hot-spots/notify — Trigger notifications when a spot opens up
 * Body: { provider_id, booking_date?, source?, swap_id? }
 * In production, this would be called automatically when a swap is listed or cancellation occurs.
 */
router.post('/notify', async (req, res) => {
  try {
    const { provider_id, booking_date, source, swap_id } = req.body;

    if (!provider_id) {
      return res.status(400).json({ message: 'provider_id is required' });
    }

    const result = await notifyHotSpotAvailable({
      providerId: provider_id,
      bookingDate: booking_date,
      source: source || 'swap',
      swapId: swap_id || null,
    });

    res.json(result);
  } catch (err) {
    console.error('Hot spot notify error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * GET /api/hot-spots/:userId — Get a user's hot spot subscriptions
 */
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const interests = await getUserHotSpotInterests(userId);
    res.json({ interests, count: interests.length });
  } catch (err) {
    console.error('Hot spots list error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * DELETE /api/hot-spots/:interestId — Remove a hot spot subscription
 */
router.delete('/:interestId', async (req, res) => {
  try {
    const { interestId } = req.params;
    const result = await removeHotSpotInterest(interestId);
    res.json(result);
  } catch (err) {
    console.error('Hot spot remove error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * GET /api/hot-spots/admin/active — Get all active hot spots (admin)
 */
router.get('/admin/active', async (req, res) => {
  try {
    const spots = await getActiveHotSpots();
    res.json(spots);
  } catch (err) {
    console.error('Active hot spots error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export { router };