# Neon Database Configuration

## Overview
The Truckie app is configured to use **Neon Postgres** as its primary database. Neon is a serverless PostgreSQL platform that's fully integrated with Vercel.

## Current Setup

### Integration Status
- ✅ Neon integration is connected and active
- ✅ DATABASE_URL is automatically provided as an environment variable
- ✅ Prisma ORM is configured with `@prisma/adapter-pg`
- ✅ Database schema has been synced with Prisma (39 tables)

### Configuration Files
1. **prisma.config.ts** - Defines schema location and migrations
2. **src/lib/prisma.ts** - Prisma client with PG adapter
3. **prisma/schema.prisma** - Database schema definition
4. **.env.local** / **.env.development.local** - Environment variables (v0 managed)

## Database Connection

### How It Works
The app uses Prisma with the native PostgreSQL adapter:

```typescript
// src/lib/prisma.ts
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });
```

The `DATABASE_URL` environment variable is automatically provided by:
- **Development (v0)**: Vercel's Neon integration
- **Production**: Neon integration in your Vercel project settings
- **Local**: Set manually in `.env.development.local`

## Database Operations

### Syncing Schema with Database
After schema changes in `prisma/schema.prisma`:

```bash
# Apply schema changes to the database
npm run db:push

# If you need to reset the database
npm run db:push -- --skip-generate
```

### Accessing the Database
Import the Prisma client in your code:

```typescript
import { prisma } from '@/lib/prisma';

// Example query
const users = await prisma.user.findMany();
```

### Viewing Database in Neon Console
1. Go to your Vercel project dashboard
2. Select the Neon integration
3. Click "Manage" to access the Neon console
4. View tables, run queries, and manage backups

## Tables Overview

The database contains 39 tables organized in two schemas:

### Public Schema (App Tables)
- **User Management**: User, LoginHistory, TwoFactorAuth, UserSession
- **Assets**: Asset, AssetImage, AssetCategory, MaintenanceLog, FuelLog
- **Bookings**: Booking, Cart, CartItem
- **Transactions**: Transaction, WalletTransaction, Wallet, EscrowTransaction
- **Payments**: DriverPayment, Withdrawal, WalletTransaction
- **Support**: SupportTicket, TicketMessage
- **Location**: State, LGA
- **Other**: Review, ReversalRequest, WishlistItem, Driver, AuditLog, PlatformSettings, SmtpSettings

### neon_auth Schema (Authentication)
- **Auth Core**: user, session, account, verification
- **Authorization**: organization, member, invitation
- **Security**: jwks, project_config

## Development Workflow

### 1. Make Schema Changes
Edit `prisma/schema.prisma`:

```prisma
model NewTable {
  id        String   @id @default(cuid())
  name      String
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### 2. Sync Database
```bash
npm run db:push
```

### 3. Generate Prisma Client
```bash
npm run db:generate
```

### 4. Use in Code
```typescript
const result = await prisma.newTable.create({
  data: { name: "Example", userId: "123" }
});
```

## Environment Variables

### Required for Neon
- `DATABASE_URL` - Postgres connection string (auto-provided)

### Optional
- `REDIS_URL` - For caching and sessions (if using Redis)

## Troubleshooting

### Connection Issues
1. Verify DATABASE_URL is set: `echo $DATABASE_URL`
2. Test connection: `npm run db:push`
3. Check Neon dashboard for connection limits
4. Verify IP allowlist (if configured)

### Schema Out of Sync
```bash
# Compare database with Prisma schema
npm run db:deploy

# Manually inspect tables
psql $DATABASE_URL -c "\dt"
```

### Generate Prisma Types
```bash
npm run db:generate
```

## Performance Considerations

1. **Connection Pooling**: Neon provides connection pooling automatically
2. **Indexes**: Key columns are already indexed (check schema)
3. **Queries**: Use Prisma's `include` and `select` for efficient queries
4. **Pagination**: Use `skip` and `take` for large result sets

## Backups and Safety

Neon provides:
- Automated daily backups
- Point-in-time recovery (PITR)
- Manual backup capability
- Check Neon console for backup history

## Next Steps

1. ✅ Database is configured and running
2. ✅ Schema is synced with Prisma
3. Start building features with `prisma.client`
4. Use the test endpoint at `/api/test-db-public` to verify queries

For more information, visit: https://neon.tech/docs
