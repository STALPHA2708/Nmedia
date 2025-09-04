# 🐳 Docker PostgreSQL Setup for Nomedia

This guide helps you set up PostgreSQL using Docker for the Nomedia application.

## 🚀 Quick Start

### 1. Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop) installed and running

### 2. Setup Database

```bash
# One-time setup
node setup-docker-postgres.js
```

### 3. Start Application

```bash
npm run dev
```

## 🔧 Database Management

### Start/Stop Database

```bash
# Start PostgreSQL
node docker-manage.js start

# Stop all containers
node docker-manage.js stop

# Restart PostgreSQL
node docker-manage.js restart
```

### View Logs & Status

```bash
# Check container status
node docker-manage.js status

# View PostgreSQL logs
node docker-manage.js logs
```

### Database Access

#### Option 1: pgAdmin (Web Interface)

```bash
# Start pgAdmin
node docker-manage.js pgadmin

# Access at: http://localhost:5050
# Email: admin@nomedia.ma
# Password: admin123
```

#### Option 2: Command Line

```bash
# Connect directly to PostgreSQL
node docker-manage.js connect
```

#### Option 3: External Tools

Use any PostgreSQL client with these settings:

- **Host**: localhost
- **Port**: 5432
- **Database**: nomedia_production
- **Username**: nomedia_user
- **Password**: nomedia_password

## 🗄️ Database Operations

### Reset Database (WARNING: Deletes all data)

```bash
node docker-manage.js reset
```

### Backup Database

```bash
docker compose exec postgres pg_dump -U nomedia_user nomedia_production > backup.sql
```

### Restore Database

```bash
docker compose exec -T postgres psql -U nomedia_user nomedia_production < backup.sql
```

## 🐳 Docker Commands Reference

### Container Management

```bash
# Start PostgreSQL only
docker compose up -d postgres

# Start all services (PostgreSQL + pgAdmin)
docker compose up -d

# Stop all services
docker compose down

# View all containers
docker compose ps

# Remove containers and volumes (DANGER: Deletes data)
docker compose down -v
```

### Logs and Debugging

```bash
# View PostgreSQL logs
docker compose logs postgres

# Follow live logs
docker compose logs -f postgres

# Execute commands in container
docker compose exec postgres bash
```

## 📁 Project Structure

```
nomedia/
├── docker-compose.yml          # Docker services configuration
├── setup-docker-postgres.js    # One-time setup script
├── docker-manage.js            # Database management script
├── init-db/                    # Database initialization scripts
└── .env                        # Environment configuration
```

## 🔧 Configuration

### Environment Variables (.env)

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nomedia_production
DB_USER=nomedia_user
DB_PASSWORD=nomedia_password
```

### Docker Compose Services

- **postgres**: PostgreSQL 15 database server
- **pgadmin**: Web-based database administration tool

## 🚨 Troubleshooting

### Container Won't Start

```bash
# Check Docker is running
docker --version

# Check logs for errors
docker compose logs postgres

# Restart Docker Desktop
```

### Connection Refused

```bash
# Wait for container to fully start
docker compose logs postgres

# Check if port 5432 is available
netstat -an | grep 5432
```

### Data Loss Prevention

- Database data is stored in Docker volume `postgres_data`
- Volume persists even when containers are stopped
- Only `docker compose down -v` will delete data

## 🎯 Production Notes

- Change default passwords in production
- Use environment variables for sensitive data
- Consider using managed PostgreSQL services for production
- Regular database backups are recommended

## 📞 Support

If you encounter issues:

1. Check container logs: `docker compose logs postgres`
2. Verify Docker Desktop is running
3. Ensure port 5432 is not in use by other services
