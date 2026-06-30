import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/connection.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

/**
 * Helper to generate a URL-friendly slug
 */
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')     // Replace spaces with -
    .replace(/[^\w-]+/g, '')   // Remove all non-word chars
    .replace(/--+/g, '-');    // Replace multiple - with single -
}

/**
 * Determine if a provider qualifies for the "Parent Verified" badge.
 * Criteria: 4.2+ avg rating, 3+ reviews, profile complete (has desc + contact)
 */
function qualifiesForBadge(provider) {
  if (!provider) return false;
  const rating = provider.avg_rating || 0;
  const reviews = provider.review_count || 0;
  // Profile completion check
  const hasDescription = provider.description && provider.description.length > 0;
  const hasContact = provider.email || provider.phone;
  return rating >= 4.2 && reviews >= 3 && hasDescription && hasContact;
}

// GET /api/providers — List/search with Partner visibility boost
router.get('/', async (req, res) => {
  try {
    const { zip_code, category_id, q, min_rating, limit = 20, offset = 0 } = req.query;

    // Build base WHERE clause
    const conditions = ["(status = 'active' OR status IS NULL)", 'active = 1'];
    const args = [];

    if (zip_code) {
      conditions.push('zip_code = ?');
      args.push(zip_code);
    }

    if (category_id) {
      conditions.push('category_id = ?');
      args.push(category_id);
    }

    if (q) {
      conditions.push('(name LIKE ? OR description LIKE ?)');
      args.push(`%${q}%`, `%${q}%`);
    }

    if (min_rating) {
      conditions.push('avg_rating >= ?');
      args.push(Number(min_rating));
    }

    const whereClause = conditions.join(' AND ');

    // Fetch ALL matching providers (we need to sort premium first)
    const allResult = await db.execute({
      sql: `SELECT * FROM providers WHERE ${whereClause} ORDER BY
            CASE WHEN tier = 'premium' THEN 0 ELSE 1 END,
            verified DESC,
            avg_rating DESC,
            review_count DESC`,
      args,
    });

    let providers = allResult.rows.map(p => {
      const isPremium = p.tier === 'premium';
      const isVerified = qualifiesForBadge(p);

      return {
        ...p,
        featured: isPremium,
        badge: isVerified ? 'parent_verified' : (isPremium ? 'partner' : null),
      };
    });

    // Separate featured and regular providers
    const featured = providers.filter(p => p.featured).slice(0, 3); // First 3 premium
    const regular = providers.filter(p => !p.featured);

    // Apply pagination to regular results
    const offsetNum = Number(offset);
    const limitNum = Number(limit);
    const paginatedRegular = regular.slice(offsetNum, offsetNum + limitNum);

    // Combined: featured first, then paginated regular
    const result = [...featured, ...paginatedRegular];

    res.json({
      providers: result,
      featured_count: featured.length,
      total: providers.length,
      limit: limitNum,
      offset: offsetNum,
    });
  } catch (err) {
    console.error('List providers error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/providers/:id — Get provider details with badge info
router.get('/:id', async (req, res) => {
  try {
    const result = await db.execute({
      sql: 'SELECT * FROM providers WHERE id = ?',
      args: [req.params.id],
    });

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    const provider = result.rows[0];
    const isPremium = provider.tier === 'premium';
    const isVerified = qualifiesForBadge(provider);

    // Get recommendations count
    const recResult = await db.execute({
      sql: 'SELECT COUNT(*) as cnt FROM recommendations WHERE provider_id = ?',
      args: [provider.id],
    });

    res.json({
      ...provider,
      featured: isPremium,
      badge: isVerified ? 'parent_verified' : (isPremium ? 'partner' : null),
      badge_criteria: {
        rating_ok: (provider.avg_rating || 0) >= 4.2,
        reviews_ok: (provider.review_count || 0) >= 3,
        profile_ok: !!(provider.description && provider.description.length > 0 && (provider.email || provider.phone)),
      },
      recommendations_total: recResult.rows[0].cnt,
    });
  } catch (err) {
    console.error('Get provider error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/providers/:id/recommendations — Get provider's reviews
router.get('/:id/recommendations', async (req, res) => {
  try {
    const result = await db.execute({
      sql: `SELECT r.*, u.name as user_name, u.avatar_url as user_avatar
            FROM recommendations r
            JOIN users u ON r.user_id = u.id
            WHERE r.provider_id = ?
            ORDER BY r.created_at DESC
            LIMIT 50`,
      args: [req.params.id],
    });

    res.json(result.rows);
  } catch (err) {
    console.error('Get provider recommendations error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/providers — Register a new provider
router.post('/', async (req, res) => {
  try {
    const { 
      name, description, category_id, email, phone, website, address, zip_code,
      is_suggested = 0, suggested_by_user_id = null
    } = req.body;

    if (!name || !category_id || !zip_code) {
      return res.status(400).json({ message: 'Name, category, and zip code are required' });
    }

    const id = uuidv4();
    const slug = `${slugify(name)}-${id.substring(0, 5)}`;
    
    await db.execute({
      sql: `INSERT INTO providers (
              id, name, slug, description, category_id, email, phone, website, address, zip_code, 
              status, active, is_suggested, suggested_by_user_id, verified
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`,
      args: [
        id, name, slug, description || '', category_id, email || null, phone || null, 
        website || null, address || null, zip_code, 
        is_suggested ? 'pending' : 'active',
        is_suggested, suggested_by_user_id,
        is_suggested ? 0 : 0 // Suggestion defaults to unverified
      ],
    });

    const result = await db.execute({
      sql: 'SELECT * FROM providers WHERE id = ?',
      args: [id],
    });

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create provider error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============================================================
// POST /api/providers/suggest — Suggest a new provider (by a Parent)
// Protected: Requires valid JWT
// Body: { name, category_id, zip_code, description?, phone?, website? }
// ============================================================
router.post('/suggest', authenticate, async (req, res) => {
  try {
    const { name, category_id, zip_code, description, phone, website } = req.body;
    const suggesterId = req.user.id;

    if (!name || !category_id || !zip_code) {
      return res.status(400).json({ message: 'Name, category, and zip code are required' });
    }

    const id = uuidv4();
    const slug = `${slugify(name)}-${id.substring(0, 5)}`;

    await db.execute({
      sql: `INSERT INTO providers (
              id, name, slug, description, category_id, suggested_by_user_id, 
              zip_code, phone, website, status, active, is_suggested, verified,
              created_at, updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 1, 1, 0, datetime('now'), datetime('now'))`,
      args: [
        id, name, slug, description || '', category_id, suggesterId,
        zip_code, phone || null, website || null
      ],
    });

    const result = await db.execute({
      sql: 'SELECT * FROM providers WHERE id = ?',
      args: [id],
    });

    res.status(201).json({
      message: 'Provider suggested successfully. It will be reviewed by our team.',
      provider: result.rows[0],
    });
  } catch (err) {
    console.error('Provider suggest error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============================================================
// POST /api/providers/register — Self-service provider registration
// Protected: Requires valid JWT
// Body: { name, description, category_id, zip_code, phone?, website?, address? }
// ============================================================
router.post('/register', authenticate, async (req, res) => {
  try {
    const { name, description, category_id, zip_code, phone, website, address } = req.body;
    const userId = req.user.id;

    if (!name || !category_id || !zip_code) {
      return res.status(400).json({ message: 'Name, category, and zip code are required' });
    }

    // Check if user already owns a provider
    const existing = await db.execute({
      sql: 'SELECT id, name FROM providers WHERE user_id = ? LIMIT 1',
      args: [userId],
    });

    if (existing.rows.length > 0) {
      return res.status(409).json({
        message: 'You already own a provider profile',
        provider: existing.rows[0],
      });
    }

    const id = uuidv4();
    const slug = `${slugify(name)}-${id.substring(0, 5)}`;

    await db.execute({
      sql: `INSERT INTO providers (id, name, slug, description, category_id, user_id, zip_code, phone, website, address, status, active, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', 1, datetime('now'), datetime('now'))`,
      args: [id, name, slug, description || '', category_id, userId, zip_code, phone || null, website || null, address || null],
    });

    const result = await db.execute({
      sql: 'SELECT * FROM providers WHERE id = ?',
      args: [id],
    });

    res.status(201).json({
      message: 'Provider registered successfully',
      provider: result.rows[0],
    });
  } catch (err) {
    console.error('Provider register error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============================================================
// PATCH /api/providers/:id/claim — Claim an existing unclaimed provider
// Protected: Requires valid JWT
// ============================================================
router.patch('/:id/claim', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Find the provider
    const provResult = await db.execute({
      sql: 'SELECT * FROM providers WHERE id = ?',
      args: [id],
    });

    if (provResult.rows.length === 0) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    const provider = provResult.rows[0];

    // Check if already claimed
    if (provider.user_id) {
      if (provider.user_id === userId) {
        return res.json({ message: 'You already own this provider', provider });
      }
      return res.status(409).json({
        message: 'This provider has already been claimed by another user',
        claimed_by: provider.user_id,
      });
    }

    // Claim the provider: link userId
    await db.execute({
      sql: "UPDATE providers SET user_id = ?, updated_at = datetime('now') WHERE id = ?",
      args: [userId, id],
    });

    const result = await db.execute({
      sql: 'SELECT * FROM providers WHERE id = ?',
      args: [id],
    });

    res.json({
      message: 'Provider claimed successfully',
      provider: result.rows[0],
    });
  } catch (err) {
    console.error('Provider claim error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export { router };