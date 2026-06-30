import { Router } from 'express';
import { findMatches, getPreferences } from '../services/matching.js';

const router = Router();

/**
 * POST /api/concierge/match — AI Enrichment Concierge matching
 *
 * Accepts a family's profile and returns ranked provider recommendations
 * with match reasons and logistics tips.
 *
 * Body:
 * {
 *   "child_age": 10,             // Required
 *   "interests": ["coding", "engineering"],  // Required
 *   "zip_code": "78613",         // Required
 *   "traffic_tolerance": "medium", // Optional: low, medium, high
 *   "schedule": "after-school"    // Optional
 * }
 */
router.post('/match', async (req, res) => {
  try {
    const { child_age, interests, zip_code, traffic_tolerance, schedule } = req.body;

    // Validate required fields
    const errors = [];
    if (!child_age || typeof child_age !== 'number') {
      errors.push('child_age is required (number)');
    }
    if (!interests || !Array.isArray(interests) || interests.length === 0) {
      errors.push('interests is required (non-empty array)');
    }
    if (!zip_code || typeof zip_code !== 'string') {
      errors.push('zip_code is required (string)');
    }
    if (traffic_tolerance && !['low', 'medium', 'high'].includes(traffic_tolerance)) {
      errors.push('traffic_tolerance must be low, medium, or high');
    }

    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const results = await findMatches({
      childAge: child_age,
      interests,
      zipCode: zip_code,
      trafficTolerance: traffic_tolerance || 'medium',
      schedule,
    });

    res.json({
      query: { child_age, interests, zip_code, traffic_tolerance: traffic_tolerance || 'medium' },
      total_matches: results.length,
      recommendations: results,
    });
  } catch (err) {
    console.error('Concierge match error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * GET /api/concierge/preferences — Returns available interest tags and neighborhoods
 * for building the intake form.
 */
router.get('/preferences', (req, res) => {
  try {
    const prefs = getPreferences();
    res.json(prefs);
  } catch (err) {
    console.error('Concierge preferences error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export { router };