# 🐳 PostgreSQL Docker Testing Guide

## 🚀 **Quick Start - Test PostgreSQL**

### **Step 1: Start PostgreSQL Container**
```bash
# Start PostgreSQL in detached mode
docker-compose up -d postgres

# Expected output:
# Creating nomedia-postgres ... done
```

### **Step 2: Verify Container is Running**
```bash
# Check container status
docker-compose ps

# Expected output:
# Name                  Command               State           Ports
# nomedia-postgres     docker-entrypoint.sh postgres   Up   0.0.0.0:5432->5432/tcp
```

### **Step 3: Check PostgreSQL Logs**
```bash
# View PostgreSQL startup logs
docker-compose logs postgres

# Expected output should include:
# PostgreSQL init process complete; ready for start up
# database system is ready to accept connections
```

### **Step 4: Test Database Connection**
```bash
# Test connection using test script
node test-postgres-connection.js

# Or manually connect to database
docker-compose exec postgres psql -U nomedia_user -d nomedia_production
```

## 🔄 **Switch Your Application to PostgreSQL**

### **Method 1: Environment Variables (Recommended)**
Set these environment variables to switch to PostgreSQL:

```bash
# Set PostgreSQL configuration
export DATABASE_TYPE=postgresql
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=nomedia_production
export DB_USER=nomedia_user
export DB_PASSWORD=nomedia_password123
```

### **Method 2: Using Dev Server Control**
I can help you switch the application environment:

## 🧪 **Testing Steps**

### **1. Start PostgreSQL**
```bash
docker-compose up -d postgres
```

### **2. Wait for Ready State (10-30 seconds)**
```bash
# Check if ready
docker-compose logs postgres | grep "ready to accept connections"
```

### **3. Test Connection**
```bash
# Test using psql
docker-compose exec postgres psql -U nomedia_user -d nomedia_production -c "SELECT version();"

# Test using Node.js script
node test-postgres-connection.js
```

### **4. Switch Application to PostgreSQL**
The application will automatically detect PostgreSQL when environment variables are set.

## 📊 **Expected Results**

### **Successful PostgreSQL Start**
```
nomedia-postgres | PostgreSQL Database directory appears to contain a database
nomedia-postgres | LOG: database system is ready to accept connections
```

### **Successful Connection Test**
```
🐳 Testing PostgreSQL Docker Connection...
✅ Connected to PostgreSQL successfully!
✅ Query successful!
📊 PostgreSQL Version: PostgreSQL 15.x
✅ Database access confirmed!
🎉 PostgreSQL Docker Test PASSED!
```

### **Application Switch to PostgreSQL**
When you restart your app, you should see:
```
🗄️ Detected database type: POSTGRESQL
📊 Database: nomedia_production@localhost:5432
🔧 Initializing PostgreSQL database schema...
✅ PostgreSQL database initialized successfully
```

## 🔧 **Database Management Commands**

### **Basic Docker Operations**
```bash
# Start PostgreSQL
docker-compose up -d postgres

# Stop PostgreSQL
docker-compose down

# Restart PostgreSQL
docker-compose restart postgres

# View real-time logs
docker-compose logs -f postgres

# Remove all containers and data
docker-compose down -v
```

### **Database Operations**
```bash
# Connect to database
docker-compose exec postgres psql -U nomedia_user -d nomedia_production

# List tables
\dt

# Describe a table
\d users

# Run a query
SELECT * FROM users LIMIT 5;

# Exit psql
\q
```

### **Backup and Restore**
```bash
# Create backup
docker-compose exec postgres pg_dump -U nomedia_user nomedia_production > backup.sql

# Restore backup
docker-compose exec -T postgres psql -U nomedia_user nomedia_production < backup.sql
```

## 🎯 **Optional: pgAdmin GUI**

### **Start pgAdmin**
```bash
# Start database GUI
docker-compose up -d pgadmin

# Access at: http://localhost:8081
# Email: admin@nomedia.ma
# Password: admin123
```

### **Connect to Database in pgAdmin**
1. Open http://localhost:8081
2. Login with admin@nomedia.ma / admin123
3. Add new server:
   - **Name**: Nomedia Production
   - **Host**: postgres (container name)
   - **Port**: 5432
   - **Database**: nomedia_production
   - **Username**: nomedia_user
   - **Password**: nomedia_password123

## 🐛 **Troubleshooting**

### **Issue: Connection Refused**
```bash
# Check if Docker is running
docker --version

# Check if container is running
docker-compose ps

# Restart containers
docker-compose down && docker-compose up -d postgres
```

### **Issue: Port Already in Use**
```bash
# Check what's using port 5432
lsof -i :5432

# Kill process or change port in docker-compose.yml
```

### **Issue: Permission Denied**
```bash
# Ensure Docker daemon is running
sudo systemctl start docker

# Add user to docker group
sudo usermod -aG docker $USER
```

### **Issue: Database Not Ready**
```bash
# Wait longer for PostgreSQL to start
sleep 30

# Check health status
docker-compose exec postgres pg_isready -U nomedia_user
```

## ✅ **Verification Checklist**

After testing PostgreSQL:

- [ ] PostgreSQL container is running (`docker-compose ps`)
- [ ] Database accepts connections (`pg_isready`)
- [ ] Test script passes (`node test-postgres-connection.js`)
- [ ] Application switches to PostgreSQL
- [ ] Demo accounts are created automatically
- [ ] Login works with `admin@nomedia.ma / admin123`
- [ ] All API endpoints function correctly

## 🎉 **Success Indicators**

### **PostgreSQL Ready**
- Container shows "ready to accept connections"
- Port 5432 is accessible
- Test connection succeeds

### **Application Using PostgreSQL**
- Logs show "POSTGRESQL" database type
- Tables are created automatically
- Demo data is initialized
- Health endpoint returns PostgreSQL status

## 🔄 **Next Steps**

1. **Test PostgreSQL** with Docker locally
2. **Verify all features** work with PostgreSQL
3. **Deploy to Hostinger** with confidence
4. **Use same PostgreSQL** configuration in production

Your application is **ready to seamlessly switch** between SQLite (development) and PostgreSQL (production)! 🚀
