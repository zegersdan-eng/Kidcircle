import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/connection.js';

const router = Router();

// POST /api/bookings — Create a booking (affiliate click)
router.post('/', async (req, res) => {
  try {
    const { user_id, provider_id, recommendation_id, amount, notes } = req.body;

    if (!user_id || !provider_id) {
      return res.status(400).json({ message: 'User ID and provider ID are required' });
    }

    const id = uuidv4();
    const commission = amount ? amount * 0.1 : 0; // 10% default commission

    await db.execute({
      sql: `INSERT INTO bookings (id, user_id, provider_id, recommendation_id, amount, commission, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [id, user_id, provider_id, recommendation_id || null, amount || null, commission, notes || null],
    });

    const result = await db.execute({
      sql: 'SELECT * FROM bookings WHERE id = ?',
      args: [id],
    });

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create booking error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/bookings — List user's bookings
router.get('/', async (req, res) => {
  try {
    const { user_id } = req.query;

    if (!user_id) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const result = await db.execute({
      sql: `SELECT b.*, p.name as provider_name
            FROM bookings b
            JOIN providers p ON b.provider_id = p.id
            WHERE b.user_id = ?
            ORDER BY b.created_at DESC`,
      args: [user_id],
    });

    res.json(result.rows);
  } catch (err) {
    console.error('List bookings error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export { router };