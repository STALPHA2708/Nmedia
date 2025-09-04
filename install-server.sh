#!/bin/bash

echo "🚀 NOMEDIA PRODUCTION - Installation Serveur"
echo "============================================="

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages colorés
info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

# Vérifier si nous sommes sur Linux
if [[ "$OSTYPE" != "linux-gnu"* ]]; then
    warning "Ce script est conçu pour Linux. Pour Windows/Mac, suivez les instructions manuelles."
    exit 1
fi

info "Vérification des prérequis..."

# Vérifier si Node.js est installé
if ! command -v node &> /dev/null; then
    info "Installation de Node.js 18..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    success "Node.js installé"
else
    success "Node.js déjà installé: $(node --version)"
fi

# Vérifier si npm est installé
if ! command -v npm &> /dev/null; then
    error "npm n'est pas installé. Veuillez l'installer manuellement."
    exit 1
else
    success "npm disponible: $(npm --version)"
fi

# Vérifier si git est installé
if ! command -v git &> /dev/null; then
    info "Installation de Git..."
    sudo apt-get update
    sudo apt-get install -y git
    success "Git installé"
else
    success "Git déjà installé"
fi

# Créer le répertoire de l'application
info "Création du répertoire d'application..."
cd /opt || exit 1
sudo mkdir -p nomedia-production
sudo chown $USER:$USER nomedia-production
cd nomedia-production

# Cloner l'application
info "Téléchargement de l'application..."
if [ -d "Nomedia" ]; then
    warning "Le répertoire Nomedia existe déjà. Mise à jour..."
    cd Nomedia
    git pull
else
    git clone https://github.com/STALPHA2708/Nomedia.git
    cd Nomedia
fi

success "Application téléchargée"

# Configuration du serveur
info "Configuration du serveur..."
cat > .env.production << EOF
# Configuration Serveur Nomedia Production
PORT=8000
HOST=0.0.0.0
NODE_ENV=production

# Base de données
DB_PATH=./nomedia.db

# Sécurité
JWT_SECRET=nomedia-production-secret-$(date +%s)

# URLs et CORS
FRONTEND_URL=http://192.168.1.100:8000
CORS_ORIGIN=*

# Logs
LOG_LEVEL=info
EOF

success "Configuration créée"

# Installation des dépendances
info "Installation des dépendances..."
npm install

if [ $? -ne 0 ]; then
    error "Erreur lors de l'installation des dépendances"
    exit 1
fi

success "Dépendances installées"

# Construction de l'application
info "Construction de l'application..."
npm run build

if [ $? -ne 0 ]; then
    error "Erreur lors de la construction"
    exit 1
fi

success "Application construite"

# Installation de PM2 pour la gestion des processus
info "Installation de PM2..."
sudo npm install -g pm2

# Configuration PM2
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'nomedia-server',
    script: 'npm',
    args: 'run start:prod',
    cwd: '/opt/nomedia-production/Nomedia',
    env: {
      NODE_ENV: 'production',
      PORT: 8000
    },
    restart_delay: 1000,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
EOF

# Démarrage de l'application
info "Démarrage de l'application..."
pm2 start ecosystem.config.js
pm2 save

# Configuration du démarrage automatique
pm2 startup | tail -n 1 | bash

success "Application démarrée avec PM2"

# Configuration du pare-feu (Ubuntu/Debian)
info "Configuration du pare-feu..."
if command -v ufw &> /dev/null; then
    sudo ufw allow 8000/tcp
    success "Port 8000 ouvert dans le pare-feu"
else
    warning "UFW non installé. Ouvrez manuellement le port 8000"
fi

# Création du script de sauvegarde
info "Création du script de sauvegarde..."
sudo mkdir -p /opt/nomedia-production/backups

cat > backup-nomedia.sh << EOF
#!/bin/bash
# Script de sauvegarde automatique
DATE=\$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/nomedia-production/backups"
DB_FILE="/opt/nomedia-production/Nomedia/nomedia.db"

# Créer la sauvegarde
cp "\$DB_FILE" "\$BACKUP_DIR/nomedia_\$DATE.db"

# Garder seulement les 30 dernières sauvegardes
find "\$BACKUP_DIR" -name "nomedia_*.db" -type f -mtime +30 -delete

echo "Sauvegarde créée: nomedia_\$DATE.db"
EOF

chmod +x backup-nomedia.sh

# Planification des sauvegardes (toutes les 4 heures)
(crontab -l 2>/dev/null; echo "0 */4 * * * /opt/nomedia-production/Nomedia/backup-nomedia.sh") | crontab -

success "Script de sauvegarde configuré"

# Test de l'installation
info "Test de l'installation..."
sleep 5

# Obtenir l'adresse IP locale
LOCAL_IP=$(hostname -I | awk '{print $1}')

# Test de l'API
if curl -s http://localhost:8000/api/health > /dev/null; then
    success "Serveur API fonctionnel"
else
    error "Le serveur API ne répond pas"
fi

# Affichage des informations finales
echo ""
echo "🎉 INSTALLATION TERMINÉE AVEC SUCCÈS!"
echo "====================================="
echo ""
echo -e "${GREEN}📊 Informations du serveur:${NC}"
echo "  • URL locale: http://localhost:8000"
echo "  • URL réseau: http://$LOCAL_IP:8000"
echo "  • Port: 8000"
echo "  • Base de données: nomedia.db"
echo ""
echo -e "${BLUE}🔧 Commandes utiles:${NC}"
echo "  • Statut: pm2 status"
echo "  • Logs: pm2 logs nomedia-server"
echo "  • Redémarrer: pm2 restart nomedia-server"
echo "  • Arrêter: pm2 stop nomedia-server"
echo ""
echo -e "${YELLOW}👥 Comptes de connexion:${NC}"
echo "  • Admin: mohammed@nomedia.ma / mohammed123"
echo "  • Manager: zineb@nomedia.ma / zineb123"
echo "  • User: karim@nomedia.ma / karim123"
echo "  • Guest: invite@nomedia.ma / invite123"
echo ""
echo -e "${GREEN}📱 Accès pour les clients:${NC}"
echo "  • URL à partager: http://$LOCAL_IP:8000"
echo "  • Configurez cette IP sur les autres ordinateurs"
echo ""
echo -e "${BLUE}📁 Répertoires importants:${NC}"
echo "  • Application: /opt/nomedia-production/Nomedia"
echo "  • Sauvegardes: /opt/nomedia-production/backups"
echo "  • Configuration: /opt/nomedia-production/Nomedia/.env.production"
echo ""
warning "N'oubliez pas de configurer l'IP statique: 192.168.1.100"
warning "Partagez l'URL http://$LOCAL_IP:8000 avec vos 4 autres ordinateurs"

# Afficher les prochaines étapes
echo ""
echo -e "${BLUE}🚀 Prochaines étapes:${NC}"
echo "1. Configurez une IP statique (192.168.1.100 recommandée)"
echo "2. Testez l'accès depuis un autre ordinateur"
echo "3. Partagez l'URL avec votre équipe"
echo "4. Importez votre base de données existante si nécessaire"
echo ""
echo "Installation terminée! 🎉"
