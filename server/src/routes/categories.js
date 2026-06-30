import { Router } from 'express';
import db from '../db/connection.js';

const router = Router();

// GET /api/categories — List all categories
router.get('/', async (req, res) => {
  try {
    const result = await db.execute({
      sql: 'SELECT * FROM categories ORDER BY name',
    });
    res.json(result.rows);
  } catch (err) {
    console.error('List categories error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export { router };