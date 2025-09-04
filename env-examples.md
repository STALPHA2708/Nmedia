# Database Configuration Examples

## For SQLite (Default - Local Development)

```bash
# SQLite configuration (optional, these are defaults)
SQLITE_PATH=./nomedia.db
NODE_ENV=development
```

## For PostgreSQL (Production - Hostinger)

### Option 1: Individual Parameters
```bash
# PostgreSQL configuration
DATABASE_TYPE=postgresql
DB_HOST=your-hostinger-host.com
DB_NAME=your_database_name
DB_USER=your_username
DB_PASSWORD=your_password
DB_PORT=5432
NODE_ENV=production
```

### Option 2: Connection String (Recommended for Hostinger)
```bash
# PostgreSQL connection string
DATABASE_URL=postgresql://username:password@host:5432/database_name
NODE_ENV=production
```

## For Local PostgreSQL Development
```bash
DATABASE_TYPE=postgresql
DB_HOST=localhost
DB_NAME=nomedia_dev
DB_USER=postgres
DB_PASSWORD=your_local_password
DB_PORT=5432
NODE_ENV=development
```

## Auto-Detection Logic

The system automatically detects the database type based on:

1. `DATABASE_TYPE` environment variable (postgresql/postgres/sqlite)
2. Presence of `DATABASE_URL` (indicates PostgreSQL)
3. Presence of `DB_HOST` (indicates PostgreSQL)
4. Falls back to SQLite if none of the above

## Hostinger Specific Setup

For Hostinger hosting:

1. **Create PostgreSQL database in Hostinger control panel**
2. **Get database credentials from Hostinger**
3. **Set environment variables:**
   ```bash
   DATABASE_URL=postgresql://user:pass@host:5432/dbname
   NODE_ENV=production
   ```

4. **Deploy your application**

The app will automatically:
- Detect PostgreSQL configuration
- Create all necessary tables
- Initialize with demo data
- Handle all SQL dialect differences

## Migration Between Databases

To switch from SQLite to PostgreSQL:
1. Set PostgreSQL environment variables
2. Restart the application
3. The system will automatically create PostgreSQL tables
4. Optional: Use database-specific export/import tools for data migration

## Verification

Check the `/api/health` endpoint to verify database connection:
```json
{
  "success": true,
  "status": "healthy",
  "database": "connected",
  "databaseType": "POSTGRESQL",
  "environment": "production"
}
```
