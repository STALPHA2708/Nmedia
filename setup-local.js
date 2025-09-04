#!/usr/bin/env node

/**
 * Local Development Setup Script
 * Helps users set up Nomedia Production System locally
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
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

function header(text) {
  log(colors.bold + colors.cyan, '\n' + '='.repeat(60));
  log(colors.bold + colors.cyan, text);
  log(colors.bold + colors.cyan, '='.repeat(60));
}

async function checkPrerequisites() {
  header('🔍 CHECKING PREREQUISITES');
  
  const checks = [
    {
      name: 'Node.js',
      check: () => {
        try {
          const version = execSync('node --version', { encoding: 'utf8' }).trim();
          const major = parseInt(version.slice(1).split('.')[0]);
          return major >= 18;
        } catch (error) {
          return false;
        }
      },
      fix: 'Install Node.js v18+ from https://nodejs.org'
    },
    {
      name: 'npm',
      check: () => {
        try {
          execSync('npm --version', { encoding: 'utf8' });
          return true;
        } catch (error) {
          return false;
        }
      },
      fix: 'npm comes with Node.js installation'
    },
    {
      name: 'Git',
      check: () => {
        try {
          execSync('git --version', { encoding: 'utf8' });
          return true;
        } catch (error) {
          return false;
        }
      },
      fix: 'Install Git from https://git-scm.com'
    },
    {
      name: 'package.json',
      check: () => fs.existsSync('./package.json'),
      fix: 'Run this script from the project root directory'
    }
  ];

  let allPassed = true;

  for (const check of checks) {
    const passed = check.check();
    if (passed) {
      log(colors.green, `✅ ${check.name}`);
    } else {
      log(colors.red, `❌ ${check.name} - ${check.fix}`);
      allPassed = false;
    }
  }

  return allPassed;
}

async function installDependencies() {
  header('📦 INSTALLING DEPENDENCIES');
  
  try {
    log(colors.blue, '📥 Installing npm dependencies...');
    execSync('npm install', { stdio: 'inherit' });
    log(colors.green, '✅ Dependencies installed successfully!');
    return true;
  } catch (error) {
    log(colors.red, '❌ Failed to install dependencies:', error.message);
    return false;
  }
}

async function checkDatabaseSetup() {
  header('🗄️ DATABASE CONFIGURATION');
  
  log(colors.blue, '🔍 Checking database configuration...');
  
  if (fs.existsSync('./nomedia.db')) {
    log(colors.green, '✅ SQLite database found (nomedia.db)');
  } else {
    log(colors.yellow, '⚠️ SQLite database not found (will be created automatically)');
  }
  
  // Check if Docker is available for PostgreSQL testing
  try {
    execSync('docker --version', { encoding: 'utf8' });
    execSync('docker-compose --version', { encoding: 'utf8' });
    log(colors.green, '✅ Docker available for PostgreSQL testing');
  } catch (error) {
    log(colors.yellow, '⚠️ Docker not available (PostgreSQL testing not possible)');
  }
  
  log(colors.cyan, '\n📊 Database Options:');
  log(colors.cyan, '  🗃️ SQLite (Default): Zero configuration, perfect for development');
  log(colors.cyan, '  🐘 PostgreSQL: Advanced features, Docker required');
}

async function createEnvFile() {
  header('⚙️ ENVIRONMENT CONFIGURATION');
  
  const envPath = './.env';
  
  if (fs.existsSync(envPath)) {
    log(colors.yellow, '⚠️ .env file already exists, skipping creation');
    return;
  }
  
  const envContent = `# Nomedia Production - Local Development Environment
# This file is created automatically for local development

# Database Configuration (SQLite by default)
DATABASE_TYPE=sqlite
SQLITE_PATH=./nomedia.db

# Development Settings
NODE_ENV=development
DEBUG=

# Optional: PostgreSQL Configuration (uncomment to use)
# DATABASE_TYPE=postgresql
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=nomedia_dev
# DB_USER=your_username
# DB_PASSWORD=your_password

# Security (generate a strong secret for production)
JWT_SECRET=dev-jwt-secret-change-in-production

# Note: This .env file is for local development only
# Never commit sensitive data to Git
`;

  try {
    fs.writeFileSync(envPath, envContent);
    log(colors.green, '✅ Created .env file for local development');
  } catch (error) {
    log(colors.yellow, '���️ Could not create .env file:', error.message);
  }
}

async function testSetup() {
  header('🧪 TESTING SETUP');
  
  try {
    log(colors.blue, '🔨 Testing build process...');
    execSync('npm run build', { stdio: 'inherit' });
    log(colors.green, '✅ Build test passed!');
    
    log(colors.blue, '🔍 Checking lint configuration...');
    execSync('npm run lint', { stdio: 'inherit' });
    log(colors.green, '✅ Lint check passed!');
    
    return true;
  } catch (error) {
    log(colors.yellow, '⚠️ Some tests failed, but setup should still work');
    return false;
  }
}

function showStartupInstructions() {
  header('🚀 READY TO START DEVELOPMENT');
  
  log(colors.bold + colors.green, '🎉 Local development environment is ready!');
  
  log(colors.yellow, '\n📋 Quick Start Commands:');
  log(colors.cyan, '  npm run dev           # Start both frontend and backend');
  log(colors.cyan, '  npm run dev:client    # Start frontend only');
  log(colors.cyan, '  npm run dev:server    # Start backend only');
  
  log(colors.yellow, '\n🌐 Access URLs (after starting):');
  log(colors.cyan, '  Frontend:   http://localhost:8080');
  log(colors.cyan, '  Backend:    http://localhost:9000/api');
  log(colors.cyan, '  Health:     http://localhost:9000/api/health');
  
  log(colors.yellow, '\n🔑 Demo Login Accounts:');
  log(colors.cyan, '  Admin:      admin@nomedia.ma     / admin123');
  log(colors.cyan, '  Manager:    mohammed@nomedia.ma  / mohammed123');
  log(colors.cyan, '  Manager:    zineb@nomedia.ma     / zineb123');
  log(colors.cyan, '  User:       karim@nomedia.ma     / karim123');
  
  log(colors.yellow, '\n🐳 Optional PostgreSQL Testing:');
  log(colors.cyan, '  docker-compose up -d postgres    # Start PostgreSQL');
  log(colors.cyan, '  export DATABASE_TYPE=postgresql  # Switch to PostgreSQL');
  log(colors.cyan, '  npm run dev                       # Start with PostgreSQL');
  
  log(colors.yellow, '\n📚 Documentation:');
  log(colors.cyan, '  LOCAL_DEVELOPMENT_GUIDE.md       # Complete setup guide');
  log(colors.cyan, '  POSTGRESQL_TESTING_GUIDE.md      # PostgreSQL testing');
  log(colors.cyan, '  HOSTINGER_DEPLOYMENT_GUIDE.md    # Production deployment');
  
  log(colors.bold + colors.blue, '\n🎯 Next Step: Run "npm run dev" to start development!');
}

async function main() {
  log(colors.bold + colors.blue, '🏠 Nomedia Production - Local Development Setup');
  log(colors.blue, '🛠️ Setting up your local development environment...\n');

  // Check prerequisites
  const prereqsPassed = await checkPrerequisites();
  if (!prereqsPassed) {
    log(colors.red, '\n❌ Prerequisites check failed. Please fix the issues above.');
    process.exit(1);
  }

  // Install dependencies
  const installSuccess = await installDependencies();
  if (!installSuccess) {
    log(colors.red, '\n❌ Dependency installation failed.');
    process.exit(1);
  }

  // Check database setup
  await checkDatabaseSetup();

  // Create environment file
  await createEnvFile();

  // Test setup
  await testSetup();

  // Show startup instructions
  showStartupInstructions();
}

// Run the setup
main().catch(error => {
  log(colors.red, '💥 Setup failed:', error.message);
  process.exit(1);
});
