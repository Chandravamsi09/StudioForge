# StudioForge 🎮⚡

**StudioForge** is an enterprise-grade, multi-tenant B2B SaaS platform engineered for modern game studios to unify their operational lifecycle across game build pipelines, QA & bug tracking, player analytics telemetry ingestion, live-ops scheduling, and subscription billing.

---

## 🏛️ System Architecture

- **Backend**: Node.js + NestJS with TypeScript (Modular Domain-Driven Architecture)
- **Database**: PostgreSQL with multi-tenant row-level isolation (`tenant_id`)
- **Caching & Sessions**: Redis
- **Authentication**: JWT-based stateless auth with bcrypt hashing & Role-Based Access Control (RBAC)
- **Frontend**: React + TypeScript + Tailwind CSS (Vite build)
- **Testing**: Jest (Unit & Integration) + React Testing Library + Supertest
- **CI/CD**: GitHub Actions
- **Containerization**: Docker Compose

---

## 📦 Monorepo Structure

```
StudioForge/
├── backend/
│   ├── src/
│   │   ├── common/             # Interceptors, filters, guards, decorators, middleware
│   │   ├── config/             # Type-safe environment validation
│   │   ├── database/           # TypeORM entities, migrations, data sources
│   │   ├── modules/
│   │   │   ├── auth/           # Tenant signup, authentication, JWT tokens
│   │   │   ├── tenants/        # Organization / Tenant isolation & metadata
│   │   │   ├── users/          # User management & RBAC assignments
│   │   │   ├── builds/         # Game build version tracking & artifact catalog
│   │   │   ├── qa/             # Bug tracking, severity, reproduction steps
│   │   │   ├── analytics/      # Player telemetry ingestion & aggregation
│   │   │   ├── live-ops/       # In-game events, feature flags, game economy
│   │   │   └── billing/        # Plan tiers, seat metering, subscription limits
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── test/                   # Comprehensive integration and E2E suites
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/                # API client layer
│   │   ├── components/         # StudioForge UI Design System
│   │   ├── context/            # Auth & Tenant Contexts
│   │   ├── pages/              # Admin dashboard, Builds, QA, Analytics, LiveOps, Billing
│   │   └── App.tsx
│   └── package.json
├── docker-compose.yml          # Postgres + Redis dev services
├── .env.example
└── README.md
```

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- Node.js >= 20.x
- Docker & Docker Compose
- npm or yarn

### 2. Environment Configuration
```bash
cp .env.example .env
```

### 3. Spin up Infrastructure (Database & Redis)
```bash
docker compose up -d
```

### 4. Install & Run Backend
```bash
cd backend
npm install
npm run start:dev
```

### 5. Run Tests
```bash
cd backend
npm test
```

---

## 📋 Incremental Implementation Roadmap

- [x] **Phase 1**: Repo scaffold, DB schema/migrations for tenants & users, JWT auth service + initial test suite
- [ ] **Phase 2**: Game build pipeline tracker CRUD + tests
- [ ] **Phase 3**: QA / bug tracking module lifecycle + tests
- [ ] **Phase 4**: Player analytics telemetry ingestion & batch aggregation + tests
- [ ] **Phase 5**: Multi-tenancy isolation middleware & cross-tenant denial tests
- [ ] **Phase 6**: Billing / subscription logic & seat limit enforcement + tests
- [ ] **Phase 7**: RBAC authorization guards & permission matrix tests
- [ ] **Phase 8**: Frontend dashboard wired to backend APIs
- [ ] **Phase 9**: End-to-end integration test suite
- [ ] **Phase 10**: GitHub Actions CI pipeline
- [ ] **Phase 11+**: Error handling, logging, rate limiting, API documentation
