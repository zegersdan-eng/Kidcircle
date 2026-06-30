/**
 * Seed traffic data for the Analytics Dashboard
 * Inserts realistic historical page_views so the dashboard has data on launch day.
 */
import { v4 as uuidv4 } from 'uuid';
import db from './connection.js';

const SEED_PATHS = [
  { path: '/', method: 'GET', weight: 5 },
  { path: '/discover', method: 'GET', weight: 4 },
  { path: '/concierge', method: 'GET', weight: 3 },
  { path: '/register', method: 'GET', weight: 2 },
  { path: '/login', method: 'GET', weight: 2 },
  { path: '/profile', method: 'GET', weight: 1 },
  { path: '/circle', method: 'GET', weight: 1 },
  { path: '/swap-marketplace', method: 'GET', weight: 1 },
  { path: '/partner', method: 'GET', weight: 1 },
  { path: '/analytics-dashboard', method: 'GET', weight: 0.5 },
  { path: '/api/auth/login', method: 'POST', weight: 1 },
  { path: '/api/auth/register', method: 'POST', weight: 0.5 },
  { path: '/api/concierge/match', method: 'POST', weight: 0.5 },
  { path: '/api/notifications', method: 'GET', weight: 0.5 },
];

const SEED_IPS = [
  '192.168.1.100', '192.168.1.101', '192.168.1.102',
  '10.0.0.50', '10.0.0.51', '10.0.0.52', '10.0.0.53',
  '172.16.0.25', '172.16.0.26',
];

const SEED_UAS = [
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
  'Mozilla/5.0 (Android 13; Mobile; rv:109.0) Gecko/109.0 Firefox/109.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomWeightedPaths() {
  const pool = [];
  for (const p of SEED_PATHS) {
    for (let i = 0; i < p.weight; i++) {
      pool.push(p);
    }
  }
  return pool;
}

function minutesAgo(minutes) {
  const d = new Date();
  d.setMinutes(d.getMinutes() - minutes);
  return d.toISOString().replace('T', ' ').slice(0, 19);
}

export async function seedTrafficData(rows = 200) {
  // Check if data already exists
  const existing = await db.execute('SELECT COUNT(*) as count FROM site_traffic');
  if (existing.rows[0].count > 10) {
    console.log(`Traffic data already seeded (${existing.rows[0].count} rows), skipping.`);
    return existing.rows[0].count;
  }

  const paths = randomWeightedPaths();
  const now = new Date();

  // Create traffic spread over the last 14 days
  let inserted = 0;
  const batchSize = 25;

  for (let i = 0; i < rows; i++) {
    const minutesAgo_ = Math.floor(Math.random() * 60 * 24 * 14); // up to 14 days ago
    const p = pick(paths);
    const duration = Math.floor(100 + Math.random() * 8000); // 100ms to 8s

    const id = uuidv4().replace(/-/g, '').slice(0, 16); // shorter ID for speed
    const createdAt = minutesAgo(minutesAgo_);

    await db.execute({
      sql: `INSERT OR IGNORE INTO site_traffic (id, path, method, user_id, referrer, user_agent, ip_address, duration_ms, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        p.path,
        p.method,
        Math.random() > 0.7 ? uuidv4().slice(0, 8) : null,
        Math.random() > 0.8 ? 'https://google.com/search?q=kidcircle+austin' : null,
        pick(SEED_UAS),
        pick(SEED_IPS),
        duration,
        createdAt,
      ],
    });

    inserted++;

    // Batch log
    if (inserted % batchSize === 0) {
      console.log(`Seeded ${inserted}/${rows} traffic records...`);
    }
  }

  console.log(`✅ Seeded ${inserted} traffic records.`);
  return inserted;
}

// Run directly
if (process.argv[1]?.endsWith('seed-traffic.js')) {
  const count = parseInt(process.argv[2]) || 200;
  seedTrafficData(count).then(c => {
    console.log(`Done. ${c} records inserted.`);
    process.exit(0);
  }).catch(err => {
    console.error('Seed failed:', err);
    process.exit(1);
  });
}