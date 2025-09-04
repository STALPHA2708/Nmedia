# 🎬 Nomedia Production Management System

**Professional audiovisual production management platform - Ready for production deployment**

## 🚀 Quick Production Deployment

### Prerequisites
- **Node.js** 18+ 
- **npm** 8+
- **1GB+ disk space**

### One-Line Setup
```bash
git clone <repository> && cd nomedia-production && npm install && npm run setup-db && npm run build
```

### Start Production Server
```bash
npm run start:prod
```

**Access:** `http://localhost:5000`  
**Admin Login:** `admin@nomedia.ma` / `admin123`

---

## 🏗️ Production Hosting Options

### Option 1: VPS/Cloud Server (Recommended)
```bash
# 1. Clone repository
git clone <your-repository-url>
cd nomedia-production

# 2. Install dependencies
npm install

# 3. Setup database
npm run setup-db

# 4. Configure environment
cp .env.example .env
# Edit .env with production settings

# 5. Build application
npm run build

# 6. Start with PM2 (recommended)
npm install -g pm2
pm2 start "npm run start:prod" --name "nomedia-production"
pm2 startup
pm2 save
```

### Option 2: Docker Deployment
```dockerfile
# Dockerfile included in project
docker build -t nomedia-production .
docker run -p 5000:5000 -v $(pwd)/data:/app/data nomedia-production
```

### Option 3: Netlify/Vercel (Static + Serverless)
- Build: `npm run build`
- Publish: `dist` directory
- Functions: `netlify/functions` (included)

---

## 🔧 Environment Configuration

### Production .env Template
```bash
NODE_ENV=production
PORT=5000
JWT_SECRET=your_secure_jwt_secret_here
DATABASE_URL=sqlite:./nomedia.db
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads
```

### SSL/HTTPS Setup (Recommended)
```bash
# Using nginx reverse proxy
server {
    listen 443 ssl;
    server_name your-domain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 📊 System Features

### ✅ Core Functionality
- **Employee Management** - Full CRUD with contract handling
- **Project Management** - Simplified workflow for daily use
- **Financial Tracking** - Expenses and invoice management
- **File Management** - Contract and receipt uploads
- **User Authentication** - Role-based access control

### ✅ Production Ready
- **SQLite Database** - Zero-config, reliable storage
- **Performance Optimized** - Indexed queries, efficient operations
- **Data Validation** - Form validation and database constraints
- **Error Handling** - Comprehensive error management
- **Backup System** - Automated data protection

---

## 🔐 Security & Maintenance

### Security Checklist
- [ ] Change default admin password
- [ ] Update JWT_SECRET in .env
- [ ] Enable HTTPS in production
- [ ] Configure firewall rules
- [ ] Set up regular backups

### Maintenance Commands
```bash
npm run backup          # Create system backup
npm run check-system    # Verify system health
npm run setup-db        # Reset/update database schema
```

### Backup Strategy
```bash
# Automated daily backups (cron job)
0 2 * * * cd /path/to/nomedia && npm run backup

# Manual backup
npm run backup
# Creates: backups/YYYYMMDD_HHMMSS/
```

---

## 📱 Usage Guide

### Daily Operations
1. **Employee Management**
   - Add new employees with contracts
   - View/download contract PDFs
   - Track employment status

2. **Project Management** 
   - Create projects with client details
   - Set budgets and deadlines
   - Monitor progress

3. **Financial Operations**
   - Record project expenses
   - Generate client invoices
   - Track budget utilization

### Default Admin Access
- **URL:** `http://your-domain.com:5000`
- **Email:** `admin@nomedia.ma`
- **Password:** `admin123` (⚠️ Change immediately)

---

## 🆘 Troubleshooting

### Common Issues
```bash
# Database locked
sudo pkill node
npm run setup-db

# Port already in use
lsof -ti:5000 | xargs kill
npm run start:prod

# File upload errors
mkdir -p uploads/contracts uploads/receipts
chmod 755 uploads

# Build errors
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Support & Logs
```bash
# Check application logs
tail -f logs/app.log

# Database status
npm run check-system

# System health
curl http://localhost:5000/api/health
```

---

## 📞 Production Support

### System Requirements
- **Minimum:** 1 CPU, 512MB RAM, 1GB storage
- **Recommended:** 2 CPU, 2GB RAM, 5GB storage
- **OS:** Ubuntu 20.04+, CentOS 8+, or similar

### Performance Monitoring
- Monitor disk space for database growth
- Watch memory usage during file uploads
- Set up log rotation for long-term operation

---

## 🎉 Production Deployment Complete

**The Nomedia Production system is production-ready and optimized for daily audiovisual production management.**

**Next Steps:**
1. Deploy to your production server
2. Configure domain and SSL
3. Change default credentials
4. Import your team and project data
5. Begin daily operations

**Documentation:** This README contains everything needed for production deployment and operation.
