# 🚀 Nomedia Production - Hosting Guide

## 🏗️ Production Hosting Options

### 1. VPS/Cloud Server (Recommended)

**Providers:** DigitalOcean, Linode, AWS EC2, Google Cloud, Azure

```bash
# Server setup
git clone <repository>
cd nomedia-production
npm install
npm run setup-db
npm run build

# Production start
npm run start:prod
```

**Requirements:**
- Ubuntu 20.04+ / CentOS 8+
- Node.js 18+
- 512MB RAM minimum
- 1GB storage minimum

### 2. Shared Hosting with Node.js

**Providers:** Hostinger, Namecheap, A2 Hosting

- Upload files via FTP/SFTP
- Use hosting panel to run `npm install`
- Set startup script to `npm run start:prod`
- Configure environment variables in panel

### 3. Platform-as-a-Service

**Heroku:**
```bash
heroku create nomedia-production
git push heroku main
heroku config:set NODE_ENV=production
```

**Railway/Render:**
- Connect GitHub repository
- Build command: `npm run build`
- Start command: `npm run start:prod`

## 🔧 Domain & SSL Setup

### Domain Configuration
```bash
# A Record
Type: A
Name: @
Value: YOUR_SERVER_IP

# CNAME (optional www)
Type: CNAME  
Name: www
Value: yourdomain.com
```

### Free SSL with Let's Encrypt
```bash
sudo apt install certbot nginx
sudo certbot --nginx -d yourdomain.com
```

### Nginx Configuration
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name yourdomain.com www.yourdomain.com;
    
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 🔄 Process Management

### PM2 (Recommended)
```bash
npm install -g pm2
pm2 start "npm run start:prod" --name nomedia
pm2 startup
pm2 save
pm2 monitor
```

### Systemd Service
```bash
# Create service file
sudo nano /etc/systemd/system/nomedia.service

[Unit]
Description=Nomedia Production
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/nomedia-production
ExecStart=/usr/bin/npm run start:prod
Restart=always

[Install]
WantedBy=multi-user.target

# Enable service
sudo systemctl enable nomedia
sudo systemctl start nomedia
```

## 🛡️ Security & Maintenance

### Essential Security
```bash
# Firewall
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable

# Updates
sudo apt update && sudo apt upgrade
```

### Automated Backups
```bash
# Add to crontab
crontab -e

# Daily backup at 2 AM
0 2 * * * cd /path/to/nomedia && npm run backup
```

## 🔍 Monitoring & Logs

### Application Logs
```bash
# PM2 logs
pm2 logs nomedia

# System logs
sudo journalctl -u nomedia -f
```

### Health Check
```bash
curl https://yourdomain.com/api/health
```

## ✅ Go Live Checklist

- [ ] Server provisioned and accessible
- [ ] Domain pointing to server IP
- [ ] SSL certificate installed
- [ ] Application deployed and running
- [ ] Database initialized with `npm run setup-db`
- [ ] Admin login tested
- [ ] File uploads working
- [ ] Backups configured
- [ ] Monitoring set up

## 🎉 Production Ready

Your Nomedia Production system is now live and ready for daily audiovisual production management!

**Access:** `https://yourdomain.com`  
**Admin:** `admin@nomedia.ma` / `admin123` (change immediately)
