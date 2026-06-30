/**
 * Founding Parent Program API Routes
 * Handles enrollment and status for the 48-hour 15% lifetime discount.
 */
import { Router } from 'express';
import {
  enrollFoundingParent,
  getFoundingStatus,
  getFoundingParentCount,
  isFoundingWindowOpen,
  getFoundingWindowRemaining,
  deactivateFoundingParent,
} from '../services/founding-parents.js';

const router = Router();

/**
 * POST /api/founding/enroll — Enroll as a Founding Parent
 * Body: { user_id }
 */
router.post('/enroll', async (req, res) => {
  try {
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ message: 'user_id is required' });
    }

    const enrollment = await enrollFoundingParent(user_id);
    res.status(201).json({
      message: '🎉 Welcome as a Founding Parent! You have been awarded a 15% lifetime discount.',
      discount_percent: enrollment.discount_percent,
      discount_code: enrollment.discount_code,
      expires_at: enrollment.expires_at,
    });
  } catch (err) {
    if (err.message.includes('window has closed')) {
      return res.status(410).json({ message: err.message });
    }
    console.error('Founding parent enroll error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * GET /api/founding/status/:userId — Check founding parent status
 */
router.get('/status/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const status = await getFoundingStatus(userId);

    if (!status) {
      return res.json({
        is_founding_parent: false,
        message: 'Not enrolled in the Founding Parent program.',
        window_open: isFoundingWindowOpen(),
        window_remaining_hours: getFoundingWindowRemaining(),
      });
    }

    res.json({
      is_founding_parent: true,
      discount_percent: status.discount_percent,
      discount_code: status.discount_code,
      signed_up_at: status.signed_up_at,
      expires_at: status.expires_at,
      active: status.active === 1,
      window_remaining_hours: getFoundingWindowRemaining(),
    });
  } catch (err) {
    console.error('Founding status error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * GET /api/founding/window — Check if the founding window is still open
 */
router.get('/window', async (req, res) => {
  try {
    res.json({
      window_open: isFoundingWindowOpen(),
      remaining_hours: Math.round(getFoundingWindowRemaining() * 10) / 10,
      discount_percent: 15,
      description: 'Sign up within 48 hours of launch to lock in a 15% lifetime discount on KidCircle Pro.',
    });
  } catch (err) {
    console.error('Founding window error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * GET /api/founding/count — Total founding parents (for marketing/dashboard)
 */
router.get('/count', async (req, res) => {
  try {
    const count = await getFoundingParentCount();
    res.json({ total_founding_parents: count });
  } catch (err) {
    console.error('Founding count error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * DELETE /api/founding/:userId — Deactivate founding status (admin)
 */
router.delete('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await deactivateFoundingParent(userId);
    res.json(result);
  } catch (err) {
    console.error('Deactivate error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export { router };