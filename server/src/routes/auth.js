import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/connection.js';
import { enrollFoundingParent, isFoundingWindowOpen } from '../services/founding-parents.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'kidcircle-dev-secret';

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, zip_code } = req.body;

    if (!email || !password || !name || !zip_code) {
      return res.status(400).json({ message: 'Email, password, name, and zip code are required' });
    }

    const existing = await db.execute({
      sql: 'SELECT id FROM users WHERE email = ?',
      args: [email],
    });

    if (existing.rows.length > 0) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const id = uuidv4();
    const password_hash = await bcrypt.hash(password, 10);

    await db.execute({
      sql: 'INSERT INTO users (id, email, password_hash, name, zip_code) VALUES (?, ?, ?, ?, ?)',
      args: [id, email, password_hash, name, zip_code],
    });

    // Handle Founding Parent program
    let isFounding = false;
    if (isFoundingWindowOpen()) {
      try {
        await enrollFoundingParent(id);
        isFounding = true;
      } catch (fpErr) {
        console.error('Founding parent enrollment failed:', fpErr.message);
      }
    }

    const token = jwt.sign({ userId: id, email }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ 
      token, 
      user: { 
        id, 
        email, 
        name, 
        zip_code, 
        tier: 'free',
        is_founding_parent: isFounding ? 1 : 0,
        founding_discount_percent: isFounding ? 15 : null
      } 
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const result = await db.execute({
      sql: 'SELECT * FROM users WHERE email = ?',
      args: [email],
    });

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = result.rows[0];

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        zip_code: user.zip_code,
        tier: user.tier,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/auth/me
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const result = await db.execute({
      sql: 'SELECT id, email, name, zip_code, phone, avatar_url, tier, bio, created_at FROM users WHERE id = ?',
      args: [decoded.userId],
    });

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Auth me error:', err);
    res.status(401).json({ message: 'Invalid token' });
  }
});

export { router };
export { JWT_SECRET };