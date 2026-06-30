import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/connection.js';

const router = Router();

// GET /api/recommendations — List recommendations
router.get('/', async (req, res) => {
  try {
    const { provider_id, user_id, sort = 'recent', limit = 20, offset = 0 } = req.query;

    let sql = `SELECT r.*, u.name as user_name, u.avatar_url as user_avatar
               FROM recommendations r
               JOIN users u ON r.user_id = u.id
               WHERE 1=1`;
    const args = [];

    if (provider_id) {
      sql += ' AND r.provider_id = ?';
      args.push(provider_id);
    }

    if (user_id) {
      sql += ' AND r.user_id = ?';
      args.push(user_id);
    }

    if (sort === 'top') {
      sql += ' ORDER BY r.rating DESC, r.helpful_count DESC';
    } else if (sort === 'helpful') {
      sql += ' ORDER BY r.helpful_count DESC';
    } else {
      sql += ' ORDER BY r.created_at DESC';
    }

    sql += ' LIMIT ? OFFSET ?';
    args.push(Number(limit), Number(offset));

    const result = await db.execute({ sql, args });
    res.json(result.rows);
  } catch (err) {
    console.error('List recommendations error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/recommendations — Create a recommendation
router.post('/', async (req, res) => {
  try {
    const { user_id, provider_id, rating, title, body, child_age_at_time, child_interest } = req.body;

    if (!user_id || !provider_id || !rating) {
      return res.status(400).json({ message: 'User ID, provider ID, and rating are required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    // Check for duplicate
    const existing = await db.execute({
      sql: 'SELECT id FROM recommendations WHERE user_id = ? AND provider_id = ?',
      args: [user_id, provider_id],
    });

    if (existing.rows.length > 0) {
      return res.status(409).json({ message: 'You have already recommended this provider' });
    }

    const id = uuidv4();
    await db.execute({
      sql: `INSERT INTO recommendations (id, user_id, provider_id, rating, title, body, child_age_at_time, child_interest)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [id, user_id, provider_id, rating, title || null, body || null, child_age_at_time || null, child_interest || null],
    });

    // Update provider avg_rating and review_count
    await db.execute({
      sql: `UPDATE providers SET
            avg_rating = (SELECT ROUND(AVG(rating), 1) FROM recommendations WHERE provider_id = ?),
            review_count = (SELECT COUNT(*) FROM recommendations WHERE provider_id = ?)
            WHERE id = ?`,
      args: [provider_id, provider_id, provider_id],
    });

    const result = await db.execute({
      sql: 'SELECT * FROM recommendations WHERE id = ?',
      args: [id],
    });

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create recommendation error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/recommendations/:id — Edit a recommendation
router.patch('/:id', async (req, res) => {
  try {
    const { rating, title, body, child_age_at_time, child_interest } = req.body;
    const id = req.params.id;

    const existing = await db.execute({
      sql: 'SELECT provider_id FROM recommendations WHERE id = ?',
      args: [id],
    });

    if (existing.rows.length === 0) {
      return res.status(404).json({ message: 'Recommendation not found' });
    }

    const provider_id = existing.rows[0].provider_id;

    const updates = [];
    const args = [];

    if (rating !== undefined) {
      updates.push('rating = ?');
      args.push(rating);
    }
    if (title !== undefined) {
      updates.push('title = ?');
      args.push(title);
    }
    if (body !== undefined) {
      updates.push('body = ?');
      args.push(body);
    }
    if (child_age_at_time !== undefined) {
      updates.push('child_age_at_time = ?');
      args.push(child_age_at_time);
    }
    if (child_interest !== undefined) {
      updates.push('child_interest = ?');
      args.push(child_interest);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    updates.push("updated_at = datetime('now')");
    args.push(id);

    await db.execute({
      sql: `UPDATE recommendations SET ${updates.join(', ')} WHERE id = ?`,
      args,
    });

    // Recalculate provider average
    await db.execute({
      sql: `UPDATE providers SET
            avg_rating = (SELECT ROUND(AVG(rating), 1) FROM recommendations WHERE provider_id = ?)
            WHERE id = ?`,
      args: [provider_id, provider_id],
    });

    const result = await db.execute({
      sql: 'SELECT * FROM recommendations WHERE id = ?',
      args: [id],
    });

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update recommendation error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export { router };