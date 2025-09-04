# PostgreSQL Setup for Nomedia Production

## Local Development Setup

### Option 1: Using Docker (Recommended)

```bash
# Run PostgreSQL in Docker
docker run --name nomedia-postgres \
  -e POSTGRES_DB=nomedia_production \
  -e POSTGRES_USER=nomedia_user \
  -e POSTGRES_PASSWORD=nomedia_password \
  -p 5432:5432 \
  -d postgres:15

# Wait for the container to start
sleep 10

# Test connection
docker exec -it nomedia-postgres psql -U nomedia_user -d nomedia_production -c "SELECT version();"
```

### Option 2: Local PostgreSQL Installation

#### On Ubuntu/Debian:

```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql -c "CREATE DATABASE nomedia_production;"
sudo -u postgres psql -c "CREATE USER nomedia_user WITH PASSWORD 'nomedia_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE nomedia_production TO nomedia_user;"
```

#### On macOS:

```bash
# Using Homebrew
brew install postgresql
brew services start postgresql

# Create database and user
createdb nomedia_production
psql nomedia_production -c "CREATE USER nomedia_user WITH PASSWORD 'nomedia_password';"
psql nomedia_production -c "GRANT ALL PRIVILEGES ON DATABASE nomedia_production TO nomedia_user;"
```

### Option 3: Cloud PostgreSQL Services

#### Supabase (Free tier available)

1. Go to https://supabase.com
2. Create a new project
3. Get your database URL from Project Settings > Database
4. Update your environment variables with the provided DATABASE_URL

#### Railway (Free tier available)

1. Go to https://railway.app
2. Create a new PostgreSQL service
3. Get your connection details
4. Update your environment variables

#### Neon (Free tier available)

1. Go to https://neon.tech
2. Create a new database
3. Get your connection string
4. Update your environment variables

## Environment Variables

Make sure these environment variables are set:

```bash
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nomedia_production
DB_USER=nomedia_user
DB_PASSWORD=nomedia_password

# Or use a full DATABASE_URL
DATABASE_URL=postgresql://nomedia_user:nomedia_password@localhost:5432/nomedia_production
```

## Running the Application

Once PostgreSQL is set up:

1. Install dependencies: `npm install`
2. Start the development server: `npm run dev`
3. The application will automatically create the database schema on first run

## Database Schema

The application will automatically create all required tables:

- users
- departments
- contract_types
- employees
- projects
- project_team_members
- expenses
- invoices
- invoice_items

## Troubleshooting

### Connection Issues

1. Check if PostgreSQL is running: `pg_isready`
2. Verify your connection string
3. Check firewall settings (port 5432 should be open)
4. Verify user permissions

### Migration from SQLite

If you have existing SQLite data, you can export it and import to PostgreSQL:

```bash
# Export SQLite data (implement custom script)
npm run export-sqlite-data

# Import to PostgreSQL (implement custom script)
npm run import-to-postgres
```

For production deployment, consider using managed PostgreSQL services like:

- AWS RDS PostgreSQL
- Google Cloud SQL for PostgreSQL
- Azure Database for PostgreSQL
- DigitalOcean Managed Databases
