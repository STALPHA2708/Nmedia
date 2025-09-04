# 🚀 Hostinger PostgreSQL Deployment Guide

## ✅ What's Been Implemented

Your Nomedia Production Management System now supports **both SQLite and PostgreSQL** with automatic detection and seamless switching based on environment variables.

### 🔧 **Dual Database Architecture**

- **SQLite**: Perfect for local development and testing
- **PostgreSQL**: Production-ready for Hostinger and other cloud platforms
- **Auto-detection**: Automatically chooses the right database based on environment
- **Unified API**: Same codebase works with both databases
- **SQL Dialect Conversion**: Automatically handles differences between SQLite and PostgreSQL

## 🏗️ **Architecture Overview**

```
┌─────────────────────────────────────────┐
│           APPLICATION LAYER             │
├─────────────────────────────────────────┤
│         UNIFIED DATABASE API            │
│    (query, run, get, healthCheck)       │
├─────────────────────────────────────────┤
│        DATABASE ABSTRACTION             │
│    ┌─────────────┐  ┌─────────────┐     │
│    │   SQLite    │  │ PostgreSQL  │     │
│    │   Adapter   │  │   Adapter   │     │
│    └─────────────┘  └─────────────┘     │
├─────────────────────────────────────────┤
│           SQL DIALECT CONVERTER         │
│    (Handles SQLite ↔ PostgreSQL)       │
└─────────────────────────────────────────┘
```

## 🌍 **Environment Configuration**

### For Local Development (SQLite - Default)
```bash
# .env file (optional - these are defaults)
SQLITE_PATH=./nomedia.db
NODE_ENV=development
```

### For Hostinger Production (PostgreSQL)
```bash
# .env file
DATABASE_URL=postgresql://username:password@host:5432/database_name
NODE_ENV=production
```

**OR using individual parameters:**
```bash
DATABASE_TYPE=postgresql
DB_HOST=your-hostinger-host.com
DB_NAME=your_database_name
DB_USER=your_username
DB_PASSWORD=your_password
DB_PORT=5432
NODE_ENV=production
```

## 📋 **Hostinger Deployment Steps**

### Step 1: Create PostgreSQL Database
1. Login to Hostinger control panel
2. Go to **Databases** → **PostgreSQL**
3. Create a new database
4. Note down the connection details:
   - Host
   - Database name
   - Username
   - Password
   - Port (usually 5432)

### Step 2: Configure Environment Variables
Set these in Hostinger's environment variables or in your deployment:

```bash
DATABASE_URL=postgresql://[username]:[password]@[host]:5432/[database_name]
NODE_ENV=production
```

### Step 3: Deploy Application
1. Upload your code to Hostinger
2. Install dependencies: `npm install`
3. Build the application: `npm run build`
4. Start the application: `npm start`

### Step 4: Verify Deployment
Check the health endpoint: `https://your-domain.com/api/health`

Expected response:
```json
{
  "success": true,
  "status": "healthy",
  "database": "connected",
  "databaseType": "POSTGRESQL",
  "environment": "production",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 🔄 **Automatic Features**

### Database Auto-Detection
The system automatically detects which database to use:

1. **PostgreSQL** if:
   - `DATABASE_TYPE=postgresql` is set
   - `DATABASE_URL` is present
   - `DB_HOST` is configured

2. **SQLite** (default) if:
   - No PostgreSQL configuration found
   - Local development environment

### Auto-Initialization
When the app starts, it automatically:
- ✅ Creates all necessary tables
- ✅ Sets up proper indexes
- ✅ Creates demo user accounts
- ✅ Initializes sample data
- ✅ Handles SQL dialect differences

### Demo Accounts Created
```
Admin:    admin@nomedia.ma     / admin123
Manager:  mohammed@nomedia.ma  / mohammed123
Manager:  zineb@nomedia.ma     / zineb123
User:     karim@nomedia.ma     / karim123
```

## 🛠️ **Development Workflow**

### Local Development
```bash
# Uses SQLite automatically
npm run dev
```

### Testing PostgreSQL Locally
```bash
# Set environment variables
export DATABASE_TYPE=postgresql
export DB_HOST=localhost
export DB_NAME=nomedia_test
export DB_USER=postgres
export DB_PASSWORD=your_password

npm run dev
```

### Production Build
```bash
npm run build
npm start
```

## 🔍 **Verification Commands**

### Check Database Type
```bash
curl https://your-domain.com/api/health
```

### Check Demo Accounts
```bash
curl https://your-domain.com/api/demo-status
```

### Test Login
```bash
curl -X POST https://your-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@nomedia.ma", "password": "admin123"}'
```

## 🐛 **Troubleshooting**

### Database Connection Issues
1. **Check environment variables** are set correctly
2. **Verify database credentials** with Hostinger
3. **Check firewall settings** allow connections
4. **Review server logs** for specific error messages

### Common Error Messages

**"Database connection failed"**
- Verify `DATABASE_URL` or individual DB parameters
- Check if PostgreSQL service is running
- Confirm database exists and user has permissions

**"Table does not exist"**
- The app auto-creates tables, this shouldn't happen
- Check if user has CREATE table permissions

### Debug Mode
Add this to see detailed database logs:
```bash
DEBUG=database
NODE_ENV=development
```

## 📊 **Performance Considerations**

### SQLite (Development)
- ✅ Zero configuration
- ✅ File-based
- ❌ Single-writer limitation
- ❌ Not suitable for production

### PostgreSQL (Production)
- ✅ Multi-user concurrent access
- ✅ ACID compliance
- ✅ Advanced indexing
- ✅ Backup and replication
- ✅ Scalability

## 🔐 **Security Best Practices**

1. **Environment Variables**: Never commit credentials to git
2. **SSL Connections**: Enabled automatically in production
3. **Password Hashing**: bcrypt with 10 rounds
4. **SQL Injection Prevention**: Parameterized queries
5. **Input Validation**: Server-side validation on all endpoints

## 📈 **Monitoring**

### Health Checks
- **Endpoint**: `/api/health`
- **Database**: Connection status
- **Response Time**: Database query performance

### Logging
- Database connection events
- Query execution times
- Error tracking and reporting

## 🎯 **Next Steps**

1. **Deploy to Hostinger** with PostgreSQL configuration
2. **Test all features** with production database
3. **Set up monitoring** and logging
4. **Configure backups** through Hostinger
5. **Monitor performance** and optimize queries

## 📞 **Support**

If you encounter issues:
1. Check the logs for specific error messages
2. Verify environment variables are set correctly
3. Test database connection independently
4. Review Hostinger documentation for PostgreSQL setup

Your application is now **production-ready** with full PostgreSQL support! 🎉
