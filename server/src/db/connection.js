import { createClient } from '@libsql/client';

// Connect to the shared team database synced via Turso.
// Uses environment variables set by the team-db CLI infrastructure.
const url = process.env.TEAM_DB_URL || 'file:kidcircle.db';
const authToken = process.env.TEAM_DB_AUTH_TOKEN;

const client = createClient(
  authToken
    ? { url, authToken }
    : { url }
);

// Wrapper that handles @libsql/client's HRANA protocol quirks
// The HTTP client requires args to always be an array (not undefined)
const db = {
  async execute(stmt) {
    if (typeof stmt === 'string') {
      return client.execute(stmt);
    }
    // Always ensure args is an array
    return client.execute({
      sql: stmt.sql,
      args: stmt.args || [],
    });
  },
  close() {
    client.close();
  },
};

export default db;