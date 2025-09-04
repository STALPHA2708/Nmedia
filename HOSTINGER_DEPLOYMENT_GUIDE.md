# 🚀 Hostinger Deployment Guide - Nomedia Production

## ✅ Pre-Deployment Checklist

Your application is **production-ready** with the unified database system that automatically switches between SQLite (development) and PostgreSQL (production).

### 🔧 **What's Already Configured:**

- ✅ **Dual Database Support** (SQLite ↔ PostgreSQL)
- ✅ **Environment-based Auto-detection**
- ✅ **Production-optimized Build Process**
- ✅ **Security Features** (bcrypt, JWT, input validation)
- ✅ **Error Handling & Logging**
- ✅ **Responsive UI** with Tailwind CSS
- ✅ **API Routes** for all features

## 🏗️ **Hostinger Deployment Steps**

### Step 1: Set Up PostgreSQL Database on Hostinger

1. **Login to Hostinger Control Panel**
2. **Go to Database Management**
   - Navigate to **Databases** → **PostgreSQL**
   - Create a new PostgreSQL database
3. **Note Down Connection Details:**
   ```
   Host: [your-host].hostinger.com
   Database: [database-name]
   Username: [username]
   Password: [password]
   Port: 5432
   ```

### Step 2: Deploy Application Files

#### Option A: Direct File Upload
1. **Build the application:**
   ```bash
   npm run build
   ```
2. **Upload files to Hostinger:**
   - Upload all project files to your hosting directory
   - Ensure `package.json` and `dist/` folder are included

#### Option B: Git Deployment (Recommended)
1. **Push to GitHub** (already connected)
2. **Clone on Hostinger:**
   ```bash
   git clone [your-repo-url]
   cd [project-directory]
   npm install
   npm run build
   ```

### Step 3: Configure Environment Variables

Set these environment variables in Hostinger:

```bash
# Production Configuration
NODE_ENV=production
DATABASE_TYPE=postgresql

# PostgreSQL Configuration (from Step 1)
DB_HOST=[your-hostinger-db-host]
DB_NAME=[your-database-name]
DB_USER=[your-username]
DB_PASSWORD=[your-password]
DB_PORT=5432

# Security
JWT_SECRET=[generate-a-strong-secret]

# Optional: Connection String Format
# DATABASE_URL=postgresql://username:password@host:5432/database
```

### Step 4: Install Dependencies & Start

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Start the application
npm start
```

## 🔐 **Security Configuration**

### Environment Variables Security
Never commit these to Git:
```bash
# .env (for local development only)
DB_PASSWORD=your-local-password
JWT_SECRET=your-jwt-secret
```

### Production Security Checklist
- ✅ Strong JWT secret (32+ characters)
- ✅ Database credentials secured
- ✅ HTTPS enabled (Hostinger provides SSL)
- ✅ Input validation on all endpoints
- ✅ Password hashing with bcrypt
- ✅ SQL injection protection

## 📊 **Database Auto-Migration**

When your app starts on Hostinger, it will automatically:

1. **Detect PostgreSQL** configuration
2. **Create all tables:**
   - users
   - projects
   - employees
   - departments
   - contract_types
   - expenses
   - invoices
   - project_team_members

3. **Initialize demo data:**
   ```
   Admin: admin@nomedia.ma / admin123
   Manager: mohammed@nomedia.ma / mohammed123
   Manager: zineb@nomedia.ma / zineb123
   User: karim@nomedia.ma / karim123
   ```

## 🌐 **Domain Configuration**

### Custom Domain Setup
1. **Point domain to Hostinger** servers
2. **Configure DNS** in Hostinger panel
3. **Enable SSL certificate** (free with Hostinger)
4. **Update application URLs** if needed

### API Endpoints
Your API will be available at:
```
https://yourdomain.com/api/auth/login
https://yourdomain.com/api/projects
https://yourdomain.com/api/employees
https://yourdomain.com/api/dashboard/stats
```

## 🧪 **Testing Production Deployment**

### Health Check
Test the health endpoint:
```bash
curl https://yourdomain.com/api/health
```

Expected response:
```json
{
  "success": true,
  "status": "healthy",
  "database": "connected",
  "databaseType": "POSTGRESQL",
  "environment": "production"
}
```

### Login Test
```bash
curl -X POST https://yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@nomedia.ma", "password": "admin123"}'
```

### Demo Accounts Status
```bash
curl https://yourdomain.com/api/demo-status
```

## 🔄 **Deployment Workflow**

### Development → Production
1. **Test locally** with SQLite:
   ```bash
   npm run dev
   ```

2. **Test with PostgreSQL** (Docker):
   ```bash
   docker-compose up -d postgres
   # App automatically switches to PostgreSQL
   ```

3. **Build for production:**
   ```bash
   npm run build
   ```

4. **Deploy to Hostinger**
5. **Configure PostgreSQL** environment variables
6. **App automatically uses PostgreSQL** in production

## 📁 **Required Files for Hostinger**

Ensure these files are uploaded:

### Core Application Files
```
├── package.json
├── dist/ (built frontend)
├── server/ (backend code)
├── node_modules/ (or run npm install)
├── netlify.toml (for routing)
└── .env (production environment variables)
```

### Database Configuration Files
```
├── server/config/unified-database.ts
├── server/config/postgresql-adapter.ts
├── server/config/database-factory.ts
└── server/routes/ (all API routes)
```

## 🚨 **Troubleshooting**

### Common Issues

**1. Database Connection Failed**
```bash
# Check environment variables
echo $DB_HOST
echo $DB_NAME
echo $DB_USER

# Test PostgreSQL connection
npm run setup-db
```

**2. Build Errors**
```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
```

**3. Environment Variables Not Loading**
- Verify variables are set in Hostinger panel
- Check for typos in variable names
- Ensure no trailing spaces

### Debug Mode
Enable detailed logging:
```bash
DEBUG=database npm start
```

## 📈 **Performance Optimization**

### Production Optimizations Already Included:
- ✅ **Vite Production Build** (minified, optimized)
- ✅ **Database Connection Pooling**
- ✅ **Gzip Compression**
- ✅ **Static Asset Optimization**
- ✅ **Lazy Loading** for components

### Hostinger-Specific Optimizations:
- ✅ **PostgreSQL Indexing** (automatically created)
- ✅ **SSL Connection** to database
- ✅ **Connection Pool Management**
- ✅ **Error Logging** for monitoring

## 🔍 **Monitoring & Maintenance**

### Health Monitoring
Set up monitoring for:
- `/api/health` endpoint
- Database connection status
- Application errors
- Performance metrics

### Backup Strategy
- **Database**: Use Hostinger's PostgreSQL backup features
- **Files**: Regular file backups through Hostinger panel
- **Code**: Git repository as backup

## 🎯 **Go-Live Checklist**

Before going live:

- [ ] PostgreSQL database created on Hostinger
- [ ] Environment variables configured
- [ ] Application files uploaded and built
- [ ] Health endpoint returns success
- [ ] Login functionality tested
- [ ] SSL certificate active
- [ ] Custom domain configured (if applicable)
- [ ] Demo accounts working
- [ ] All features tested in production

## 📞 **Support**

### Resources
- **Application Logs**: Check Hostinger error logs
- **Database Logs**: Monitor PostgreSQL connection
- **API Testing**: Use `/api/health` and `/api/demo-status`

### Common URLs
- **Frontend**: `https://yourdomain.com`
- **API Base**: `https://yourdomain.com/api`
- **Health Check**: `https://yourdomain.com/api/health`
- **Login**: `https://yourdomain.com/login`

Your application is **production-ready** and will automatically adapt to Hostinger's PostgreSQL environment! 🚀
