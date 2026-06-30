import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/connection.js';

const router = Router();

// GET /api/favorites — List user's favorite providers
router.get('/', async (req, res) => {
  try {
    const { user_id } = req.query;

    if (!user_id) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const result = await db.execute({
      sql: `SELECT f.*, p.name as provider_name, p.category_id, p.zip_code, p.avg_rating
            FROM favorites f
            JOIN providers p ON f.provider_id = p.id
            WHERE f.user_id = ?
            ORDER BY f.created_at DESC`,
      args: [user_id],
    });

    res.json(result.rows);
  } catch (err) {
    console.error('List favorites error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/favorites — Add a favorite
router.post('/', async (req, res) => {
  try {
    const { user_id, provider_id } = req.body;

    if (!user_id || !provider_id) {
      return res.status(400).json({ message: 'User ID and provider ID are required' });
    }

    const existing = await db.execute({
      sql: 'SELECT id FROM favorites WHERE user_id = ? AND provider_id = ?',
      args: [user_id, provider_id],
    });

    if (existing.rows.length > 0) {
      return res.status(409).json({ message: 'Already in favorites' });
    }

    const id = uuidv4();
    await db.execute({
      sql: 'INSERT INTO favorites (id, user_id, provider_id) VALUES (?, ?, ?)',
      args: [id, user_id, provider_id],
    });

    res.status(201).json({ id, user_id, provider_id, message: 'Added to favorites' });
  } catch (err) {
    console.error('Add favorite error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/favorites/:providerId — Remove a favorite
router.delete('/:providerId', async (req, res) => {
  try {
    const { user_id } = req.query;

    if (!user_id) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const result = await db.execute({
      sql: 'DELETE FROM favorites WHERE user_id = ? AND provider_id = ?',
      args: [user_id, req.params.providerId],
    });

    if (result.rowsAffected === 0) {
      return res.status(404).json({ message: 'Favorite not found' });
    }

    res.json({ message: 'Removed from favorites' });
  } catch (err) {
    console.error('Remove favorite error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export { router };