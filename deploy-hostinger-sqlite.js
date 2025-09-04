#!/usr/bin/env node

/**
 * Hostinger SQLite Deployment Preparation Script
 * Prepares the application for deployment to Hostinger with SQLite
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync, copyFileSync, writeFileSync } from 'fs';
import { join } from 'path';

console.log('🏠 Preparing Nomedia for Hostinger SQLite Deployment...\n');

// Create deployment directory
const deployDir = 'deploy-hostinger';
if (!existsSync(deployDir)) {
  mkdirSync(deployDir, { recursive: true });
}

console.log('1️⃣ Creating production environment file...');
const prodEnv = `# Database Configuration - SQLite Production
DATABASE_TYPE=sqlite
SQLITE_PATH=./nomedia.db

# Application Configuration
NODE_ENV=production
PORT=8000
FRONTEND_PORT=8080

# JWT Configuration (CHANGE THESE IN PRODUCTION!)
JWT_SECRET=${generateRandomString(64)}
JWT_EXPIRES_IN=7d

# API Configuration (UPDATE WITH YOUR DOMAIN)
API_BASE_URL=https://yourdomain.com/api
FRONTEND_URL=https://yourdomain.com

# Security Configuration
BCRYPT_ROUNDS=12
SESSION_SECRET=${generateRandomString(32)}

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_DIR=uploads

# Development Configuration
DEBUG=false
LOG_LEVEL=info
`;

writeFileSync(join(deployDir, '.env.production'), prodEnv);
console.log('✅ Created .env.production');

console.log('\n2️⃣ Building client application...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Client build completed');
} catch (error) {
  console.error('❌ Client build failed:', error.message);
  process.exit(1);
}

console.log('\n3️⃣ Building server application...');
try {
  execSync('npm run build:server', { stdio: 'inherit' });
  console.log('✅ Server build completed');
} catch (error) {
  console.error('❌ Server build failed:', error.message);
  process.exit(1);
}

console.log('\n4️⃣ Copying files to deployment directory...');

// Copy essential files
const filesToCopy = [
  'package.json',
  'nomedia.db',
  'dist/server.js'
];

const dirsToCopy = [
  'dist-client'
];

filesToCopy.forEach(file => {
  if (existsSync(file)) {
    copyFileSync(file, join(deployDir, file.split('/').pop()));
    console.log(`   ✅ Copied ${file}`);
  } else {
    console.log(`   ⚠️ ${file} not found, skipping`);
  }
});

// Copy dist-client directory recursively
try {
  execSync(`cp -r dist-client ${deployDir}/`, { stdio: 'pipe' });
  console.log('   ✅ Copied dist-client/');
} catch (error) {
  console.log('   ⚠️ dist-client not found, skipping');
}

console.log('\n5️⃣ Creating PM2 ecosystem file...');
const pm2Config = `module.exports = {
  apps: [{
    name: 'nomedia-production',
    script: 'server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 8000,
      DATABASE_TYPE: 'sqlite',
      SQLITE_PATH: './nomedia.db'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
`;

writeFileSync(join(deployDir, 'ecosystem.config.js'), pm2Config);
console.log('✅ Created PM2 ecosystem configuration');

console.log('\n6️⃣ Creating deployment scripts...');

// Create start script
const startScript = `#!/bin/bash
echo "🚀 Starting Nomedia Production with SQLite..."

# Create logs directory
mkdir -p logs

# Install dependencies (if needed)
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm install --production
fi

# Start with PM2
if command -v pm2 &> /dev/null; then
  echo "🔄 Starting with PM2..."
  pm2 start ecosystem.config.js
  pm2 save
else
  echo "🔄 Starting with Node.js..."
  NODE_ENV=production node server.js
fi
`;

writeFileSync(join(deployDir, 'start.sh'), startScript);
execSync(`chmod +x ${join(deployDir, 'start.sh')}`);

// Create backup script
const backupScript = `#!/bin/bash
echo "💾 Creating SQLite database backup..."

# Create backup directory
mkdir -p backups

# Create backup with timestamp
DATE=$(date +%Y%m%d_%H%M%S)
cp nomedia.db "backups/nomedia_backup_$DATE.db"

echo "✅ Backup created: backups/nomedia_backup_$DATE.db"

# Keep only last 10 backups
ls -t backups/nomedia_backup_*.db | tail -n +11 | xargs rm -f 2>/dev/null || true

echo "🧹 Old backups cleaned up"
`;

writeFileSync(join(deployDir, 'backup.sh'), backupScript);
execSync(`chmod +x ${join(deployDir, 'backup.sh')}`);

console.log('✅ Created start.sh and backup.sh scripts');

console.log('\n7️⃣ Creating upload instructions...');
const uploadInstructions = `# 📁 Hostinger Upload Instructions

## Files to Upload:
Upload the entire '${deployDir}' folder contents to your Hostinger web directory.

## Required Files:
- server.js              (Main application)
- dist-client/           (Frontend files)
- nomedia.db            (SQLite database)
- package.json          (Dependencies)
- .env.production       (Environment config)
- ecosystem.config.js   (PM2 config)
- start.sh              (Startup script)
- backup.sh             (Backup script)

## Upload Steps:
1. Compress the ${deployDir} folder: zip -r nomedia-deploy.zip ${deployDir}/
2. Upload to Hostinger via File Manager or FTP
3. Extract in your web directory
4. Run: chmod +x start.sh backup.sh
5. Execute: ./start.sh

## Important:
- Update .env.production with your actual domain
- Ensure Node.js 18+ is enabled in Hostinger
- Set correct file permissions for nomedia.db
- Configure reverse proxy if needed

## Domain Configuration:
Update API_BASE_URL and FRONTEND_URL in .env.production:
- API_BASE_URL=https://yourdomain.com/api
- FRONTEND_URL=https://yourdomain.com
`;

writeFileSync(join(deployDir, 'UPLOAD_INSTRUCTIONS.md'), uploadInstructions);

console.log('\n🎉 Deployment preparation completed!\n');
console.log('📁 Deployment files created in:', deployDir);
console.log('📖 Read UPLOAD_INSTRUCTIONS.md for next steps');
console.log('\n⚠️  IMPORTANT:');
console.log('   1. Update .env.production with your actual domain');
console.log('   2. Change JWT_SECRET and SESSION_SECRET for security');
console.log('   3. Test database permissions on Hostinger');
console.log('\n🚀 Ready for Hostinger deployment!');

function generateRandomString(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
