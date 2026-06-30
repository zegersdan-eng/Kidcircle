/**
 * Traffic Analytics API — Endpoints for the Analytics Dashboard
 */
import { Router } from 'express';
import { getTrafficStats, getTopPaths, getDailyTraffic, getHourlyTraffic } from '../services/traffic.js';
import { seedTrafficData } from '../db/seed-traffic.js';

const router = Router();

/**
 * GET /api/traffic/seed — Seed sample traffic data (admin endpoint)
 */
router.get('/seed', async (req, res) => {
  try {
    const count = await seedTrafficData(parseInt(req.query.rows) || 200);
    res.json({ message: `Seeded ${count} traffic records`, count });
  } catch (err) {
    console.error('Seed error:', err);
    res.status(500).json({ message: 'Seed failed', error: err.message });
  }
});

/**
 * GET /api/traffic/stats — Overview statistics
 * Query: days (default 7)
 */
router.get('/stats', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const stats = await getTrafficStats({ days });
    res.json(stats);
  } catch (err) {
    console.error('Traffic stats error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * GET /api/traffic/paths — Most visited paths
 * Query: days (default 7), limit (default 20)
 */
router.get('/paths', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const limit = parseInt(req.query.limit) || 20;
    const paths = await getTopPaths({ days, limit });
    res.json(paths);
  } catch (err) {
    console.error('Traffic paths error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * GET /api/traffic/daily — Daily traffic for charts
 * Query: days (default 7)
 */
router.get('/daily', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const daily = await getDailyTraffic({ days });
    res.json(daily);
  } catch (err) {
    console.error('Traffic daily error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * GET /api/traffic/hourly — Hourly traffic for today
 */
router.get('/hourly', async (req, res) => {
  try {
    const hourly = await getHourlyTraffic();
    res.json(hourly);
  } catch (err) {
    console.error('Traffic hourly error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export { router };