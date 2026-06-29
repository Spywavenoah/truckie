# Truckie - Test Login Credentials

## Admin Account

**Email:** `admin@truckie.com`  
**Password:** `admin123`  
**Role:** ADMIN  
**Status:** Active

### Admin Dashboard
Access the admin dashboard at: `/admin/dashboard`

---

## Client Account (Test User)

**Email:** `test@example.com`  
**Password:** `password123`  
**Role:** CLIENT  
**Status:** Active

### Client Dashboard
Access the client dashboard at: `/dashboard/client/overview`

---

## How to Login

1. Go to: `http://localhost:3000/auth/login`
2. Enter email and password from above
3. Click "Login"
4. You'll be redirected to your dashboard based on your role

---

## Creating Additional Test Users

To create additional test users, POST to:
```
POST /api/seed/test-user
```

This will create another test client account.

---

## Database Information

- **Database:** Neon PostgreSQL
- **Connection:** Via `DATABASE_URL` environment variable
- **Prisma ORM:** Configured and synced

All user accounts are stored in the `User` table in the Neon database.

---

## Notes

- All passwords are securely hashed with bcrypt
- Emails must be verified (already done for test accounts)
- Users can be created with different roles: OWNER, CLIENT, ADMIN, MODERATOR, SUPPORT, FINANCE
- Sessions are persisted with NextAuth.js
