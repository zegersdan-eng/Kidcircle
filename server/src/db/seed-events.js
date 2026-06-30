// Seed events + user interests for testing
import { v4 as uuidv4 } from 'uuid';
import db from '../db/connection.js';

async function seed() {
  console.log('=== Seeding Events ===');

  // Get existing providers and categories
  const providers = await db.execute({ sql: 'SELECT id, name, category_id, zip_code FROM providers WHERE active = 1 LIMIT 15', args: [] });
  const categories = await db.execute({ sql: 'SELECT id, name FROM categories', args: [] });

  const catMap = {};
  for (const c of categories.rows) {
    catMap[c.name.toLowerCase()] = c.id;
  }

  // Create Austin-relevant events
  const events = [
    {
      name: 'Austin STEAM Summer Camp',
      description: 'Week-long hands-on STEAM camp featuring robotics, coding, and engineering projects for kids 7-12.',
      category_id: catMap['science'] || catMap['coding'] || null,
      provider_id: providers.rows[0]?.id || null,
      start_date: '2026-07-06',
      end_date: '2026-07-10',
      start_time: '09:00',
      end_time: '15:00',
      zip_code: '78704',
      price: '$350/week',
      website: 'https://austinstem.org/summer',
    },
    {
      name: 'July 4th Fireworks & Family Festival',
      description: 'Annual Independence Day celebration at Auditorium Shores with fireworks, food trucks, and kids activities.',
      category_id: catMap['camp'] || catMap['outdoor'] || null,
      provider_id: null,
      start_date: '2026-07-04',
      end_date: '2026-07-04',
      start_time: '17:00',
      end_time: '22:00',
      zip_code: '78701',
      price: 'Free',
      website: 'https://austintexas.gov/july4',
    },
    {
      name: 'Kids Coding Bootcamp: Game Design',
      description: 'Learn to build your own video game using Scratch and Python. Perfect for young coders ages 8-14.',
      category_id: catMap['coding'] || null,
      provider_id: providers.rows[1]?.id || null,
      start_date: '2026-07-12',
      end_date: '2026-07-16',
      start_time: '10:00',
      end_time: '14:00',
      zip_code: '78746',
      price: '$275',
      website: 'https://kidcircle.io/events/coding-bootcamp',
    },
    {
      name: 'Saturday Art Workshop: Pottery for Kids',
      description: 'A fun hands-on pottery workshop where kids can create their own clay masterpieces.',
      category_id: catMap['art'] || null,
      provider_id: providers.rows[2]?.id || null,
      start_date: '2026-07-08',
      end_date: '2026-07-08',
      start_time: '10:00',
      end_time: '12:30',
      zip_code: '78757',
      price: '$45/child',
      website: null,
    },
    {
      name: 'Austin Nature Science Center: Bug Hunt',
      description: 'Explore Zilker Park and learn about local insects and reptiles with our naturalist guides.',
      category_id: catMap['science'] || null,
      provider_id: null,
      start_date: '2026-07-10',
      end_date: '2026-07-10',
      start_time: '09:30',
      end_time: '11:30',
      zip_code: '78703',
      price: '$15',
      website: 'https://austintexas.gov/ansc',
    },
    {
      name: 'Music Together: Summer Sing-Along',
      description: 'Family music class with instruments, singing, and movement for children ages 0-8.',
      category_id: catMap['music'] || null,
      provider_id: providers.rows[3]?.id || null,
      start_date: '2026-07-15',
      end_date: '2026-07-15',
      start_time: '10:00',
      end_time: '11:00',
      zip_code: '78731',
      price: '$20/family',
      website: null,
    },
    {
      name: 'Westlake Sports Camp: Multi-Sport Week',
      description: 'Try soccer, basketball, tennis, and swimming in one action-packed week.',
      category_id: catMap['sports'] || null,
      provider_id: providers.rows[4]?.id || null,
      start_date: '2026-07-18',
      end_date: '2026-07-22',
      start_time: '08:30',
      end_time: '15:30',
      zip_code: '78746',
      price: '$299/week',
      website: null,
    },
    {
      name: 'Dance Discovery: Intro to Ballet & Hip Hop',
      description: 'A beginner-friendly dance workshop covering ballet basics and hip hop moves for ages 5-10.',
      category_id: catMap['dance'] || null,
      provider_id: providers.rows[5]?.id || null,
      start_date: '2026-07-20',
      end_date: '2026-07-20',
      start_time: '11:00',
      end_time: '13:00',
      zip_code: '78758',
      price: '$30/child',
      website: null,
    },
  ];

  let eventCount = 0;
  for (const event of events) {
    if (!event.category_id) {
      console.log(`Skipping "${event.name}" — no matching category found`);
      continue;
    }

    const id = uuidv4();
    try {
      await db.execute({
        sql: `INSERT INTO events (id, name, description, category_id, provider_id, start_date, end_date, start_time, end_time, zip_code, price, website, active)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        args: [
          id, event.name, event.description, event.category_id, event.provider_id,
          event.start_date, event.end_date, event.start_time, event.end_time,
          event.zip_code, event.price, event.website,
        ],
      });
      eventCount++;
      console.log(`  ✓ Created event: "${event.name}"`);
    } catch (err) {
      console.log(`  ✗ Failed to create "${event.name}": ${err.message}`);
    }
  }

  // === Seed user interests ===
  console.log('\n=== Seeding User Interests ===');
  const users = await db.execute({ sql: 'SELECT id, name, tier FROM users WHERE tier = \'pro\' LIMIT 5', args: [] });

  let interestCount = 0;
  for (let i = 0; i < users.rows.length && i < providers.rows.length; i++) {
    const uid = uuidv4();
    try {
      await db.execute({
        sql: 'INSERT INTO user_interests (id, user_id, provider_id, category_id) VALUES (?, ?, ?, ?)',
        args: [uid, users.rows[i].id, providers.rows[i].id, providers.rows[i].category_id],
      });
      interestCount++;
    } catch (err) {
      // may already exist
    }

    // Interest in category for next user
    if (i + 1 < users.rows.length) {
      const uid2 = uuidv4();
      try {
        await db.execute({
          sql: 'INSERT INTO user_interests (id, user_id, category_id) VALUES (?, ?, ?)',
          args: [uid2, users.rows[i + 1].id, providers.rows[i].category_id],
        });
        interestCount++;
      } catch (err) {
        // may already exist
      }
    }
  }

  console.log(`  ✓ Created ${interestCount} user interests`);

  // === Create test notifications ===
  console.log('\n=== Seeding Test Notifications ===');
  if (users.rows.length > 0) {
    const testUserId = users.rows[0].id;
    const testNotifs = [
      {
        id: uuidv4(),
        user_id: testUserId,
        type: 'referral_reward',
        category: 'referral',
        title: '🎉 Referral Reward Earned!',
        message: 'Someone used your referral code! You\'ve earned 1 month of KidCircle Pro free.',
        data: JSON.stringify({ referral_code: 'KCTEST123', reward: '1 month Pro credit' }),
      },
      {
        id: uuidv4(),
        user_id: testUserId,
        type: 'swap_matched',
        category: 'swap',
        title: '🎫 Swap Available!',
        message: 'A new spot just opened up at Code Ninjas through the Camp & Class Swap!',
        data: JSON.stringify({ swap_id: 'test-swap-1', provider_name: 'Code Ninjas' }),
      },
      {
        id: uuidv4(),
        user_id: testUserId,
        type: 'provider_doc_approved',
        category: 'verification',
        title: 'Document Approved',
        message: 'Your "HHSC License" has been approved. Great progress toward your Pro Gold Standard badge!',
        data: JSON.stringify({ doc_type: 'hhsc_license', status: 'approved' }),
      },
    ];

    for (const n of testNotifs) {
      try {
        await db.execute({
          sql: 'INSERT INTO notifications (id, user_id, type, category, title, message, data) VALUES (?, ?, ?, ?, ?, ?, ?)',
          args: [n.id, n.user_id, n.type, n.category, n.title, n.message, n.data],
        });
        console.log(`  ✓ Created notification: "${n.title}"`);
      } catch (err) {
        console.log(`  ✗ Failed notification: ${err.message}`);
      }
    }
  }

  console.log(`\n✅ Done! Created ${eventCount} events, ${interestCount} interests`);
}

seed()
  .then(() => {
    console.log('Seed script completed successfully');
    process.exit(0);
  })
  .catch(err => {
    console.error('Seed error:', err);
    process.exit(1);
  });
