/**
 * Site Traffic Monitoring Middleware
 * Logs every API request to the site_traffic table for analytics.
 */
import { v4 as uuidv4 } from 'uuid';
import db from '../db/connection.js';

/**
 * Middleware: Log request to site_traffic table
 * Tracks path, method, user (if authenticated), referrer, user-agent, IP, response time
 */
export async function trafficLogger(req, res, next) {
  const start = Date.now();

  // Capture the original end to calculate duration
  const originalEnd = res.end;
  res.end = function (...args) {
    const duration = Date.now() - start;
    logTraffic(req, duration);
    originalEnd.apply(res, args);
  };

  next();
}

async function logTraffic(req, duration) {
  try {
    // Extract user ID from JWT if available (without requiring auth)
    let userId = null;
    if (req.user) {
      userId = req.user.id || req.user.userId;
    }

    const id = uuidv4();
    await db.execute({
      sql: `INSERT INTO site_traffic (id, path, method, user_id, referrer, user_agent, ip_address, duration_ms)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        req.path,
        req.method,
        userId,
        req.get('Referrer') || null,
        req.get('User-Agent') || null,
        req.ip || req.connection?.remoteAddress || null,
        duration,
      ],
    });
  } catch (err) {
    // Silently fail — don't let logging break the app
    console.error('Traffic log error:', err.message);
  }
}

/**
 * Query traffic statistics
 */
export async function getTrafficStats({ days = 7 } = {}) {
  const trafficResult = await db.execute({
    sql: `SELECT 
          COUNT(*) as total_views,
          COUNT(DISTINCT ip_address) as unique_visitors,
          COUNT(DISTINCT CASE WHEN user_id IS NOT NULL THEN user_id END) as authenticated_users,
          ROUND(AVG(duration_ms), 0) as avg_duration_ms
          FROM site_traffic
          WHERE created_at >= datetime('now', ?)`,
    args: [`-${days} days`],
  });

  const usersResult = await db.execute({
    sql: 'SELECT COUNT(*) as total_users FROM users',
    args: [],
  });

  return {
    ...trafficResult.rows[0],
    total_users: usersResult.rows[0].total_users
  };
}

/**
 * Get most visited paths
 */
export async function getTopPaths({ days = 7, limit = 20 } = {}) {
  const result = await db.execute({
    sql: `SELECT path, method, COUNT(*) as views,
          ROUND(AVG(duration_ms), 0) as avg_duration_ms,
          MAX(created_at) as last_visited
          FROM site_traffic
          WHERE created_at >= datetime('now', ?)
          GROUP BY path, method
          ORDER BY views DESC
          LIMIT ?`,
    args: [`-${days} days`, limit],
  });

  return result.rows;
}

/**
 * Get daily traffic for charts
 */
export async function getDailyTraffic({ days = 7 } = {}) {
  const result = await db.execute({
    sql: `SELECT DATE(created_at) as date,
          COUNT(*) as views,
          COUNT(DISTINCT ip_address) as visitors
          FROM site_traffic
          WHERE created_at >= datetime('now', ?)
          GROUP BY DATE(created_at)
          ORDER BY date ASC`,
    args: [`-${days} days`],
  });

  return result.rows;
}

/**
 * Get hourly traffic for today
 */
export async function getHourlyTraffic() {
  const result = await db.execute({
    sql: `SELECT STRFTIME('%H', created_at) as hour,
          COUNT(*) as views
          FROM site_traffic
          WHERE created_at >= datetime('now', '-24 hours')
          GROUP BY hour
          ORDER BY hour ASC`,
    args: [],
  });

  return result.rows;
}
