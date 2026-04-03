# SnapPay Backend API

SnapPay is a family payment platform that allows primary account holders to manage linked family members with spending limits, real-time notifications, and seamless payments.

## Features

- 🔐 OTP-based authentication with PIN security
- 👨‍👩‍👧 Family account management with spending limits
- 💳 Bank account linking and verification
- 💰 Wallet system for balance management
- 📱 Mobile recharges and bill payments
- 🔔 Real-time notifications via Socket.IO
- 📊 Transaction history and statistics

## Tech Stack

- **Runtime**: Node.js (v18+)
- **Framework**: Express.js with TypeScript
- **Database**: Prisma ORM (SQLite/PostgreSQL/MySQL)
- **Caching**: Redis (optional)
- **Real-time**: Socket.IO
- **Authentication**: JWT + OTP
- **Logging**: Winston
- **Validation**: express-validator
- **Testing**: Jest & Supertest

## Getting Started

### Prerequisites

- Node.js v18+
- npm v9+
- Database (SQLite for development, PostgreSQL for production)
- Redis (optional, for caching)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   Copy environment variables:

bash
cp .env.example .env
Set up the database:

bash
npx prisma migrate dev
npx prisma db seed
Start the development server:

bash
npm run dev
Environment Variables
See .env.example for all required variables.

API Documentation
API documentation is available at /api-docs when running in development mode (Swagger UI).

Project Structure
text
src/
├── config/         # Configuration files (database, redis, socket)
├── controllers/    # Route controllers
├── middleware/     # Express middleware
├── routes/         # API routes
├── services/       # Business logic
├── types/          # TypeScript type definitions
├── utils/          # Utility functions and constants
└── app.ts          # Express app setup
└── server.ts       # Server entry point
Available Scripts
npm run dev – Start development server with hot reload

npm run build – Build TypeScript to JavaScript

npm start – Start production server

npm run lint – Run ESLint

npm run format – Run Prettier

npm test – Run tests

npm run test:coverage – Run tests with coverage

npm run prisma:studio – Open Prisma Studio

npm run docker:compose – Start all services with Docker Compose

Docker
Build and run with Docker:

bash
docker build -t snappay-backend .
docker run -p 5000:5000 --env-file .env snappay-backend
Or use Docker Compose:

bash
docker-compose up -d
Testing
bash
# Unit tests
npm test

# E2E tests
npm run test:e2e

# With coverage
npm run test:coverage
Deployment
Set NODE_ENV=production in environment

Use a production database (PostgreSQL recommended)

Set up Redis for caching (optional)

Use PM2 for process management:

bash
npm run build
pm2 start ecosystem.config.js
Configure reverse proxy (nginx) and SSL