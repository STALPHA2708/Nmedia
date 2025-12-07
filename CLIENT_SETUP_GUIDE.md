# Nomedia Self-Hosted Setup Guide

## Welcome!

This guide will help you install and run Nomedia on your own computer. Everything runs locally - no internet connection required for daily use!

---

## 📋 What You Need

### System Requirements:
- **Operating System**: Windows 10/11, macOS, or Linux
- **RAM**: Minimum 4GB (8GB recommended)
- **Storage**: 10GB free space
- **Processor**: Any modern CPU (Intel/AMD)

### Software Required:
- **Docker Desktop** (we'll install this together)

That's it! Everything else is included.

---

## 🚀 Quick Start (3 Steps)

### Step 1: Install Docker Desktop

#### For Windows:
1. Download from: https://www.docker.com/products/docker-desktop
2. Run the installer
3. Restart your computer when asked
4. Start Docker Desktop from Start Menu
5. Wait for Docker to show "Running" status

#### For Mac:
1. Download from: https://www.docker.com/products/docker-desktop
2. Drag Docker.app to Applications folder
3. Launch Docker from Applications
4. Allow necessary permissions
5. Wait for Docker to show "Running" status

#### For Linux (Ubuntu/Debian):
```bash
# Install Docker
sudo apt-get update
sudo apt-get install docker.io docker-compose
sudo systemctl start docker
sudo systemctl enable docker

# Add your user to docker group (to run without sudo)
sudo usermod -aG docker $USER

# Log out and log back in for changes to take effect
```

---

### Step 2: Configure the Application

#### Windows:
1. Double-click **`start.bat`**
2. The first time, it will create a `.env` file and open it in Notepad
3. You'll see this file with instructions:

```env
JWT_SECRET=CHANGE_ME_RUN_node_-e_console.log_require_crypto_randomBytes_32_toString_hex
SESSION_SECRET=CHANGE_ME_RUN_node_-e_console.log_require_crypto_randomBytes_32_toString_hex
DB_PASSWORD=nomedia_secure_password_change_me
```

4. Generate secure secrets:
   - Open PowerShell or Command Prompt
   - Run this command TWICE (to get two different secrets):
   ```cmd
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   - Copy the first output to `JWT_SECRET`
   - Copy the second output to `SESSION_SECRET`

5. Change `DB_PASSWORD` to a strong password (e.g., `MySecurePass2024!`)

6. Save the file (Ctrl+S) and close Notepad

#### Linux/Mac:
1. Open Terminal in this directory
2. Run: `./start.sh`
3. When prompted, press Enter to edit `.env`
4. Generate secrets:
   ```bash
   openssl rand -hex 32
   ```
5. Run this command TWICE and copy outputs to `JWT_SECRET` and `SESSION_SECRET`
6. Change `DB_PASSWORD` to a strong password
7. Save the file (Ctrl+X, then Y, then Enter in nano)

---

### Step 3: Start the Application

#### Windows:
1. Double-click **`start.bat`** again
2. Wait 2-3 minutes (first time takes longer)
3. Browser will open automatically to `http://localhost:8000`
4. If browser doesn't open, manually go to: **http://localhost:8000**

#### Linux/Mac:
1. Run: `./start.sh`
2. Wait 2-3 minutes
3. Browser will open automatically
4. If not, manually go to: **http://localhost:8000**

---

## 🎉 First Login

Once the application opens:

**Default Login Credentials:**
- **Email**: `admin@nomedia.com`
- **Password**: `admin123`

**⚠️ IMPORTANT**: Change the admin password immediately after first login!
1. Go to Settings (gear icon)
2. Change your password
3. Update your email if desired

---

## 📚 Daily Usage

### Starting Nomedia:
- **Windows**: Double-click `start.bat`
- **Linux/Mac**: Run `./start.sh`
- Wait ~30 seconds
- Open browser to http://localhost:8000

### Stopping Nomedia:
- **Windows**: Double-click `stop.bat`
- **Linux/Mac**: Run `./stop.sh`

### Checking if Nomedia is Running:
```bash
docker ps
```
You should see two containers: `nomedia-app` and `nomedia-database`

---

## 🌐 Access from Other Computers (Optional)

Want to access Nomedia from other devices on your network?

### Find Your Computer's IP Address:

**Windows:**
```cmd
ipconfig
```
Look for "IPv4 Address" (e.g., `192.168.1.100`)

**Linux/Mac:**
```bash
ip addr show
# or
ifconfig
```
Look for `inet` address (e.g., `192.168.1.100`)

### Update Configuration:
1. Stop the application
2. Edit `.env` file
3. Replace `localhost` with your IP address:
```env
API_BASE_URL=http://192.168.1.100:8000/api
FRONTEND_URL=http://192.168.1.100:8000
CORS_ORIGIN=http://192.168.1.100:8000
```
4. Save and restart the application

Now other devices can access: `http://192.168.1.100:8000`

---

## 💾 Backup Your Data

### Automatic Backups (Recommended):

All data is stored in Docker volumes. To backup:

**Windows (PowerShell):**
```powershell
docker run --rm -v nomedia_database_data:/data -v ${PWD}/backups:/backup alpine tar czf /backup/nomedia-backup-$(Get-Date -Format "yyyy-MM-dd").tar.gz /data
```

**Linux/Mac:**
```bash
docker run --rm -v nomedia_database_data:/data -v $(pwd)/backups:/backup alpine tar czf /backup/nomedia-backup-$(date +%Y-%m-%d).tar.gz /data
```

Backups will be saved in the `backups/` folder.

### What Gets Backed Up:
- ✅ All employee records
- ✅ All projects
- ✅ All invoices
- ✅ All expenses
- ✅ User accounts
- ✅ Settings
- ✅ Uploaded files

### Restore from Backup:
```bash
# Stop the application first
docker-compose -f docker-compose.selfhosted.yml down

# Extract backup
docker run --rm -v nomedia_database_data:/data -v $(pwd)/backups:/backup alpine tar xzf /backup/nomedia-backup-2024-01-15.tar.gz -C /

# Start the application
./start.sh  # or start.bat on Windows
```

---

## 🔧 Troubleshooting

### Application Won't Start

**Problem**: "Docker is not running"
- **Solution**: Start Docker Desktop and wait for it to fully load

**Problem**: "Port 8000 is already in use"
- **Solution**: Stop the other application using port 8000, or edit `.env` and change `PORT=8000` to `PORT=8080`

**Problem**: Build fails with "npm install" errors
- **Solution**:
  1. Make sure you have internet connection (needed for first build)
  2. Try: `docker-compose -f docker-compose.selfhosted.yml build --no-cache`

### Can't Login

**Problem**: "Invalid credentials"
- **Solution**: Use exact credentials:
  - Email: `admin@nomedia.com`
  - Password: `admin123`

**Problem**: Page shows "Cannot connect to server"
- **Solution**:
  1. Wait 1-2 minutes for app to fully start
  2. Check if containers are running: `docker ps`
  3. Check logs: `docker-compose -f docker-compose.selfhosted.yml logs app`

### Database Issues

**Problem**: "Database connection failed"
- **Solution**:
  1. Check database is running: `docker ps | grep nomedia-database`
  2. Restart everything:
     ```bash
     docker-compose -f docker-compose.selfhosted.yml restart
     ```

### Performance Issues

**Problem**: Application is slow
- **Solution**:
  1. Check Docker Desktop has enough resources:
     - Go to Docker Desktop → Settings → Resources
     - Allocate at least 4GB RAM
     - Allocate at least 2 CPUs
  2. Restart Docker Desktop

---

## 📞 Common Commands

### View Application Logs:
```bash
docker-compose -f docker-compose.selfhosted.yml logs -f app
```

### View Database Logs:
```bash
docker-compose -f docker-compose.selfhosted.yml logs -f database
```

### Restart Application:
```bash
docker-compose -f docker-compose.selfhosted.yml restart
```

### Update to New Version:
```bash
# Stop current version
docker-compose -f docker-compose.selfhosted.yml down

# Rebuild with new code
docker-compose -f docker-compose.selfhosted.yml up -d --build
```

### Check Container Status:
```bash
docker-compose -f docker-compose.selfhosted.yml ps
```

### Access Database Directly (Advanced):
```bash
docker exec -it nomedia-database psql -U nomedia_user -d nomedia
```

---

## 🗑️ Uninstalling

### Remove Application (Keep Data):
```bash
docker-compose -f docker-compose.selfhosted.yml down
```

### Remove Application AND All Data:
```bash
docker-compose -f docker-compose.selfhosted.yml down -v
```

### Remove Docker Images:
```bash
docker rmi $(docker images | grep nomedia | awk '{print $3}')
```

---

## 📊 System Information

### What's Installed:

1. **PostgreSQL Database**
   - Stores all application data
   - Runs on port 5432
   - Data persists in Docker volume

2. **Nomedia Application**
   - Web interface + API server
   - Runs on port 8000
   - Built with Node.js, React, Express

### Disk Space Usage:

- **Docker Images**: ~500MB
- **Application Data**: Grows with usage (typically 100MB-1GB)
- **Database**: Grows with data (typically 50-500MB)

### Network Ports Used:

- **8000**: Main application (web interface + API)
- **5432**: PostgreSQL database (internal only)

---

## 🔐 Security Best Practices

1. **Change Default Password**: Immediately after first login
2. **Use Strong Secrets**: Generate random JWT_SECRET and SESSION_SECRET
3. **Secure Database Password**: Use a strong DB_PASSWORD
4. **Regular Backups**: Backup your data weekly
5. **Firewall**: If exposing to network, use firewall rules
6. **Updates**: Regularly update to new versions

---

## 📧 Support

For issues or questions:
1. Check this guide first
2. Check Docker Desktop is running
3. Check the logs: `docker-compose -f docker-compose.selfhosted.yml logs`
4. Contact your system administrator

---

## 🎯 Quick Reference Card

```
┌─────────────────────────────────────────┐
│         NOMEDIA QUICK REFERENCE         │
├─────────────────────────────────────────┤
│ START:                                  │
│   Windows: start.bat                    │
│   Linux:   ./start.sh                   │
│                                         │
│ STOP:                                   │
│   Windows: stop.bat                     │
│   Linux:   ./stop.sh                    │
│                                         │
│ ACCESS:                                 │
│   http://localhost:8000                 │
│                                         │
│ LOGIN:                                  │
│   Email: admin@nomedia.com              │
│   Pass:  admin123                       │
│                                         │
│ LOGS:                                   │
│   docker-compose -f docker-compose      │
│     .selfhosted.yml logs -f             │
│                                         │
│ RESTART:                                │
│   docker-compose -f docker-compose      │
│     .selfhosted.yml restart             │
└─────────────────────────────────────────┘
```

---

**Enjoy using Nomedia! 🚀**
