import { Router } from 'express';
import {
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} from '../services/notifications.js';

const router = Router();

/**
 * GET /api/notifications — Get user notifications
 * Query: userId (required), limit, offset, unreadOnly
 */
router.get('/', async (req, res) => {
  try {
    const { userId, limit, offset, unreadOnly } = req.query;

    if (!userId) {
      return res.status(400).json({ message: 'userId query parameter is required' });
    }

    const notifications = await getUserNotifications(userId, {
      limit: parseInt(limit) || 50,
      offset: parseInt(offset) || 0,
      unreadOnly: unreadOnly === 'true',
    });

    res.json({ notifications });
  } catch (err) {
    console.error('Get notifications error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * GET /api/notifications/unread-count — Get unread count for a user
 * Query: userId (required)
 */
router.get('/unread-count', async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ message: 'userId query parameter is required' });
    }

    const count = await getUnreadCount(userId);
    res.json({ unread_count: count });
  } catch (err) {
    console.error('Unread count error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * PATCH /api/notifications/:id/read — Mark a single notification as read
 */
router.patch('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    await markAsRead(id);
    res.json({ message: 'Notification marked as read' });
  } catch (err) {
    console.error('Mark read error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * POST /api/notifications/mark-all-read — Mark all notifications as read for a user
 * Body: { userId }
 */
router.post('/mark-all-read', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'userId is required' });
    }

    await markAllAsRead(userId);
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    console.error('Mark all read error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export { router };
