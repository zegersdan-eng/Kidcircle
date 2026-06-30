import db from './connection.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Strip SQL comments
 */
function stripComments(sql) {
  return sql
    .replace(/--.*$/gm, '')     // Remove -- line comments
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove /* block comments */
    .trim();
}

export async function initDb() {
  const migrationsDir = path.join(__dirname, 'migrations');
  if (!fs.existsSync(migrationsDir)) {
    fs.mkdirSync(migrationsDir, { recursive: true });
  }

  // Get all .sql files in the migrations directory
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort(); // Run in alphabetical order

  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    console.log(`Applying migration: ${file}`);
    const schema = fs.readFileSync(filePath, 'utf-8');
    
    // Split on semicolons, strip comments, keep non-empty statements
    const statements = schema
      .split(';')
      .map(s => stripComments(s))
      .filter(s => s.length > 0);

    for (const stmt of statements) {
      try {
        await db.execute(stmt);
      } catch (err) {
        // Skip "already exists" errors for tables and columns
        const msg = (err.message || '').toLowerCase();
        if (
          msg.includes('already exists') || 
          msg.includes('duplicate column') ||
          msg.includes('duplicate symbol')
        ) {
          continue;
        }
        console.error(`Migration error in ${file} (skipping): ${err.message.substring(0, 100)}`);
      }
    }
  }
  console.log('Database schema initialization complete');
}

export async function runQuery(sql) {
  return db.execute(sql);
}
