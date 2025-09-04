# 🏠 Hostinger SQLite Deployment Guide

## Prerequisites
- Hostinger VPS or Cloud Hosting account
- Node.js support enabled
- SSH access to your hosting

## 📁 Deployment Steps

### 1. Prepare Environment Variables
Create `.env.production` file:
```env
# Database Configuration - SQLite
DATABASE_TYPE=sqlite
SQLITE_PATH=./nomedia.db

# Application Configuration
NODE_ENV=production
PORT=8000
FRONTEND_PORT=8080

# JWT Configuration
JWT_SECRET=your-production-jwt-secret-change-this
JWT_EXPIRES_IN=7d

# API Configuration
API_BASE_URL=https://yourdomain.com/api
FRONTEND_URL=https://yourdomain.com

# Security Configuration
BCRYPT_ROUNDS=12
SESSION_SECRET=your-production-session-secret
```

### 2. Build Application
```bash
# Install dependencies
npm install

# Build client
npm run build

# Build server
npm run build:server
```

### 3. Upload Files to Hostinger
Upload these files/folders:
```
nomedia/
├── dist/               # Built server
├── dist-client/        # Built client (from npm run build)
├── nomedia.db         # SQLite database file
├── .env.production    # Production environment
├── package.json       # Dependencies
└── node_modules/      # Or run npm install on server
```

### 4. Set File Permissions
```bash
# Make SQLite file writable
chmod 664 nomedia.db
chmod 755 .

# Make sure Node.js can write to database directory
chown -R www-data:www-data nomedia.db
```

### 5. Configure Hostinger
- Set Node.js version (18+ recommended)
- Set startup file: `dist/server.js`
- Set environment variables in Hostinger control panel

### 6. Start Application
```bash
npm start
# or
node dist/server.js
```

## 🔧 Hostinger-Specific Configuration

### VPS/Cloud Hosting
```nginx
# Add to your Nginx config
server {
    listen 80;
    server_name yourdomain.com;
    
    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Process Manager (PM2)
```bash
# Install PM2
npm install -g pm2

# Create ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'nomedia',
    script: 'dist/server.js',
    env: {
      NODE_ENV: 'production',
      PORT: 8000
    }
  }]
}
EOF

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## 📊 Database Backup
```bash
# Create backup script
cat > backup-sqlite.sh << EOF
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
cp nomedia.db "backups/nomedia_backup_$DATE.db"
# Keep only last 10 backups
ls -t backups/nomedia_backup_*.db | tail -n +11 | xargs rm -f
EOF

chmod +x backup-sqlite.sh

# Add to crontab for daily backups
echo "0 2 * * * /path/to/backup-sqlite.sh" | crontab -
```

## ⚠️ Important Notes

### SQLite Limitations on Shared Hosting:
- File write permissions may be restricted
- Database file must be in writable directory
- Concurrent users might face locking issues

### Recommended for SQLite:
- Small to medium applications
- Single server deployments
- Development/staging environments

### Consider PostgreSQL if:
- High concurrent users (>10 simultaneous)
- Multiple server instances needed
- Advanced database features required

## 🆘 Troubleshooting

### Database Permission Issues:
```bash
# Check file permissions
ls -la nomedia.db

# Fix permissions
chmod 664 nomedia.db
chown www-data:www-data nomedia.db
```

### Node.js Version Issues:
- Ensure Node.js 18+ is installed
- Update package.json engines field
- Use nvm for version management

### Environment Variable Issues:
- Verify .env.production is loaded
- Check Hostinger environment variables
- Test with: `console.log(process.env.DATABASE_TYPE)`
