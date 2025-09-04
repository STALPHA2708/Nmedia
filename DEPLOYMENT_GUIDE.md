# 🚀 GUIDE DE DÉPLOIEMENT - NOMEDIA PRODUCTION
## Configuration Multi-Postes (5 Ordinateurs)

---

## 📋 **APERÇU DU SYSTÈME**

**Nomedia Production** est une application de gestion complète utilisant:
- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express
- **Base de données**: SQLite
- **Architecture**: Client-Serveur

---

## 🖥️ **ARCHITECTURE RECOMMANDÉE POUR 5 POSTES**

### **Option A: Serveur Central + 4 Clients** (Recommandée)
```
┌─────────────────┐    ┌─────────────────┐
│   POSTE 1       │    │   POSTE 2       │
│   (Client)      │    │   (Client)      │
│                 │    │                 │
└─────────┬───────┘    └─────────┬───────┘
          │                      │
          │      ┌─────────────────┐
          └──────┤   POSTE 3       │
                 │   (SERVEUR)     │
          ┏━━━━━━┤   + Base SQLite │
          ┃      └─────────────────┘
          ┃              │
┌─────────┻───────┐    ┌─────────┴───────┐
│   POSTE 4       │    │   POSTE 5       │
│   (Client)      │    │   (Client)      │
│                 │    │                 │
└─────────────────┘    └─────────────────┘
```

---

## 💻 **PRÉREQUIS SYSTÈME**

### **Tous les Postes**
- **OS**: Windows 10/11, macOS 10.15+, ou Ubuntu 18.04+
- **RAM**: Minimum 4GB (8GB recommandé)
- **Stockage**: 2GB libre
- **Réseau**: Connexion LAN stable

### **Poste Serveur (Poste 3)**
- **RAM**: Minimum 8GB (16GB recommandé)
- **CPU**: 4 cores minimum
- **Stockage**: 10GB libre (pour données + backups)

---

## 🔧 **INSTALLATION ÉTAPE PAR ÉTAPE**

### **Phase 1: Préparation de l'Environnement**

#### **1.1 Installer Node.js sur Tous les Postes**
```bash
# Télécharger Node.js 18+ depuis https://nodejs.org
# Vérifier l'installation
node --version
npm --version
```

#### **1.2 Cloner le Projet**
```bash
git clone [URL_DU_PROJET]
cd nomedia-production
```

---

### **Phase 2: Configuration du Serveur (Poste 3)**

#### **2.1 Installation des Dépendances**
```bash
# Dans le dossier du projet
npm install
```

#### **2.2 Configuration de la Base de Données**
```bash
# Initialiser la base SQLite
node init-sqlite-db.js

# Vérifier que nomedia.db est créé
ls -la nomedia.db
```

#### **2.3 Configuration Réseau**
Créer `.env.production`:
```env
PORT=8000
NODE_ENV=production
JWT_SECRET=votre-secret-super-securise-changez-moi
DB_PATH=./nomedia.db

# Configuration réseau
HOST=0.0.0.0
FRONTEND_URL=http://[IP_DU_SERVEUR]:8080
API_URL=http://[IP_DU_SERVEUR]:8000
```

#### **2.4 Démarrage du Serveur**
```bash
# Mode production
npm run build
npm start

# Ou mode développement
npm run dev
```

---

### **Phase 3: Configuration des Clients (Postes 1, 2, 4, 5)**

#### **3.1 Installation Légère**
```bash
# Installer seulement les dépendances frontend
npm install --production
```

#### **3.2 Configuration Client**
Créer `.env.local`:
```env
VITE_API_URL=http://[IP_DU_SERVEUR]:8000/api
VITE_APP_NAME=Nomedia Production
```

#### **3.3 Build et Démarrage**
```bash
# Build de l'application
npm run build

# Servir les fichiers statiques
npx serve dist -p 3000
```

---

## 🌐 **CONFIGURATION RÉSEAU**

### **Paramètres IP Recommandés**
```
Poste 1 (Client):    192.168.1.101
Poste 2 (Client):    192.168.1.102  
Poste 3 (Serveur):   192.168.1.100
Poste 4 (Client):    192.168.1.104
Poste 5 (Client):    192.168.1.105

Masque: 255.255.255.0
Passerelle: 192.168.1.1
```

### **Ports à Ouvrir**
- **8000**: API Backend
- **8080**: Interface Web (dev)
- **3000**: Interface Web (production)

### **Configuration Firewall Windows**
```cmd
# Ouvrir les ports nécessaires
netsh advfirewall firewall add rule name="Nomedia API" dir=in action=allow protocol=TCP localport=8000
netsh advfirewall firewall add rule name="Nomedia Web" dir=in action=allow protocol=TCP localport=3000
```

---

## 💾 **GESTION DE LA BASE DE DONNÉES SQLite**

### **Stratégies de Partage de Base**

#### **Option 1: Dossier Partagé Réseau (Simple)**
```bash
# Sur le serveur, partager le dossier contenant nomedia.db
# Configurer les clients pour pointer vers \\SERVEUR\nomedia\nomedia.db
```

#### **Option 2: Synchronisation Automatique (Recommandée)**
Créer `sync-db.sh`:
```bash
#!/bin/bash
# Script de synchronisation toutes les 5 minutes
while true; do
    rsync -av user@192.168.1.100:/path/to/nomedia.db ./nomedia.db
    sleep 300
done
```

#### **Option 3: Base Centralisée avec API**
```javascript
// Configuration pour pointer tous les clients vers le serveur central
const API_BASE_URL = 'http://192.168.1.100:8000/api';
```

---

## 🔐 **SÉCURITÉ ET BONNES PRATIQUES**

### **Comptes Utilisateurs par Poste**
```
Poste 1: Manager/User (zineb@nomedia.ma)
Poste 2: User/Guest (karim@nomedia.ma) 
Poste 3: Admin (mohammed@nomedia.ma)
Poste 4: User (alice.martin@nomedia.ma)
Poste 5: Manager (david.chen@nomedia.ma)
```

### **Sécurisation**
1. **Changer les mots de passe par défaut**
2. **Utiliser HTTPS en production**
3. **Restreindre l'accès réseau**
4. **Backups automatiques**

---

## 💾 **STRATÉGIE DE SAUVEGARDE**

### **Script de Backup Automatique**
```bash
#!/bin/bash
# backup-nomedia.sh
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backup/nomedia"
DB_FILE="/path/to/nomedia.db"

mkdir -p $BACKUP_DIR
cp $DB_FILE "$BACKUP_DIR/nomedia_$DATE.db"

# Garder seulement les 30 derniers backups
find $BACKUP_DIR -name "nomedia_*.db" -type f -mtime +30 -delete
```

### **Planification (Crontab)**
```bash
# Backup toutes les heures
0 * * * * /path/to/backup-nomedia.sh

# Backup quotidien complet
0 2 * * * tar -czf /backup/nomedia_full_$(date +%Y%m%d).tar.gz /path/to/nomedia-production/
```

---

## 🚀 **DÉMARRAGE AUTOMATIQUE**

### **Windows (Service)**
Créer `nomedia.bat`:
```batch
@echo off
cd C:\nomedia-production
npm start
```

### **Linux (Systemd)**
Créer `/etc/systemd/system/nomedia.service`:
```ini
[Unit]
Description=Nomedia Production Server
After=network.target

[Service]
Type=simple
User=nomedia
WorkingDirectory=/opt/nomedia-production
ExecStart=/usr/bin/npm start
Restart=always

[Install]
WantedBy=multi-user.target
```

---

## 🔍 **SURVEILLANCE ET MONITORING**

### **Logs Centralisés**
```bash
# Centraliser les logs sur le serveur
mkdir -p /var/log/nomedia
tail -f /var/log/nomedia/*.log
```

### **Script de Monitoring**
```bash
#!/bin/bash
# check-nomedia.sh
if ! curl -f http://192.168.1.100:8000/api/health; then
    echo "ALERTE: Serveur Nomedia non accessible!"
    # Redémarrer le service ou envoyer alerte
fi
```

---

## 🔧 **DÉPANNAGE**

### **Problèmes Courants**

#### **Base de données verrouillée**
```bash
# Vérifier les processus utilisant la DB
lsof nomedia.db
# Redémarrer l'application si nécessaire
```

#### **Problèmes de réseau**
```bash
# Tester la connectivité
ping 192.168.1.100
telnet 192.168.1.100 8000
```

#### **Permissions SQLite**
```bash
# Corriger les permissions
chmod 664 nomedia.db
chown nomedia:nomedia nomedia.db
```

---

## 📊 **PERFORMANCES ET OPTIMISATION**

### **SQLite en Multi-Utilisateurs**
```javascript
// Configuration SQLite optimisée
const dbConfig = {
    journal_mode: 'WAL',
    synchronous: 'NORMAL',
    cache_size: 10000,
    temp_store: 'MEMORY'
};
```

### **Monitoring des Performances**
```bash
# Analyser les performances SQLite
sqlite3 nomedia.db ".timer on" ".stats on"
```

---

## 📞 **SUPPORT ET MAINTENANCE**

### **Contacts Techniques**
- **Admin Système**: mohammed@nomedia.ma
- **Support**: admin@nomedia.ma

### **Maintenance Planifiée**
- **Backup quotidien**: 02h00
- **Restart hebdomadaire**: Dimanche 01h00
- **Mise à jour mensuelle**: Premier vendredi du mois

---

## 📚 **RESSOURCES SUPPLÉMENTAIRES**

- [Documentation SQLite](https://www.sqlite.org/docs.html)
- [Guide Node.js Production](https://nodejs.org/en/docs/guides/)
- [Sécurité Express.js](https://expressjs.com/en/advanced/best-practice-security.html)

---

*Guide de déploiement - Version 1.0*  
*Dernière mise à jour: ${new Date().toLocaleDateString('fr-FR')}*
