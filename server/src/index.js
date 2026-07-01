import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDb } from './db/init.js';
import { router as authRouter } from './routes/auth.js';
import { router as providerRouter } from './routes/providers.js';
import { router as recommendationRouter } from './routes/recommendations.js';
import { router as categoryRouter } from './routes/categories.js';
import { router as bookingRouter } from './routes/bookings.js';
import { router as favoriteRouter } from './routes/favorites.js';
import { router as conciergeRouter } from './routes/concierge.js';
import { router as proFeaturesRouter } from './routes/pro-features.js';
import { router as verificationRouter } from './routes/verification.js';
import { router as notificationsRouter } from './routes/notifications.js';
import { router as notificationSettingsRouter } from './routes/notification-settings.js';
import { router as trafficRouter } from './routes/traffic.js';
import { trafficLogger } from './services/traffic.js';
import { router as foundingParentsRouter } from './routes/founding-parents.js';
import { router as hotSpotsRouter } from './routes/hot-spots.js';
import { router as leadsRouter } from './routes/leads.js';
import { router as circlesRouter } from './routes/circles.js';
import { router as seoRouter } from './routes/seo.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Enable trust proxy so req.protocol and req.hostname are accurate when behind Render/Cloudflare
app.set('trust proxy', 1);

// Middleware
app.use(cors());
app.use(express.json());

// Traffic logging middleware (logs all API requests)
app.use('/api', trafficLogger);

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Simple query to verify DB connection
    await initDb(); // Ensures DB is init, but maybe too heavy for every health check
    // Better: just a simple SELECT
    const { runQuery } = await import('./db/init.js');
    await runQuery('SELECT 1');
    res.json({ 
      status: 'ok', 
      database: 'connected',
      timestamp: new Date().toISOString(), 
      uptime: process.uptime() 
    });
  } catch (err) {
    res.status(500).json({ 
      status: 'error', 
      database: 'disconnected',
      error: err.message,
      timestamp: new Date().toISOString() 
    });
  }
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/providers', providerRouter);
app.use('/api/recommendations', recommendationRouter);
app.use('/api/categories', categoryRouter);
app.use('/api/bookings', bookingRouter);
app.use('/api/favorites', favoriteRouter);
app.use('/api/concierge', conciergeRouter);
app.use('/api/referrals', proFeaturesRouter);
app.use('/api/swaps', proFeaturesRouter);
app.use('/api/verification', verificationRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/notification-settings', notificationSettingsRouter);

// Traffic analytics
app.use('/api/traffic', trafficRouter);

// Founding Parent program (48-hour 15% lifetime discount)
app.use('/api/founding', foundingParentsRouter);

// Hot Spot notifications (waitlist for fully booked providers)
app.use('/api/hot-spots', hotSpotsRouter);

// Lead capture (waitlist signups)
app.use('/api/leads', leadsRouter);

// Circles (Private Groups)
app.use('/api/circles', circlesRouter);

// SEO routes (at root level, not under /api)
app.use('/', seoRouter);

// Serve static frontend in production
const clientDist = path.join(__dirname, '..', '..', 'client', 'dist');
app.use(express.static(clientDist));

// SPA fallback — serve index.html for any non-API route
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(clientDist, 'index.html'));
  } else {
    res.status(404).json({ error: 'Not found' });
  }
});

// Initialize database and start server
async function start() {
  try {
    await initDb();
    console.log('Database initialized successfully');

    // Auto-seed traffic data (if table is empty)
    try {
      const { seedTrafficData } = await import('./db/seed-traffic.js');
      const count = await seedTrafficData(50);
      if (count > 0) console.log(`Traffic data seeded: ${count} records`);
    } catch (seedErr) {
      // Non-fatal — dashboard will show estimated data
      console.log('Traffic seeding note:', seedErr.message);
    }

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`KidCircle server running on http://0.0.0.0:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();