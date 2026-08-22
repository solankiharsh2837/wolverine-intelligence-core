# Wolverine Intelligence — Reproducibility & Setup Guide

## 1. Prerequisites

- **Node.js**: v20.x or higher (tested on Node.js v25.9.0)
- **npm**: v10.x or higher (tested on npm 11.12.1)
- **Docker & Docker Compose**: Docker 24+ (tested on Docker 29.7.2)
- **Git**: 2.30+
- **GitHub CLI (`gh`)**: 2.40+ (authenticated)

---

## 2. Complete Step-by-Step Clean Setup

### Step 1: Clone Repository
```bash
git clone https://github.com/solankiharsh2837/wolverine-intelligence-core.git
cd wolverine-intelligence-core
```

### Step 2: Environment Configuration
```bash
cp .env.example .env
```

### Step 3: Start PostgreSQL Container
```bash
npm run db:up
```

### Step 4: Install Dependencies
```bash
npm install
```

### Step 5: Apply Migrations & Generate Prisma Client
```bash
npm run db:migrate
npm run db:generate
```

### Step 6: Seed Deterministic Development Fixture
```bash
npm run db:seed
```

### Step 7: Run Automated Verification Tests
```bash
npm run db:test
```

### Step 8: Inspect Database Records & Master Trace
```bash
npm run db:inspect
```

### Step 9: Launch Prisma Studio GUI
```bash
npm run db:studio
# Open browser at http://localhost:5555
```

---

## 3. Database Reset (Clean Slate)
To reset the development database to a clean state:
```bash
npx prisma migrate reset --force
npm run db:seed
```
