# KidCircle 🧒🔵

**Hyperlocal recommendation network for parents**

KidCircle turns the chaotic "parent referral loop" into a trusted, actionable marketplace. Find verified local tutors, camps, and programs recommended by parents in your community.

## Features

- **Browse Providers** — Search local tutors, camps, and programs by category and zip code
- **Read Recommendations** — See real reviews from parents in your neighborhood
- **Share Your Experience** — Recommend services you trust
- **Save Favorites** — Bookmark providers for quick access
- **Pro Membership** — Priority listings and premium features (coming soon)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite |
| Backend | Node.js + Express |
| Database | SQLite (via libSQL/Turso) |
| Auth | JWT + bcrypt |

## Getting Started

```bash
# Install all dependencies
npm run install:all

# Run the migration
npm run migrate:server

# Start development (client + server)
npm run dev
```

The server runs on **port 3000** and the Vite dev server runs on **port 5173** with proxy to the API.

## Project Structure

```
kidcircle/
├── client/                  # React frontend (Vite)
│   ├── public/
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Route pages
│   │   ├── hooks/           # Custom React hooks
│   │   ├── services/        # API client functions
│   │   ├── context/         # React context providers
│   │   ├── styles/          # CSS / theme
│   │   └── utils/           # Helpers
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── server/                  # Express backend
│   ├── src/
│   │   ├── routes/          # API route handlers
│   │   ├── middleware/      # Auth, validation, error handling
│   │   ├── models/          # Data access layer
│   │   ├── db/              # Database & migrations
│   │   └── utils/           # Helpers
│   ├── index.js
│   └── package.json
├── package.json             # Root workspace scripts
└── README.md
```

## API Endpoints

| Method | Endpoint | Description |
|--------|---------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Sign in |
| GET | `/api/auth/me` | Get profile |
| GET | `/api/providers` | List/search providers |
| GET | `/api/providers/:id` | Get provider detail |
| POST | `/api/providers` | Register provider |
| GET | `/api/providers/:id/recommendations` | Get provider reviews |
| GET | `/api/recommendations` | List recommendations |
| POST | `/api/recommendations` | Create recommendation |
| PATCH | `/api/recommendations/:id` | Edit recommendation |
| GET | `/api/categories` | List categories |
| POST | `/api/bookings` | Create booking |
| GET | `/api/bookings` | List bookings |
| GET | `/api/favorites` | List favorites |
| POST | `/api/favorites` | Add favorite |
| DELETE | `/api/favorites/:providerId` | Remove favorite |

## License

Copyright © 2026 KidCircle