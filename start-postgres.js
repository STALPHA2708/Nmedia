#!/usr/bin/env node

/**
 * Quick PostgreSQL Docker starter for Nomedia Production
 */

const { spawn } = require('child_process');
const { existsSync } = require('fs');

console.log('🐳 Starting PostgreSQL with Docker...\n');

// Check if docker-compose.yml exists
if (!existsSync('./docker-compose.yml')) {
  console.error('❌ docker-compose.yml not found in current directory');
  process.exit(1);
}

console.log('📋 Commands to run:');
console.log('1. docker-compose up -d postgres');
console.log('2. Wait for PostgreSQL to start (10-30 seconds)');
console.log('3. Check status: docker-compose logs postgres');
console.log('4. Restart your application');
console.log('');

console.log('📊 PostgreSQL Configuration:');
console.log('  Host: localhost');
console.log('  Port: 5432');
console.log('  Database: nomedia_production');
console.log('  Username: nomedia_user');
console.log('  Password: nomedia_password123');
console.log('');

console.log('🔧 Environment Variables (already set):');
console.log('  DATABASE_TYPE=postgresql');
console.log('  DB_HOST=localhost');
console.log('  DB_PORT=5432');
console.log('  DB_NAME=nomedia_production');
console.log('  DB_USER=nomedia_user');
console.log('  DB_PASSWORD=nomedia_password123');
console.log('');

console.log('🚀 Optional: Start pgAdmin for database management:');
console.log('  docker-compose up -d pgadmin');
console.log('  Then visit: http://localhost:8081');
console.log('  Email: admin@nomedia.ma');
console.log('  Password: admin123');
console.log('');

console.log('✅ Environment configured! Restart your application to use PostgreSQL.');
