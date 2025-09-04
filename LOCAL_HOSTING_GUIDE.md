# 🏠 LOCAL HOSTING SETUP - 5 USERS
## Simple Local Deployment Guide

---

## 🎯 **QUICK SETUP (Recommended)**

### **Option 1: Single Computer Setup**
Host everything on one computer that others access via network.

```
┌─────────────────────────────────────────┐
│           MAIN COMPUTER                 │
│        (Runs the Server)                │
│     IP: 192.168.1.100                   │
│     Port: 8000                          │
└─────────────┬───────────────────────────┘
              │
    ┌─────────┴─────────┐
    │  LOCAL NETWORK    │
    │   (WiFi/LAN)      │
    └─────────┬─────────┘
              │
┌─────────────┴───────────────────────────┐
│  4 OTHER COMPUTERS ACCESS VIA:          │
│  http://192.168.1.100:8000              │
│  (No installation needed)               │
└─────────────────────────────────────────┘
```

---

## ⚡ **QUICK START (5 MINUTES)**

### **Step 1: Prepare Main Computer**
```bash
# 1. Find your computer's IP address
# Windows: ipconfig
# Mac/Linux: ifconfig or ip addr

# 2. Note your IP (example: 192.168.1.100)
```

### **Step 2: Configure for Network Access**
Create `.env.production`:
```env
PORT=8000
HOST=0.0.0.0
NODE_ENV=production
DB_PATH=./nomedia.db
JWT_SECRET=nomedia-local-secure-key-2024
CORS_ORIGIN=*
```

### **Step 3: Build and Start**
```bash
# Build the application with fixes
npm run build

# Start production server
npm run start:prod

# Keep it running (optional)
npm install -g pm2
pm2 start "npm run start:prod" --name nomedia
pm2 startup
pm2 save
```

### **Step 4: Open Network Access**
```bash
# Windows Firewall
netsh advfirewall firewall add rule name="Nomedia" dir=in action=allow protocol=TCP localport=8000

# Mac/Linux
sudo ufw allow 8000
```

### **Step 5: Share with Team**
Give your team the URL:
```
http://YOUR_IP_ADDRESS:8000
```
Example: `http://192.168.1.100:8000`

---

## 👥 **USER ACCOUNTS (Already Set Up)**

```
Admin:    mohammed@nomedia.ma  : mohammed123
Manager:  zineb@nomedia.ma     : zineb123  
User:     karim@nomedia.ma     : karim123
User:     alice.martin@nomedia.ma : (create password)
Manager:  david.chen@nomedia.ma  : (create password)
```

---

## 🔧 **FIXES INCLUDED**

✅ **Invoice Status Updates** - Fixed 400 error when changing status  
✅ **Database Updates** - Status field properly saved  
✅ **Confirm Button** - Now works correctly  
✅ **Local Network Access** - All users can access same data  

---

## 📱 **ACCESS METHODS**

### **Method 1: Browser Bookmarks**
Each user bookmarks: `http://192.168.1.100:8000`

### **Method 2: Desktop Shortcuts**
Create desktop shortcuts pointing to the URL

### **Method 3: PWA (Progressive Web App)**
1. Open in Chrome/Edge
2. Click "Install App" icon in address bar
3. Creates desktop app

---

## 🚀 **PRODUCTION STARTUP SCRIPT**

Create `start-nomedia.sh`:
```bash
#!/bin/bash
echo "🚀 Starting Nomedia Production..."

# Build latest changes
npm run build

# Start with PM2
pm2 start "npm run start:prod" --name nomedia
pm2 startup
pm2 save

echo "✅ Nomedia running at: http://$(hostname -I | cut -d' ' -f1):8000"
echo "📱 Share this URL with your team"
```

Make executable and run:
```bash
chmod +x start-nomedia.sh
./start-nomedia.sh
```

---

## 🔍 **TESTING**

### **From Main Computer:**
```bash
curl http://localhost:8000/api/health
# Should return: {"success": true}
```

### **From Other Computers:**
```bash
# Replace with your actual IP
curl http://192.168.1.100:8000/api/health
```

### **In Browser:**
Go to `http://192.168.1.100:8000` and test:
- ✅ Login works
- ✅ Invoice status changes work
- ✅ All data syncs across users

---

## 💾 **BACKUP (Important)**

### **Daily Backup Script**
Create `backup.sh`:
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p backups
cp nomedia.db "backups/nomedia_backup_$DATE.db"
echo "✅ Backup created: nomedia_backup_$DATE.db"
```

### **Auto Backup (Optional)**
```bash
# Add to crontab for daily backup at 2 AM
crontab -e
# Add: 0 2 * * * /path/to/backup.sh
```

---

## 🆘 **TROUBLESHOOTING**

### **Can't Access from Other Computers**
```bash
# Check firewall
sudo ufw status

# Check server is listening on all interfaces
netstat -tlnp | grep 8000

# Test connectivity
ping 192.168.1.100
```

### **Server Stops Working**
```bash
# Check PM2 status
pm2 status

# Restart if needed
pm2 restart nomedia
```

### **Database Issues**
```bash
# Stop server
pm2 stop nomedia

# Check database
sqlite3 nomedia.db ".tables"

# Restart
pm2 start nomedia
```

---

## 📊 **PERFORMANCE FOR 5 USERS**

✅ **Single SQLite Database** - Perfect for 5 concurrent users  
✅ **Low Resource Usage** - Runs well on modest hardware  
✅ **Fast Response** - Local network = fast access  
✅ **No Internet Required** - Works completely offline  

---

## 🎉 **YOU'RE READY!**

Your fixes are implemented and ready for local hosting:

1. **Run the start script** 
2. **Share the URL with your team**
3. **Everyone accesses the same application**
4. **All invoice operations work correctly**

**URL to share:** `http://YOUR_IP:8000`

All the 400 errors are fixed and ready for local deployment! 🚀
