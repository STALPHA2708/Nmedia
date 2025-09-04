#!/usr/bin/env node

/**
 * Docker Status Checker for PostgreSQL
 * Helps verify if PostgreSQL container is ready
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

// Colors
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(color, ...args) {
  console.log(color + args.join(' ') + colors.reset);
}

async function checkDockerStatus() {
  log(colors.bold + colors.cyan, '🐳 Docker PostgreSQL Status Checker\n');

  try {
    // Check if Docker is available
    log(colors.blue, '🔍 Checking Docker availability...');
    await execAsync('docker --version');
    log(colors.green, '✅ Docker is available');

    // Check if docker-compose is available
    log(colors.blue, '🔍 Checking Docker Compose...');
    await execAsync('docker-compose --version');
    log(colors.green, '✅ Docker Compose is available');

    // Check if PostgreSQL container is running
    log(colors.blue, '🔍 Checking PostgreSQL container...');
    const { stdout } = await execAsync('docker-compose ps postgres');
    
    if (stdout.includes('Up')) {
      log(colors.green, '✅ PostgreSQL container is running');
      
      // Check PostgreSQL health
      log(colors.blue, '🔍 Checking PostgreSQL health...');
      try {
        await execAsync('docker-compose exec -T postgres pg_isready -U nomedia_user');
        log(colors.green, '✅ PostgreSQL is ready to accept connections');
        
        log(colors.bold + colors.green, '\n🎉 PostgreSQL is ready for testing!');
        log(colors.cyan, '\n📋 Your app is configured to use PostgreSQL:');
        log(colors.cyan, '  DATABASE_TYPE=postgresql');
        log(colors.cyan, '  DB_HOST=localhost');
        log(colors.cyan, '  DB_PORT=5432');
        log(colors.cyan, '  DB_NAME=nomedia_production');
        log(colors.cyan, '  DB_USER=nomedia_user');
        
        return true;
      } catch (error) {
        log(colors.yellow, '⚠️ PostgreSQL container is running but not ready yet');
        log(colors.cyan, '   Wait 10-30 seconds and try again');
        return false;
      }
    } else {
      log(colors.red, '❌ PostgreSQL container is not running');
      log(colors.cyan, '\n🚀 To start PostgreSQL:');
      log(colors.cyan, '   docker-compose up -d postgres');
      return false;
    }

  } catch (error) {
    if (error.message.includes('docker-compose')) {
      log(colors.red, '❌ Docker Compose not found');
      log(colors.cyan, '\n💡 Install Docker Compose to continue');
    } else if (error.message.includes('docker')) {
      log(colors.red, '❌ Docker not found');
      log(colors.cyan, '\n💡 Install Docker to continue');
    } else {
      log(colors.red, '❌ Error:', error.message);
    }
    return false;
  }
}

async function showCommands() {
  log(colors.bold + colors.yellow, '\n🛠️ PostgreSQL Docker Commands:');
  log(colors.cyan, 'Start PostgreSQL:     docker-compose up -d postgres');
  log(colors.cyan, 'Check status:         docker-compose ps');
  log(colors.cyan, 'View logs:            docker-compose logs postgres');
  log(colors.cyan, 'Stop PostgreSQL:      docker-compose down');
  log(colors.cyan, 'Test connection:      node test-postgres-connection.js');
  log(colors.cyan, 'Start pgAdmin GUI:    docker-compose up -d pgadmin');
  
  log(colors.bold + colors.blue, '\n🌐 Access URLs:');
  log(colors.cyan, 'Application:          http://localhost:8080');
  log(colors.cyan, 'API Health:           http://localhost:9000/api/health');
  log(colors.cyan, 'pgAdmin (optional):   http://localhost:8081');
}

async function main() {
  const isReady = await checkDockerStatus();
  await showCommands();
  
  if (isReady) {
    log(colors.bold + colors.green, '\n✅ Ready to restart your application with PostgreSQL!');
  } else {
    log(colors.bold + colors.yellow, '\n⚠️ Start PostgreSQL first, then restart your application');
  }
}

// Run the checker
main().catch(console.error);
