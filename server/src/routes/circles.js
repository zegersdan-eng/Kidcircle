/**
 * Circles (Private Groups) API Routes
 */
import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/connection.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

/**
 * POST /api/circles — Create a new circle
 * Body: { name, type, description }
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, type, description } = req.body;
    const creator_id = req.user.id;

    if (!name) {
      return res.status(400).json({ message: 'Circle name is required' });
    }

    const circle_id = uuidv4();
    
    // Create the circle
    await db.execute({
      sql: `INSERT INTO circles (id, name, type, description, creator_id)
            VALUES (?, ?, ?, ?, ?)`,
      args: [circle_id, name, type || 'private', description || null, creator_id],
    });

    // Add the creator as the first member with 'creator' role
    await db.execute({
      sql: `INSERT INTO circle_members (circle_id, user_id, role)
            VALUES (?, ?, ?)`,
      args: [circle_id, creator_id, 'creator'],
    });

    res.status(201).json({
      message: 'Circle created successfully',
      circle: {
        id: circle_id,
        name,
        type: type || 'private',
        description,
        creator_id
      }
    });
  } catch (err) {
    console.error('Create circle error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * GET /api/circles — List circles the current user belongs to
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const user_id = req.user.id;

    const result = await db.execute({
      sql: `SELECT c.*, cm.role, cm.joined_at 
            FROM circles c
            JOIN circle_members cm ON c.id = cm.circle_id
            WHERE cm.user_id = ?
            ORDER BY c.created_at DESC`,
      args: [user_id],
    });

    res.json(result.rows);
  } catch (err) {
    console.error('List circles error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * GET /api/circles/:id — Get circle details
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const circle_id = req.params.id;
    const user_id = req.user.id;

    // Check if user is a member
    const memberCheck = await db.execute({
      sql: 'SELECT * FROM circle_members WHERE circle_id = ? AND user_id = ?',
      args: [circle_id, user_id],
    });

    if (memberCheck.rows.length === 0) {
      // If not a member, check if it's public
      const circleResult = await db.execute({
        sql: 'SELECT * FROM circles WHERE id = ?',
        args: [circle_id],
      });

      if (circleResult.rows.length === 0) {
        return res.status(404).json({ message: 'Circle not found' });
      }

      const circle = circleResult.rows[0];
      if (circle.type !== 'public') {
        return res.status(403).json({ message: 'You do not have access to this circle' });
      }

      return res.json(circle);
    }

    const result = await db.execute({
      sql: 'SELECT * FROM circles WHERE id = ?',
      args: [circle_id],
    });

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get circle error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * POST /api/circles/:id/join — Join an existing circle
 */
router.post('/:id/join', authenticate, async (req, res) => {
  try {
    const circle_id = req.params.id;
    const user_id = req.user.id;

    // Check if circle exists
    const circleResult = await db.execute({
      sql: 'SELECT * FROM circles WHERE id = ?',
      args: [circle_id],
    });

    if (circleResult.rows.length === 0) {
      return res.status(404).json({ message: 'Circle not found' });
    }

    // Check if already a member
    const memberCheck = await db.execute({
      sql: 'SELECT * FROM circle_members WHERE circle_id = ? AND user_id = ?',
      args: [circle_id, user_id],
    });

    if (memberCheck.rows.length > 0) {
      return res.status(400).json({ message: 'You are already a member of this circle' });
    }

    // Add member
    await db.execute({
      sql: 'INSERT INTO circle_members (circle_id, user_id, role) VALUES (?, ?, ?)',
      args: [circle_id, user_id, 'member'],
    });

    res.json({ message: 'Joined circle successfully' });
  } catch (err) {
    console.error('Join circle error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * GET /api/circles/:id/members — List members of a circle
 */
router.get('/:id/members', authenticate, async (req, res) => {
  try {
    const circle_id = req.params.id;
    const user_id = req.user.id;

    // Verify user is a member or it's a public circle
    const memberCheck = await db.execute({
      sql: 'SELECT * FROM circle_members WHERE circle_id = ? AND user_id = ?',
      args: [circle_id, user_id],
    });

    if (memberCheck.rows.length === 0) {
      const circleResult = await db.execute({
        sql: 'SELECT type FROM circles WHERE id = ?',
        args: [circle_id],
      });
      if (circleResult.rows.length === 0 || circleResult.rows[0].type !== 'public') {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    const result = await db.execute({
      sql: `SELECT u.id, u.name, u.email, cm.role, cm.joined_at
            FROM circle_members cm
            JOIN users u ON cm.user_id = u.id
            WHERE cm.circle_id = ?
            ORDER BY cm.joined_at ASC`,
      args: [circle_id],
    });

    res.json(result.rows);
  } catch (err) {
    console.error('List members error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * GET /api/circles/:id/feed — Get a feed of recommendations from circle members
 */
router.get('/:id/feed', authenticate, async (req, res) => {
  try {
    const circle_id = req.params.id;
    const user_id = req.user.id;

    // Verify user is a member or it's a public circle
    const memberCheck = await db.execute({
      sql: 'SELECT * FROM circle_members WHERE circle_id = ? AND user_id = ?',
      args: [circle_id, user_id],
    });

    if (memberCheck.rows.length === 0) {
      const circleResult = await db.execute({
        sql: 'SELECT type FROM circles WHERE id = ?',
        args: [circle_id],
      });
      if (circleResult.rows.length === 0) {
        return res.status(404).json({ message: 'Circle not found' });
      }
      if (circleResult.rows[0].type !== 'public') {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    // Get recommendations from all members of the circle
    const result = await db.execute({
      sql: `SELECT r.*, u.name as user_name, u.avatar_url as user_avatar, p.name as provider_name, p.logo_url as provider_logo
            FROM recommendations r
            JOIN circle_members cm ON r.user_id = cm.user_id
            JOIN users u ON r.user_id = u.id
            JOIN providers p ON r.provider_id = p.id
            WHERE cm.circle_id = ?
            ORDER BY r.created_at DESC`,
      args: [circle_id],
    });

    res.json(result.rows);
  } catch (err) {
    console.error('Circle feed error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export { router };
