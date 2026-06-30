#!/usr/bin/env node
/**
 * seed-shared-db.js — Migrate schema and import seed data into the shared Turso database.
 * Uses team-db CLI for schema operations (syncs to Turso) and direct libSQL connection for bulk data.
 */

import { createClient } from '@libsql/client';
import { readFileSync } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { execSync } from 'child_process';

// ============================================================
// 1. Create schema via team-db CLI (syncs to Turso)
// ============================================================
const TEAM_DB = 'team-db';

function td(sql) {
  console.log(`  team-db: ${sql.substring(0, 80)}...`);
  try {
    const result = execSync(`${TEAM_DB} "${sql.replace(/"/g, '\\"')}"`, { encoding: 'utf-8' });
    return JSON.parse(result);
  } catch (e) {
    console.error(`  ERROR: ${e.message}`);
    return null;
  }
}

console.log('\n=== Creating tables ===\n');

// Drop existing KidCircle tables if they exist (clean slate)
const tables = ['favorites', 'subscriptions', 'bookings', 'recommendations', 'providers', 'categories', 'children', 'users'];
for (const t of tables) {
  td(`DROP TABLE IF EXISTS ${t}`);
}

// Users
td(`CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL,
  name TEXT NOT NULL, phone TEXT, zip_code TEXT NOT NULL, avatar_url TEXT,
  tier TEXT NOT NULL DEFAULT 'free' CHECK(tier IN ('free', 'pro')),
  bio TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
)`);

// Children
td(`CREATE TABLE IF NOT EXISTS children (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL, age INTEGER NOT NULL CHECK(age >= 0 AND age <= 18),
  interests TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`);

// Categories
td(`CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY, name TEXT UNIQUE NOT NULL, slug TEXT UNIQUE NOT NULL,
  icon TEXT, description TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`);

// Providers
td(`CREATE TABLE IF NOT EXISTS providers (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT,
  category_id TEXT NOT NULL REFERENCES categories(id),
  owner_name TEXT, email TEXT, phone TEXT, website TEXT, address TEXT,
  zip_code TEXT NOT NULL, lat REAL, lng REAL, verified INTEGER NOT NULL DEFAULT 0,
  tier TEXT NOT NULL DEFAULT 'free' CHECK(tier IN ('free', 'premium')),
  avg_rating REAL DEFAULT 0, review_count INTEGER DEFAULT 0,
  logo_url TEXT, photos TEXT, age_range_min INTEGER DEFAULT 5,
  age_range_max INTEGER DEFAULT 14, price_range TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
)`);

// Recommendations
td(`CREATE TABLE IF NOT EXISTS recommendations (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider_id TEXT NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
  title TEXT, body TEXT, verified_use INTEGER NOT NULL DEFAULT 0,
  child_age_at_time INTEGER, child_interest TEXT,
  would_recommend INTEGER NOT NULL DEFAULT 1, helpful_count INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, provider_id)
)`);

// Bookings
td(`CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider_id TEXT NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  recommendation_id TEXT REFERENCES recommendations(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','confirmed','completed','cancelled')),
  amount REAL, commission REAL, commission_paid INTEGER NOT NULL DEFAULT 0,
  notes TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
)`);

// Subscriptions (updated with Pro $9.99/mo, Partner $25/mo)
td(`CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tier TEXT NOT NULL CHECK(tier IN ('pro', 'partner')),
  plan_type TEXT NOT NULL DEFAULT 'monthly' CHECK(plan_type IN ('monthly', 'yearly')),
  start_date TEXT NOT NULL, end_date TEXT, auto_renew INTEGER NOT NULL DEFAULT 1,
  payment_method TEXT, amount REAL NOT NULL, active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id)
)`);

// Favorites
td(`CREATE TABLE IF NOT EXISTS favorites (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider_id TEXT NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, provider_id)
)`);

// Indexes
console.log('\n=== Creating indexes ===\n');
const indexes = [
  'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
  'CREATE INDEX IF NOT EXISTS idx_users_zip ON users(zip_code)',
  'CREATE INDEX IF NOT EXISTS idx_children_user_id ON children(user_id)',
  'CREATE INDEX IF NOT EXISTS idx_providers_zip ON providers(zip_code)',
  'CREATE INDEX IF NOT EXISTS idx_providers_category ON providers(category_id)',
  'CREATE INDEX IF NOT EXISTS idx_providers_verified ON providers(verified)',
  'CREATE INDEX IF NOT EXISTS idx_providers_active ON providers(active)',
  'CREATE INDEX IF NOT EXISTS idx_recommendations_provider ON recommendations(provider_id)',
  'CREATE INDEX IF NOT EXISTS idx_recommendations_user ON recommendations(user_id)',
  'CREATE INDEX IF NOT EXISTS idx_recommendations_created ON recommendations(created_at)',
  'CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id)',
  'CREATE INDEX IF NOT EXISTS idx_bookings_provider ON bookings(provider_id)',
  'CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status)',
  'CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id)',
];
for (const idx of indexes) td(idx);

// ============================================================
// 2. Seed data via direct Turso connection (bulk insert)
// ============================================================
console.log('\n=== Connecting to Turso for bulk seed data ===\n');

const tursoUrl = process.env.TEAM_DB_URL;
const tursoToken = process.env.TEAM_DB_AUTH_TOKEN;

if (!tursoUrl || !tursoToken) {
  console.error('ERROR: TEAM_DB_URL and TEAM_DB_AUTH_TOKEN must be set');
  process.exit(1);
}

const db = createClient({ url: tursoUrl, authToken: tursoToken });

// Seed categories
console.log('--- Seeding categories ---');
const categories = [
  ['cat-tutoring', 'Tutoring', 'tutoring', 'book', 'Academic tutoring and homework help'],
  ['cat-camp', 'Summer Camp', 'camp', 'sun', 'Summer day camps and overnight camps'],
  ['cat-music', 'Music', 'music', 'music', 'Music lessons and classes'],
  ['cat-sports', 'Sports', 'sports', 'ball', 'Sports coaching, teams, and activities'],
  ['cat-art', 'Art & Crafts', 'art', 'palette', 'Art classes, crafts, and creative workshops'],
  ['cat-coding', 'Coding & Tech', 'coding', 'code', 'Computer programming and technology classes'],
  ['cat-language', 'Language', 'language', 'globe', 'Foreign language classes and tutoring'],
  ['cat-math', 'Math', 'math', 'calculator', 'Math tutoring and enrichment'],
  ['cat-dance', 'Dance', 'dance', 'dancer', 'Dance classes and lessons'],
  ['cat-science', 'Science', 'science', 'flask', 'STEM classes and science programs'],
];

for (const [id, name, slug, icon, desc] of categories) {
  await db.execute({
    sql: 'INSERT OR IGNORE INTO categories (id, name, slug, icon, description) VALUES (?, ?, ?, ?, ?)',
    args: [id, name, slug, icon, desc],
  });
}
console.log(`  ${categories.length} categories seeded`);

// ---- Parse CSV files ----
function parseCSV(text) {
  const lines = text.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).map(line => {
    const values = [];
    let current = '';
    let inQuotes = false;
    for (const ch of line) {
      if (ch === '"') { inQuotes = !inQuotes; }
      else if (ch === ',' && !inQuotes) { values.push(current.trim()); current = ''; }
      else { current += ch; }
    }
    values.push(current.trim());
    const obj = {};
    headers.forEach((h, i) => obj[h] = values[i] || '');
    return obj;
  });
}

const csv1 = readFileSync('/home/team/shared/pilot_providers.csv', 'utf-8');
const csv2 = readFileSync('/home/team/shared/pilot_providers_batch2.csv', 'utf-8');

const providers1 = parseCSV(csv1);
const providers2 = parseCSV(csv2);

// Category name -> id mapping
const categoryMap = {
  'Art': 'cat-art',
  'Science': 'cat-science',
  'STEM': 'cat-science',
  'Coding': 'cat-coding',
  'General': 'cat-camp',
  'Improv': 'cat-art',
  'Drama': 'cat-art',
  'Performing Arts': 'cat-art',
  'STEM/Building': 'cat-coding',
  'Science/Discovery': 'cat-science',
  'Music': 'cat-music',
  'Language': 'cat-language',
  'Sports': 'cat-sports',
  'General/Enrichment': 'cat-camp',
};

// Seed providers (batch1)
console.log('\n--- Seeding providers (batch 1) ---');
const providerIdMap = {};

for (const p of providers1) {
  const id = uuidv4();
  const catName = p.Category.trim();
  const catId = categoryMap[catName] || 'cat-tutoring';
  providerIdMap[p.Name] = id;

  await db.execute({
    sql: `INSERT OR IGNORE INTO providers (id, name, description, category_id, website, zip_code, verified)
          VALUES (?, ?, ?, ?, ?, ?, 1)`,
    args: [id, p.Name, p.Description, catId, p.Website, '78701'],
  });
  console.log(`  Added: ${p.Name} (${catName})`);
}

// Seed providers (batch2)
console.log('\n--- Seeding providers (batch 2) ---');
for (const p of providers2) {
  const id = uuidv4();
  const catName = p.Category.trim();
  const catId = categoryMap[catName] || 'cat-tutoring';
  providerIdMap[p.Name] = id;

  // Parse age range
  let ageMin = 5, ageMax = 14;
  const ageMatch = p['Age Range'] ? p['Age Range'].match(/(\d+)\s*-\s*(\d+)/) : null;
  if (ageMatch) {
    ageMin = parseInt(ageMatch[1]);
    ageMax = parseInt(ageMatch[2]);
  }

  await db.execute({
    sql: `INSERT OR IGNORE INTO providers (id, name, description, category_id, website, phone,
          address, zip_code, age_range_min, age_range_max, verified)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
    args: [id, p.Name, p['Value Prop'], catId, p.Website, p.Phone, p['Street Address'], p['Zip Code'], ageMin, ageMax],
  });
  console.log(`  Added: ${p.Name} (${catName})`);
}

// ---- Seed reviews from JSON ----
console.log('\n--- Seeding reviews (creating fake users + recommendations) ---');
const reviewsData = JSON.parse(readFileSync('/home/team/shared/seed_reviews.json', 'utf-8'));

let userCount = 0;
let reviewCount = 0;
const userNameToId = {};

for (const entry of reviewsData) {
  const providerName = entry.provider_name;
  const providerId = providerIdMap[providerName];
  if (!providerId) {
    console.log(`  WARNING: No provider found for "${providerName}", skipping reviews`);
    continue;
  }

  for (const review of entry.reviews) {
    // Create a unique user for each reviewer
    if (!userNameToId[review.parent_name]) {
      const userId = uuidv4();
      userNameToId[review.parent_name] = userId;
      const email = `${review.parent_name.toLowerCase().replace(/[^a-z]/g, '')}@example.com`;
      const zip = providerName.includes('Round Rock') || providerName.includes('Cedar Park') ? '78681' : '78701';

      await db.execute({
        sql: 'INSERT OR IGNORE INTO users (id, email, password_hash, name, zip_code, tier) VALUES (?, ?, ?, ?, ?, ?)',
        args: [userId, email, '$2a$10$placeholder', review.parent_name, zip, 'free'],
      });
      userCount++;
    }

    const userId = userNameToId[review.parent_name];
    const reviewId = uuidv4();

    try {
      await db.execute({
        sql: `INSERT INTO recommendations (id, user_id, provider_id, rating, body, verified_use, would_recommend)
              VALUES (?, ?, ?, ?, ?, 1, 1)`,
        args: [reviewId, userId, providerId, review.rating, review.comment],
      });
      reviewCount++;
    } catch (e) {
      // Skip duplicate recommendations (same user->provider)
    }
  }
}
console.log(`  ${userCount} users created`);
console.log(`  ${reviewCount} reviews imported`);

// ---- Update provider avg_rating and review_count ----
console.log('\n--- Updating provider ratings ---');
for (const providerName of Object.keys(providerIdMap)) {
  const providerId = providerIdMap[providerName];
  await db.execute({
    sql: `UPDATE providers SET
          avg_rating = (SELECT ROUND(AVG(rating), 1) FROM recommendations WHERE provider_id = ?),
          review_count = (SELECT COUNT(*) FROM recommendations WHERE provider_id = ?)
          WHERE id = ?`,
    args: [providerId, providerId, providerId],
  });
}

// ---- Store pricing config ----
console.log('\n--- Storing pricing configuration ---');
await db.execute({
  sql: "INSERT OR REPLACE INTO config (key, value) VALUES ('pricing_pro_monthly', '9.99')",
});
await db.execute({
  sql: "INSERT OR REPLACE INTO config (key, value) VALUES ('pricing_pro_yearly', '95.00')",
});
await db.execute({
  sql: "INSERT OR REPLACE INTO config (key, value) VALUES ('pricing_partner_monthly', '25.00')",
});

console.log('\n=== Database seeding complete! ===');
console.log(`  Providers: ${Object.keys(providerIdMap).length}`);
console.log(`  Users: ${userCount}`);
console.log(`  Reviews: ${reviewCount}`);

// Verify
const result = await db.execute('SELECT COUNT(*) as cnt FROM providers');
console.log(`\n  Total providers in DB: ${result.rows[0].cnt}`);

db.close();
