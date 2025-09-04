#!/usr/bin/env node

/**
 * Hostinger Deployment Helper Script
 * Prepares and validates the application for Hostinger deployment
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
  log(colors.bold + colors.cyan, '\n' + '='.repeat(50));
  log(colors.bold + colors.cyan, text);
  log(colors.bold + colors.cyan, '='.repeat(50));
}

async function deploymentCheck() {
  header('🚀 HOSTINGER DEPLOYMENT PREPARATION');

  log(colors.blue, '\n📋 Checking deployment readiness...\n');

  const checks = [
    {
      name: 'Node.js Dependencies',
      check: () => fs.existsSync('./package.json'),
      fix: 'Run: npm install'
    },
    {
      name: 'Production Build',
      check: () => fs.existsSync('./dist'),
      fix: 'Run: npm run build'
    },
    {
      name: 'Database Configuration',
      check: () => fs.existsSync('./server/config/unified-database.ts'),
      fix: 'Database abstraction layer missing'
    },
    {
      name: 'Environment Template',
      check: () => fs.existsSync('./.env.production.template'),
      fix: 'Environment template created'
    },
    {
      name: 'Server Configuration',
      check: () => fs.existsSync('./server/index.ts'),
      fix: 'Server files missing'
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

  if (!allPassed) {
    log(colors.red, '\n❌ Some checks failed. Please fix the issues above.');
    return false;
  }

  log(colors.green, '\n✅ All deployment checks passed!');
  return true;
}

async function buildForProduction() {
  header('🔨 BUILDING FOR PRODUCTION');

  try {
    log(colors.blue, '📦 Installing dependencies...');
    execSync('npm install', { stdio: 'inherit' });

    log(colors.blue, '🔨 Building application...');
    execSync('npm run build', { stdio: 'inherit' });

    log(colors.green, '✅ Build completed successfully!');
    return true;
  } catch (error) {
    log(colors.red, '❌ Build failed:', error.message);
    return false;
  }
}

function generateDeploymentInstructions() {
  header('📋 HOSTINGER DEPLOYMENT INSTRUCTIONS');

  const instructions = `
${colors.yellow}STEP 1: Set Up PostgreSQL Database${colors.reset}
1. Login to Hostinger Control Panel
2. Go to Databases → PostgreSQL
3. Create a new database
4. Note down the connection details

${colors.yellow}STEP 2: Configure Environment Variables${colors.reset}
Set these in Hostinger Environment Variables:
${colors.cyan}
NODE_ENV=production
DATABASE_TYPE=postgresql
DB_HOST=[your-hostinger-host]
DB_NAME=[your-database-name]
DB_USER=[your-username]
DB_PASSWORD=[your-password]
DB_PORT=5432
JWT_SECRET=[generate-strong-secret]
${colors.reset}

${colors.yellow}STEP 3: Upload Files${colors.reset}
Upload these directories to Hostinger:
${colors.cyan}
├── package.json
├��─ dist/ (frontend build)
├── server/ (backend code)
├── netlify.toml
└── node_modules/ (or run npm install on server)
${colors.reset}

${colors.yellow}STEP 4: Install & Start on Hostinger${colors.reset}
${colors.cyan}
npm install
npm start
${colors.reset}

${colors.yellow}STEP 5: Test Deployment${colors.reset}
${colors.cyan}
curl https://yourdomain.com/api/health
curl https://yourdomain.com/api/demo-status
${colors.reset}

${colors.green}🎉 Demo Accounts:${colors.reset}
${colors.cyan}
Admin: admin@nomedia.ma / admin123
Manager: mohammed@nomedia.ma / mohammed123
Manager: zineb@nomedia.ma / zineb123
User: karim@nomedia.ma / karim123
${colors.reset}
`;

  console.log(instructions);
}

function generateFilesChecklist() {
  header('📁 FILES TO UPLOAD TO HOSTINGER');

  const requiredFiles = [
    '📦 package.json - Dependencies configuration',
    '🏗️ dist/ - Built frontend application',
    '⚙️ server/ - Backend server code',
    '🔧 netlify.toml - Routing configuration',
    '🗄️ server/config/ - Database configuration',
    '🛠️ server/routes/ - API endpoints',
    '📋 HOSTINGER_DEPLOYMENT_GUIDE.md - Deployment guide'
  ];

  const optionalFiles = [
    '🐳 docker-compose.yml - Local PostgreSQL testing',
    '📝 .env.production.template - Environment template',
    '🚀 deploy-hostinger.js - This deployment helper'
  ];

  log(colors.green, '\n✅ Required Files:');
  requiredFiles.forEach(file => log(colors.blue, `  ${file}`));

  log(colors.yellow, '\n📋 Optional Files (for reference):');
  optionalFiles.forEach(file => log(colors.cyan, `  ${file}`));
}

function showDatabaseInfo() {
  header('🗄️ DATABASE CONFIGURATION');

  log(colors.blue, 'Your application supports both SQLite and PostgreSQL:');
  log(colors.green, '\n✅ Development (SQLite):');
  log(colors.cyan, '  - Automatic local database');
  log(colors.cyan, '  - No configuration needed');
  log(colors.cyan, '  - Perfect for testing');

  log(colors.green, '\n✅ Production (PostgreSQL):');
  log(colors.cyan, '  - Hostinger PostgreSQL database');
  log(colors.cyan, '  - Automatic detection via environment variables');
  log(colors.cyan, '  - Auto-creates tables and demo data');
  log(colors.cyan, '  - Production-ready with connection pooling');

  log(colors.blue, '\n🔄 The application automatically switches based on environment!');
}

async function main() {
  log(colors.bold + colors.blue, '🚀 Nomedia Production - Hostinger Deployment Helper');
  log(colors.blue, '📱 Preparing your application for production hosting...\n');

  // Run deployment checks
  const checksPass = await deploymentCheck();
  if (!checksPass) {
    process.exit(1);
  }

  // Build for production
  const buildSuccess = await buildForProduction();
  if (!buildSuccess) {
    process.exit(1);
  }

  // Show deployment information
  generateDeploymentInstructions();
  generateFilesChecklist();
  showDatabaseInfo();

  log(colors.bold + colors.green, '\n🎉 READY FOR HOSTINGER DEPLOYMENT!');
  log(colors.green, '\n📚 For detailed instructions, see: HOSTINGER_DEPLOYMENT_GUIDE.md');
  log(colors.blue, '🔧 For environment setup, see: .env.production.template');
  log(colors.yellow, '⚠️  Remember to configure PostgreSQL database on Hostinger first!');
}

// Run the deployment helper
main().catch(error => {
  log(colors.red, '💥 Deployment preparation failed:', error.message);
  process.exit(1);
});
