const { query } = require('./server/config/sqlite-database');

async function extractUsers() {
  try {
    console.log('📋 EXTRACTION DES UTILISATEURS - NOMEDIA PRODUCTION');
    console.log('=====================================================');
    
    const users = await query(`
      SELECT 
        id,
        name, 
        email, 
        role, 
        status,
        phone,
        permissions,
        created_at,
        last_login
      FROM users 
      ORDER BY 
        CASE role
          WHEN 'admin' THEN 1
          WHEN 'manager' THEN 2  
          WHEN 'user' THEN 3
          WHEN 'guest' THEN 4
          ELSE 5
        END,
        name
    `);
    
    if (users.length === 0) {
      console.log('❌ Aucun utilisateur trouvé dans la base de données');
      return;
    }

    console.log(`\n✅ ${users.length} utilisateur(s) trouvé(s):\n`);

    // Grouper par rôle
    const usersByRole = {
      admin: [],
      manager: [],
      user: [],
      guest: []
    };

    users.forEach(user => {
      const permissions = user.permissions ? JSON.parse(user.permissions) : [];
      usersByRole[user.role] = usersByRole[user.role] || [];
      usersByRole[user.role].push({
        ...user,
        permissions
      });
    });

    // Afficher par rôle
    const roleEmojis = {
      admin: '👑',
      manager: '🏢', 
      user: '👤',
      guest: '🎫'
    };

    const roleNames = {
      admin: 'ADMINISTRATEURS',
      manager: 'MANAGERS', 
      user: 'UTILISATEURS',
      guest: 'INVITÉS'
    };

    for (const [role, roleUsers] of Object.entries(usersByRole)) {
      if (roleUsers.length > 0) {
        console.log(`${roleEmojis[role]} ${roleNames[role]} (${roleUsers.length}):`);
        console.log('─'.repeat(50));
        
        roleUsers.forEach((user, index) => {
          const lastLogin = user.last_login 
            ? new Date(user.last_login).toLocaleDateString('fr-FR')
            : 'Jamais connecté';
            
          console.log(`${index + 1}. ${user.name}`);
          console.log(`   📧 Email: ${user.email}`);
          console.log(`   📞 Téléphone: ${user.phone || 'Non renseigné'}`);
          console.log(`   🔐 Statut: ${user.status}`);
          console.log(`   📅 Dernière connexion: ${lastLogin}`);
          console.log(`   🎯 Permissions: ${user.permissions.join(', ')}`);
          console.log(`   🆔 ID: ${user.id}`);
          console.log('');
        });
      }
    }

    // Statistiques
    console.log('📊 STATISTIQUES:');
    console.log('═'.repeat(30));
    console.log(`👑 Administrateurs: ${usersByRole.admin.length}`);
    console.log(`🏢 Managers: ${usersByRole.manager.length}`);
    console.log(`👤 Utilisateurs: ${usersByRole.user.length}`);
    console.log(`🎫 Invités: ${usersByRole.guest.length}`);
    console.log(`📱 Total: ${users.length} utilisateurs`);
    
    const activeUsers = users.filter(u => u.status === 'active').length;
    console.log(`✅ Actifs: ${activeUsers}/${users.length}`);

    // Générer un CSV
    console.log('\n📄 EXPORT CSV:');
    console.log('═'.repeat(30));
    console.log('Role,Name,Email,Phone,Status,Permissions');
    users.forEach(user => {
      const permissions = user.permissions ? JSON.parse(user.permissions).join(';') : '';
      console.log(`${user.role},${user.name},${user.email},${user.phone || ''},${user.status},"${permissions}"`);
    });

  } catch (error) {
    console.error('❌ Erreur lors de l\'extraction:', error);
  }
  
  process.exit(0);
}

extractUsers();
