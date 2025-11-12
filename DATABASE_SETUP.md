# PostgreSQL Setup Guide for Nomedia

## ⚡ Quick Start (3 Options)

### Option 1: Free Hosted PostgreSQL (EASIEST - Recommended for testing)

**Supabase (Free 500MB):**
1. Go to https://supabase.com
2. Create free account
3. Create new project
4. Get connection string from Settings > Database
5. Update `.env` file:
```
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
```

**Neon (Free 512MB):**
1. Go to https://neon.tech
2. Create free account
3. Create project
4. Copy connection string
5. Update `.env`

**Railway (Free $5/month credit):**
1. Go to https://railway.app
2. Create project
3. Add PostgreSQL service
4. Copy DATABASE_URL from variables
5. Update `.env`

---

### Option 2: Local PostgreSQL (For Development)

**Windows:**
1. Download from https://www.postgresq

l.org/download/windows/
2. Install PostgreSQL
3. Remember the password you set for `postgres` user
4. Open pgAdmin or psql
5. Create database:
```sql
CREATE DATABASE nomedia_production;
CREATE USER nomedia_user WITH ENCRYPTED PASSWORD 'nomedia_password123';
GRANT ALL PRIVILEGES ON DATABASE nomedia_production TO nomedia_user;
```

6. `.env` is already configured for local PostgreSQL!

---

### Option 3: Docker (Quick & Clean)

1. Install Docker Desktop
2. Run this command:
```bash
docker run --name nomedia-postgres \
  -e POSTGRES_USER=nomedia_user \
  -e POSTGRES_PASSWORD=nomedia_password123 \
  -e POSTGRES_DB=nomedia_production \
  -p 5432:5432 \
  -d postgres:15
```

3. `.env` is already configured!

---

## 🚀 After PostgreSQL is Ready

Run these commands:

```bash
# Generate Prisma Client
npx prisma generate

# Create database tables
npx prisma migrate dev --name init

# (Optional) Seed with demo data
npm run seed
```

Your database is now ready!

---

## 🔥 Production Deployment

For production, use a managed PostgreSQL service:

- **Supabase** - easiest, generous free tier
- **Railway** - one-click deploy
- **AWS RDS** - enterprise grade
- **Digital Ocean** - $15/month
- **Heroku Postgres** - easy scaling

---

## ✅ Verify Connection

Test your database connection:

```bash
npx prisma db pull
```

If successful, you'll see "✔ Introspected X models"

---

## 🆘 Troubleshooting

**Connection refused:**
- Check PostgreSQL is running
- Verify port 5432 is not blocked
- Check password in `.env` matches

**Migration fails:**
- Database might not exist - create it first
- User might lack permissions - run GRANT commands

**"relation does not exist":**
- Run `npx prisma migrate dev` to create tables
