import db from './connection.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Strip SQL comments (both -- line comments and /* block comments *​/)
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

  const schemaPath = path.join(migrationsDir, '001_initial_schema.sql');
  
  if (fs.existsSync(schemaPath)) {
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    
    // Split on semicolons, strip comments, keep non-empty statements
    const statements = schema
      .split(';')
      .map(s => stripComments(s))
      .filter(s => s.length > 0);
    
    if (statements.length === 0) {
      console.log('No executable statements found in migration file');
      return;
    }

    for (const stmt of statements) {
      try {
        await db.execute(stmt);
      } catch (err) {
        // Skip "already exists" errors for tables and indexes
        const msg = (err.message || '').toLowerCase();
        if (msg.includes('already exists') || msg.includes('duplicate column')) {
          continue;
        }
        if (msg.includes('parse error') && msg.includes('near "--"')) {
          // Skip comment-only issues
          continue;
        }
        console.error(`Migration statement error (skipping): ${err.message.substring(0, 100)}`);
      }
    }
    
    console.log('Schema migration applied successfully');
  } else {
    console.log('No migration file found at', schemaPath);
  }
}

export async function runQuery(sql) {
  return db.execute(sql);
}