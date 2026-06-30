// Seed user interests for swap notification matching
// Run: node server/src/db/seed-interests.js
import { v4 as uuidv4 } from 'uuid';
import db from '../db/connection.js';

async function seed() {
  console.log('Seeding user interests...');

  // Get some users and providers
  const users = await db.execute({ sql: 'SELECT id, name FROM users LIMIT 10', args: [] });
  const providers = await db.execute({ sql: 'SELECT id, name, category_id FROM providers LIMIT 10', args: [] });

  let count = 0;

  // Create interests linking users to providers/categories they might like
  for (let i = 0; i < users.rows.length && i < providers.rows.length; i++) {
    // Each user is interested in a different provider
    const id = uuidv4();
    await db.execute({
      sql: 'INSERT OR IGNORE INTO user_interests (id, user_id, provider_id, category_id) VALUES (?, ?, ?, ?)',
      args: [id, users.rows[i].id, providers.rows[i].id, providers.rows[i].category_id],
    });
    count++;

    // Also add interest in the category for the next user (to test category-based matching)
    if (i + 1 < users.rows.length) {
      const id2 = uuidv4();
      await db.execute({
        sql: 'INSERT OR IGNORE INTO user_interests (id, user_id, category_id) VALUES (?, ?, ?)',
        args: [id2, users.rows[i + 1].id, providers.rows[i].category_id],
      });
      count++;
    }
  }

  console.log(`Seeded ${count} user interests`);
}

seed()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
