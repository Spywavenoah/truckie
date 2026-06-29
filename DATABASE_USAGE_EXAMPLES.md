# Database Usage Examples

This guide shows how to use the Neon database with Prisma in the Truckie application.

## Setup

The Prisma client is already configured in `src/lib/prisma.ts`:

```typescript
import { prisma } from '@/lib/prisma';
```

## Common Operations

### Users

```typescript
// Create a user
const user = await prisma.user.create({
  data: {
    email: 'owner@example.com',
    fullName: 'John Owner',
    role: 'OWNER',
    status: 'ACTIVE',
  },
});

// Find user by email
const user = await prisma.user.findUnique({
  where: { email: 'owner@example.com' },
});

// Get all users with specific role
const owners = await prisma.user.findMany({
  where: { role: 'OWNER' },
});

// Update user
const updated = await prisma.user.update({
  where: { id: userId },
  data: { phoneVerified: new Date() },
});

// Delete user
await prisma.user.delete({
  where: { id: userId },
});
```

### Assets

```typescript
// Create an asset
const asset = await prisma.asset.create({
  data: {
    ownerId: 'owner-id',
    type: 'TRUCK',
    title: 'Howo Truck',
    make: 'Howo',
    model: 'A7',
    year: 2022,
    plateNumber: 'ABC123',
    pricePerDay: 50000,
    location: 'Lagos',
    state: 'Lagos',
    lga: 'Ikoyi',
  },
});

// Get asset with images
const asset = await prisma.asset.findUnique({
  where: { id: assetId },
  include: {
    images: true,
    owner: {
      select: { fullName: true, email: true },
    },
  },
});

// List all available assets
const available = await prisma.asset.findMany({
  where: { availabilityStatus: 'AVAILABLE' },
  include: { images: true },
});

// Search assets by location
const assets = await prisma.asset.findMany({
  where: {
    location: { contains: 'Lagos', mode: 'insensitive' },
  },
});
```

### Bookings

```typescript
// Create a booking
const booking = await prisma.booking.create({
  data: {
    assetId: 'asset-id',
    clientId: 'client-id',
    ownerId: 'owner-id',
    status: 'PENDING',
    startDate: new Date('2026-07-01'),
    endDate: new Date('2026-07-10'),
    basePrice: 500000,
    finalPrice: 500000,
  },
});

// Get booking with asset and user details
const booking = await prisma.booking.findUnique({
  where: { id: bookingId },
  include: {
    asset: { include: { images: true } },
    client: { select: { fullName: true, email: true } },
    owner: { select: { fullName: true, email: true } },
  },
});

// Get all active bookings for an owner
const bookings = await prisma.booking.findMany({
  where: {
    ownerId: 'owner-id',
    status: { not: 'CANCELLED' },
  },
  orderBy: { startDate: 'asc' },
});

// Update booking status
const updated = await prisma.booking.update({
  where: { id: bookingId },
  data: { status: 'ACCEPTED' },
});
```

### Transactions

```typescript
// Record a transaction
const transaction = await prisma.transaction.create({
  data: {
    userId: 'user-id',
    bookingId: 'booking-id',
    amount: 500000,
    category: 'INCOME',
    description: 'Payment for booking ABC123',
    reference: 'TRX123456',
  },
});

// Get user's transaction history
const transactions = await prisma.transaction.findMany({
  where: { userId: 'user-id' },
  orderBy: { createdAt: 'desc' },
  take: 50,
});

// Calculate total earnings
const result = await prisma.transaction.aggregate({
  where: {
    userId: 'owner-id',
    category: 'INCOME',
  },
  _sum: { amount: true },
});
const totalEarnings = result._sum.amount || 0;
```

### Maintenance

```typescript
// Log maintenance
const log = await prisma.maintenanceLog.create({
  data: {
    assetId: 'asset-id',
    maintenanceType: 'ROUTINE',
    description: 'Oil and filter change',
    performedBy: 'John Mechanic',
    cost: 15000,
    currency: 'NGN',
  },
});

// Get asset maintenance history
const history = await prisma.maintenanceLog.findMany({
  where: { assetId: 'asset-id' },
  orderBy: { createdAt: 'desc' },
});
```

### Support Tickets

```typescript
// Create support ticket
const ticket = await prisma.supportTicket.create({
  data: {
    creatorId: 'user-id',
    subject: 'Payment Issue',
    description: 'I have not received payment for booking ABC123',
    priority: 'HIGH',
    category: 'PAYMENTS',
    status: 'OPEN',
  },
});

// Get open tickets (admin view)
const openTickets = await prisma.supportTicket.findMany({
  where: { status: 'OPEN' },
  orderBy: { priority: 'desc' },
});

// Assign ticket
const assigned = await prisma.supportTicket.update({
  where: { id: ticketId },
  data: {
    assignedTo: 'support-staff-id',
    status: 'IN_PROGRESS',
  },
});
```

### Wallet Operations

```typescript
// Create wallet for user
const wallet = await prisma.wallet.create({
  data: {
    userId: 'user-id',
    currency: 'NGN',
    balance: 0,
  },
});

// Get user's wallet
const wallet = await prisma.wallet.findUnique({
  where: { userId: 'user-id' },
  include: { transactions: { take: 50 } },
});

// Update wallet balance
const updated = await prisma.wallet.update({
  where: { id: walletId },
  data: { balance: { increment: 100000 } },
});
```

## Advanced Patterns

### Transactions (Database Transactions)

```typescript
// Perform multiple operations atomically
const result = await prisma.$transaction(async (tx) => {
  // Create booking
  const booking = await tx.booking.create({
    data: { /* ... */ },
  });

  // Update asset status
  await tx.asset.update({
    where: { id: booking.assetId },
    data: { availabilityStatus: 'HIRED' },
  });

  // Record transaction
  await tx.transaction.create({
    data: {
      userId: booking.clientId,
      bookingId: booking.id,
      amount: booking.finalPrice,
      category: 'INCOME',
    },
  });

  return booking;
});
```

### Pagination

```typescript
// Get paginated results
const page = 1;
const pageSize = 20;

const assets = await prisma.asset.findMany({
  skip: (page - 1) * pageSize,
  take: pageSize,
  orderBy: { createdAt: 'desc' },
});

const total = await prisma.asset.count();
const totalPages = Math.ceil(total / pageSize);
```

### Filtering and Sorting

```typescript
// Complex filtering
const assets = await prisma.asset.findMany({
  where: {
    AND: [
      { type: 'TRUCK' },
      { availabilityStatus: 'AVAILABLE' },
      { pricePerDay: { lte: 100000 } },
      { location: { contains: 'Lagos', mode: 'insensitive' } },
    ],
  },
  orderBy: [
    { pricePerDay: 'asc' },
    { createdAt: 'desc' },
  ],
});
```

### Aggregations

```typescript
// Count records
const assetCount = await prisma.asset.count({
  where: { ownerId: 'owner-id' },
});

// Aggregate data
const stats = await prisma.booking.aggregate({
  where: { ownerId: 'owner-id' },
  _count: true,
  _sum: { finalPrice: true },
  _avg: { finalPrice: true },
});
```

## Error Handling

```typescript
try {
  const user = await prisma.user.create({
    data: {
      email: 'duplicate@example.com',
      fullName: 'User',
    },
  });
} catch (error) {
  if (error.code === 'P2002') {
    console.error('Email already exists');
  } else {
    console.error('Database error:', error);
  }
}
```

## Best Practices

1. **Use `include` and `select`** for efficient queries
2. **Always handle errors** with try-catch
3. **Use transactions** for multi-step operations
4. **Paginate large result sets** to improve performance
5. **Create indexes** for frequently queried fields
6. **Use parameterized queries** (Prisma does this automatically)

## Common Error Codes

- `P2002`: Unique constraint failed
- `P2025`: Record not found
- `P2003`: Foreign key constraint failed
- `P2014`: Required relation violation

For more information, visit: https://www.prisma.io/docs/
