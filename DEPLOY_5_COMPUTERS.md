# 🖥️ NOMEDIA PRODUCTION - 5 COMPUTERS DEPLOYMENT
## Guide Complet pour Installation Multi-Postes

---

## 📋 **APERÇU DU SYSTÈME**

**Architecture:** 1 Serveur + 4 Clients partageant la même base de données

```
┌─────────────────┐    ┌─────────────────┐
│   ORDINATEUR 1  │    │   ORDINATEUR 2  │
│   (Client)      │    │   (Client)      │
│   Port: 3000    │    │   Port: 3000    │
└─────────┬───────┘    └─────────┬───────┘
          │                      │
          │      ┌─────────────────────┐
          └──────┤   ORDINATEUR 3      │
                 │   (SERVEUR)         │
          ┏━━━━━━┤   + nomedia.db      │
          ┃      │   Port: 8000        │
          ┃      └─────────────────────┘
          ┃              │
┌─────────┻───────┐    ┌─────────┴───────┐
│   ORDINATEUR 4  │    │   ORDINATEUR 5  │
│   (Client)      │    │   (Client)      │
│   Port: 3000    │    │   Port: 3000    │
└─────────────────┘    └─────────────────┘
```

---

## 🎯 **PLAN D'ADRESSAGE IP**

```
Ordinateur 1 (Client):    192.168.1.101
Ordinateur 2 (Client):    192.168.1.102  
Ordinateur 3 (Serveur):   192.168.1.100
Ordinateur 4 (Client):    192.168.1.104
Ordinateur 5 (Client):    192.168.1.105

Accès: http://192.168.1.100:8000
```

---

## 💻 **PRÉREQUIS SYSTÈME**

### **Tous les Ordinateurs**
- **OS:** Windows 10/11, macOS, ou Ubuntu 18.04+
- **RAM:** 4GB minimum (8GB recommandé)
- **Stockage:** 2GB libre
- **Réseau:** Connexion LAN/WiFi stable

### **Ordinateur Serveur (Ordinateur 3)**
- **RAM:** 8GB minimum (16GB recommandé)
- **CPU:** 4 cores
- **Stockage:** 10GB libre (pour base + backups)

---

## 📥 **FICHIERS À TÉLÉCHARGER**

### **Package Complet**
Téléchargez depuis GitHub: `https://github.com/STALPHA2708/Nomedia`

```
📁 Package de déploiement:
├── 📄 nomedia-production/ (code source complet)
├── 📄 nomedia.db (base de données avec vos données)
├── 📄 install-server.sh (script serveur)
├── 📄 install-client.sh (script client)
└── 📄 network-config.txt (configuration réseau)
```

---

## 🔧 **INSTALLATION SERVEUR (ORDINATEUR 3)**

### **Étape 1: Préparation**
```bash
# Installer Node.js 18+
# Windows: Télécharger depuis nodejs.org
# Linux/Mac:
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### **Étape 2: Installation Application**
```bash
# Cloner le projet
git clone https://github.com/STALPHA2708/Nomedia.git
cd Nomedia

# Installer les dépendances
npm install

# Copier la base de données
# (Télécharger nomedia.db depuis l'installation actuelle)
```

### **Étape 3: Configuration Serveur**
Créer `.env.production`:
```env
# Configuration serveur
PORT=8000
HOST=0.0.0.0
NODE_ENV=production

# Base de données
DB_PATH=./nomedia.db

# Sécurité
JWT_SECRET=votre-secret-securise-changez-moi

# Réseau
FRONTEND_URL=http://192.168.1.100:8000
CORS_ORIGIN=http://192.168.1.*
```

### **Étape 4: Construction et Démarrage**
```bash
# Construire l'application
npm run build

# Démarrer le serveur (mode production)
npm run start:prod

# OU avec PM2 pour garder en fonctionnement
npm install -g pm2
pm2 start "npm run start:prod" --name nomedia-server
pm2 startup
pm2 save
```

### **Étape 5: Test Serveur**
```bash
# Vérifier que le serveur fonctionne
curl http://localhost:8000/api/health

# Doit retourner: {"status": "ok"}
```

---

## 💻 **INSTALLATION CLIENTS (ORDINATEURS 1,2,4,5)**

### **Méthode A: Application Web (Recommandée)**

#### **Installation Simple**
```bash
# Cloner seulement les fichiers nécessaires
git clone https://github.com/STALPHA2708/Nomedia.git
cd Nomedia

# Installer les dépendances
npm install --production
```

#### **Configuration Client**
Créer `.env.local`:
```env
# Pointer vers le serveur
VITE_API_URL=http://192.168.1.100:8000/api
VITE_APP_NAME=Nomedia Production
```

#### **Construction et Démarrage**
```bash
# Construire l'interface
npm run build

# Servir les fichiers (différents ports par client)
npx serve dist -p 3000   # Ordinateur 1
npx serve dist -p 3001   # Ordinateur 2  
npx serve dist -p 3002   # Ordinateur 4
npx serve dist -p 3003   # Ordinateur 5
```

### **Méthode B: Navigation Directe**

**Plus simple:** Les clients accèdent directement à:
```
http://192.168.1.100:8000
```

**Avantages:**
- ✅ Pas d'installation sur les clients
- ✅ Mises à jour centralisées
- ✅ Configuration simple

---

## 🌐 **CONFIGURATION RÉSEAU**

### **Pare-feu (Ordinateur Serveur)**

#### **Windows**
```cmd
# Ouvrir le port 8000
netsh advfirewall firewall add rule name="Nomedia Server" dir=in action=allow protocol=TCP localport=8000
```

#### **Linux/Mac**
```bash
# Ubuntu/Debian
sudo ufw allow 8000

# macOS
# Aller dans Préférences Système > Sécurité > Pare-feu
```

### **Test de Connectivité**
Depuis chaque client:
```bash
# Tester la connexion au serveur
ping 192.168.1.100
telnet 192.168.1.100 8000

# Tester l'API
curl http://192.168.1.100:8000/api/health
```

---

## 👥 **COMPTES UTILISATEURS**

### **Répartition par Ordinateur**
```
Ordinateur 1: zineb@nomedia.ma (Manager)
Ordinateur 2: karim@nomedia.ma (User)
Ordinateur 3: mohammed@nomedia.ma (Admin) 
Ordinateur 4: alice.martin@nomedia.ma (User)
Ordinateur 5: david.chen@nomedia.ma (Manager)
```

### **Mots de passe**
```
mohammed@nomedia.ma : mohammed123 (Admin)
zineb@nomedia.ma    : zineb123 (Manager)
karim@nomedia.ma    : karim123 (User)
invite@nomedia.ma   : invite123 (Guest)
```

---

## 🔄 **SCRIPTS D'INSTALLATION AUTOMATIQUE**

### **Script Serveur (install-server.sh)**
```bash
#!/bin/bash
echo "🚀 Installation Serveur Nomedia..."

# Installer Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Cloner l'application
git clone https://github.com/STALPHA2708/Nomedia.git
cd Nomedia

# Configuration
cat > .env.production << EOF
PORT=8000
HOST=0.0.0.0
NODE_ENV=production
DB_PATH=./nomedia.db
JWT_SECRET=nomedia-production-secret-2024
FRONTEND_URL=http://192.168.1.100:8000
EOF

# Installation et construction
npm install
npm run build

# Démarrage avec PM2
npm install -g pm2
pm2 start "npm run start:prod" --name nomedia-server
pm2 startup
pm2 save

echo "✅ Serveur installé!"
echo "🌐 Accès: http://192.168.1.100:8000"
```

### **Script Client (install-client.sh)**
```bash
#!/bin/bash
echo "💻 Installation Client Nomedia..."

# Installer Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Cloner l'application
git clone https://github.com/STALPHA2708/Nomedia.git
cd Nomedia

# Configuration client
cat > .env.local << EOF
VITE_API_URL=http://192.168.1.100:8000/api
VITE_APP_NAME=Nomedia Production
EOF

# Installation et construction
npm install
npm run build

# Démarrage
npm install -g serve
serve dist -p 3000

echo "✅ Client installé!"
echo "🌐 Accès: http://localhost:3000"
```

---

## 🚀 **DÉMARRAGE RAPIDE**

### **Option Simple (Recommandée)**

#### **1. Serveur (Ordinateur 3)**
```bash
# Télécharger et exécuter
wget https://github.com/STALPHA2708/Nomedia/raw/main/install-server.sh
chmod +x install-server.sh
./install-server.sh
```

#### **2. Clients (Ordinateurs 1,2,4,5)**
**Accéder directement à:**
```
http://192.168.1.100:8000
```

**Créer un raccourci sur le bureau avec cette URL**

---

## 💾 **GESTION DE LA BASE DE DONNÉES**

### **Base Centralisée**
- **Emplacement:** Ordinateur 3 (`./nomedia.db`)
- **Sauvegarde:** Automatique toutes les heures
- **Accès:** Tous les clients via API

### **Backup Automatique**
```bash
# Script de sauvegarde (sur serveur)
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
cp nomedia.db "backups/nomedia_$DATE.db"

# Garder seulement 30 backups
find backups/ -name "nomedia_*.db" -mtime +30 -delete
```

### **Planification (Crontab)**
```bash
# Backup toutes les heures
0 * * * * /path/to/backup-script.sh
```

---

## 🔍 **VÉRIFICATION ET TESTS**

### **Test Complet du Système**
```bash
# 1. Serveur fonctionne
curl http://192.168.1.100:8000/api/health

# 2. Base de données accessible
curl http://192.168.1.100:8000/api/users

# 3. Interface web
curl http://192.168.1.100:8000

# 4. Depuis chaque client
ping 192.168.1.100
```

### **Accès Final**
```
🌐 URL pour tous: http://192.168.1.100:8000
🔐 Comptes: Voir section "Comptes Utilisateurs"
✅ Même données visibles partout
```

---

## 🆘 **DÉPANNAGE**

### **Problèmes Courants**

#### **Serveur ne démarre pas**
```bash
# Vérifier les logs
pm2 logs nomedia-server

# Redémarrer
pm2 restart nomedia-server
```

#### **Clients ne peuvent pas se connecter**
```bash
# Vérifier pare-feu serveur
sudo ufw status

# Tester connectivité
ping 192.168.1.100
telnet 192.168.1.100 8000
```

#### **Base de données verrouillée**
```bash
# Arrêter le serveur
pm2 stop nomedia-server

# Vérifier processus utilisant la DB
lsof nomedia.db

# Redémarrer
pm2 start nomedia-server
```

---

## 📞 **SUPPORT**

### **Contacts**
- **Admin Système:** mohammed@nomedia.ma
- **Support Technique:** admin@nomedia.ma

### **Maintenance**
- **Backup quotidien:** 02h00
- **Redémarrage hebdomadaire:** Dimanche 01h00
- **Mise à jour:** Premier vendredi du mois

---

*Guide de déploiement 5 ordinateurs - Version 1.0*  
*© Nomedia Production - Tous droits réservés*
