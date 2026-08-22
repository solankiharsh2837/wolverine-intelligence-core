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

### Step 7: Research Data Lake Verification & Profiling
```bash
npm run dataset:status
npm run dataset:verify
npm run dataset:profile
npm run features:extract
```

### Step 8: Run Complete Automated Test Suite
```bash
npm test
# Runs both tests/database/*.test.ts and tests/research-data/*.test.ts
```

### Step 9: Launch Prisma Studio GUI
```bash
npm run db:studio
# Open browser at http://localhost:5555
```
