#!/usr/bin/env node
/**
 * import-batch3.js — Import Batch 3 Austin providers into shared Turso database.
 */
import { createClient } from '@libsql/client';
import { readFileSync } from 'fs';
import { v4 as uuidv4 } from 'uuid';

const tursoUrl = process.env.TEAM_DB_URL;
const tursoToken = process.env.TEAM_DB_AUTH_TOKEN;
const db = createClient({ url: tursoUrl, authToken: tursoToken });

// Wrapper for @libsql HTTP compatibility
async function query(sql, args = []) {
  return db.execute({ sql, args });
}

// Parse CSV
function parseCSV(text) {
  const lines = text.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  return lines.slice(1).map(line => {
    const values = [];
    let current = '';
    let inQuotes = false;
    for (const ch of line) {
      if (ch === '"') inQuotes = !inQuotes;
      else if (ch === ',' && !inQuotes) { values.push(current.trim()); current = ''; }
      else current += ch;
    }
    values.push(current.trim());
    const obj = {};
    headers.forEach((h, i) => obj[h] = values[i] || '');
    return obj;
  });
}

const csv = readFileSync('/home/team/shared/pilot_providers_batch3.csv', 'utf-8');
const providers = parseCSV(csv);

const categoryMap = {
  'Martial Arts': 'cat-sports',
  'Dance': 'cat-dance',
  'Performing Arts/Dance': 'cat-dance',
  'Cooking': 'cat-art',
  'Outdoor/Camp': 'cat-camp',
  'Nature/Outdoor': 'cat-science',
  'Academic Tutoring': 'cat-tutoring',
};

console.log(`Importing ${providers.length} providers from Batch 3...\n`);

let count = 0;
for (const p of providers) {
  const id = uuidv4();
  const catName = p.Category.trim();
  const catId = categoryMap[catName] || 'cat-tutoring';

  let ageMin = 5, ageMax = 14;
  const ageMatch = p['Age Range'] ? p['Age Range'].match(/(\d+)\s*-\s*(\d+)/) : null;
  if (ageMatch) {
    ageMin = parseInt(ageMatch[1]);
    ageMax = parseInt(ageMatch[2]);
  }

  try {
    await query(
      `INSERT OR IGNORE INTO providers (id, name, description, category_id, website, phone,
        address, zip_code, age_range_min, age_range_max, verified)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [id, p.Name, p['Value Prop'], catId, p.Website, p.Phone,
       p['Street Address'], p['Zip Code'], ageMin, ageMax]
    );
    console.log(`  ✓ ${p.Name} (${catName})`);
    count++;
  } catch (e) {
    console.error(`  ✗ ${p.Name}: ${e.message}`);
  }
}

// Verify
const result = await query('SELECT COUNT(*) as cnt FROM providers');
console.log(`\nTotal providers in DB: ${result.rows[0].cnt}`);

db.close();