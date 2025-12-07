# Nomedia - Self-Hosted Docker Edition

## 🎯 Overview

Nomedia is a professional audiovisual production management system. This is the **self-hosted Docker edition** designed to run entirely on your own computer - no cloud, no subscriptions, complete data privacy.

---

## ⚡ Super Quick Start

### Windows:
1. Install Docker Desktop
2. Double-click `start.bat`
3. Follow the prompts
4. Access at http://localhost:8000

### Linux/Mac:
1. Install Docker
2. Run `./start.sh`
3. Follow the prompts
4. Access at http://localhost:8000

**That's it!** See [CLIENT_SETUP_GUIDE.md](CLIENT_SETUP_GUIDE.md) for detailed instructions.

---

## 📦 What's Included

- ✅ Full Nomedia application (frontend + backend)
- ✅ PostgreSQL database
- ✅ Automatic startup/shutdown scripts
- ✅ Data persistence (survives restarts)
- ✅ Easy backup system
- ✅ Complete isolation (runs in containers)

---

## 🗂️ File Structure

```
nomedia/
├── start.bat                          # Windows startup script
├── start.sh                           # Linux/Mac startup script
├── stop.bat                           # Windows stop script
├── stop.sh                            # Linux/Mac stop script
├── Dockerfile                         # Application container definition
├── docker-compose.selfhosted.yml      # Complete stack configuration
├── .env.selfhosted                    # Configuration template
├── .env                               # Your configuration (created on first run)
├── CLIENT_SETUP_GUIDE.md              # Detailed setup guide
├── DOCKER_README.md                   # This file
└── backups/                           # Database backups folder
```

---

## 🚀 Features

### User Management
- Multi-user support with role-based access
- Employee directory
- Department organization
- Contract type management

### Project Management
- Project tracking
- Timeline management
- Status monitoring
- Budget tracking

### Financial Management
- Invoice generation & tracking
- Expense management
- Financial reporting
- PDF export

### Data Management
- Automatic backups
- Data export
- Secure storage
- Full data ownership

---

## 💾 Data Persistence

All data is stored in Docker volumes and persists even when containers are stopped or removed:

- **Database Data**: `nomedia_database_data`
- **Uploaded Files**: `nomedia_uploads_data`
- **Logs**: `nomedia_logs_data`

To view volumes:
```bash
docker volume ls | grep nomedia
```

---

## 🔧 Configuration

All configuration is in the `.env` file:

```env
# Database
DB_NAME=nomedia
DB_USER=nomedia_user
DB_PASSWORD=your_secure_password

# Security (CHANGE THESE!)
JWT_SECRET=your_random_secret_here
SESSION_SECRET=another_random_secret_here

# Application
PORT=8000
```

Generate secure secrets:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 📊 System Requirements

### Minimum:
- RAM: 4GB
- Storage: 10GB free
- CPU: 2 cores
- OS: Windows 10/11, macOS 10.14+, or modern Linux

### Recommended:
- RAM: 8GB
- Storage: 20GB free
- CPU: 4 cores
- SSD storage

---

## 🌐 Network Access

### Local Only (Default):
- Access: `http://localhost:8000`
- Only accessible from the host computer

### Network Access (Optional):
1. Find your computer's IP (e.g., `192.168.1.100`)
2. Edit `.env` file:
   ```env
   API_BASE_URL=http://192.168.1.100:8000/api
   FRONTEND_URL=http://192.168.1.100:8000
   CORS_ORIGIN=http://192.168.1.100:8000
   ```
3. Restart: `docker-compose -f docker-compose.selfhosted.yml restart`
4. Access from any device: `http://192.168.1.100:8000`

---

## 🛠️ Maintenance

### Update Application:
```bash
# Stop current version
docker-compose -f docker-compose.selfhosted.yml down

# Rebuild with new code
docker-compose -f docker-compose.selfhosted.yml up -d --build
```

### Backup Database:
```bash
# Backups are saved to ./backups/ folder
docker run --rm \
  -v nomedia_database_data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/backup-$(date +%Y%m%d).tar.gz /data
```

### View Logs:
```bash
# Application logs
docker-compose -f docker-compose.selfhosted.yml logs -f app

# Database logs
docker-compose -f docker-compose.selfhosted.yml logs -f database

# All logs
docker-compose -f docker-compose.selfhosted.yml logs -f
```

### Restart Services:
```bash
docker-compose -f docker-compose.selfhosted.yml restart
```

---

## 🔍 Monitoring

### Check Status:
```bash
docker-compose -f docker-compose.selfhosted.yml ps
```

### Check Health:
```bash
docker inspect nomedia-app | grep -A 10 Health
```

### Resource Usage:
```bash
docker stats nomedia-app nomedia-database
```

---

## 🐛 Troubleshooting

### Container Won't Start:
```bash
# Check logs
docker-compose -f docker-compose.selfhosted.yml logs

# Rebuild from scratch
docker-compose -f docker-compose.selfhosted.yml up -d --build --force-recreate
```

### Port Already in Use:
Edit `.env` and change:
```env
PORT=8080  # or any other available port
```

### Reset Everything:
```bash
# WARNING: This deletes ALL data!
docker-compose -f docker-compose.selfhosted.yml down -v
docker-compose -f docker-compose.selfhosted.yml up -d --build
```

---

## 🔐 Security

### Best Practices:
1. ✅ Generate strong random secrets for JWT_SECRET and SESSION_SECRET
2. ✅ Use a strong database password
3. ✅ Change the default admin password immediately
4. ✅ Regular backups (weekly recommended)
5. ✅ Keep Docker Desktop updated
6. ✅ Don't expose to internet without proper firewall

### Data Privacy:
- ✅ All data stays on your computer
- ✅ No external connections required
- ✅ No telemetry or tracking
- ✅ Complete data ownership

---

## 📈 Scaling

For larger deployments (50+ users), consider:
- Increasing Docker resource limits
- Using external PostgreSQL instance
- Adding Redis for caching
- Load balancing multiple instances

See `docker-compose.prod.yml` for advanced configuration.

---

## 📝 License

See LICENSE file for details.

---

## 🆘 Support

1. Read [CLIENT_SETUP_GUIDE.md](CLIENT_SETUP_GUIDE.md)
2. Check logs: `docker-compose -f docker-compose.selfhosted.yml logs`
3. Verify Docker is running: `docker info`
4. Contact your system administrator

---

## 🎓 Advanced Usage

### Access Database Directly:
```bash
docker exec -it nomedia-database psql -U nomedia_user -d nomedia
```

### Execute Commands in Container:
```bash
docker exec -it nomedia-app sh
```

### Copy Files from Container:
```bash
docker cp nomedia-app:/app/logs/app.log ./local-logs/
```

### Custom Docker Compose File:
Create your own `docker-compose.custom.yml` based on `docker-compose.selfhosted.yml`

---

## 📚 Additional Resources

- Docker Documentation: https://docs.docker.com
- PostgreSQL Documentation: https://www.postgresql.org/docs
- Docker Compose Reference: https://docs.docker.com/compose

---

**Made with ❤️ for self-hosting enthusiasts**
