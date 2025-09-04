# 🌐 CONFIGURATION RÉSEAU - NOMEDIA PRODUCTION
## Setup Multi-Postes avec SQLite Partagée

---

## 🎯 **STRATÉGIES DE DÉPLOIEMENT SQLITE**

### **Problématique SQLite Multi-Utilisateurs**
SQLite est une base de données **fichier unique**, ce qui pose des défis pour un usage multi-postes:
- ❌ Pas de serveur de base de données dédié
- ❌ Accès concurrent limité
- ❌ Problèmes de verrouillage réseau

### **Solutions Recommandées**

---

## 🔧 **SOLUTION 1: SERVEUR CENTRAL + API (Recommandée)**

### **Architecture**
```
Clients (4 postes) → API Server (1 poste) → SQLite Database
```

### **Avantages**
✅ Un seul point d'accès à la base  
✅ Gestion propre des transactions  
✅ Sécurité centralisée  
✅ Pas de conflit de fichiers  

### **Configuration**

#### **Poste Serveur (192.168.1.100)**
```bash
# Configuration serveur
export HOST=0.0.0.0
export PORT=8000
export DB_PATH=./nomedia.db

# Démarrer le serveur
npm run start:server
```

#### **Postes Clients (192.168.1.101-104)**
```javascript
// Configuration clients - vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://192.168.1.100:8000',
        changeOrigin: true
      }
    }
  }
})
```

---

## 🔧 **SOLUTION 2: DOSSIER PARTAGÉ RÉSEAU**

### **Configuration Windows**

#### **Serveur (Partage)**
```cmd
# Créer le partage
net share nomedia=C:\nomedia-production\data /grant:everyone,full

# Sécuriser le partage
icacls C:\nomedia-production\data /grant "Utilisateurs":(OI)(CI)F
```

#### **Clients (Accès)**
```cmd
# Monter le lecteur réseau
net use N: \\192.168.1.100\nomedia

# Configurer le chemin DB
set DB_PATH=N:\nomedia.db
```

### **Configuration Linux**

#### **Serveur (NFS)**
```bash
# Installer NFS
sudo apt-get install nfs-kernel-server

# Configurer /etc/exports
echo "/opt/nomedia-data 192.168.1.0/24(rw,sync,no_subtree_check)" >> /etc/exports

# Redémarrer NFS
sudo systemctl restart nfs-kernel-server
```

#### **Clients (Mount)**
```bash
# Installer client NFS
sudo apt-get install nfs-common

# Monter le partage
sudo mount -t nfs 192.168.1.100:/opt/nomedia-data /mnt/nomedia

# Configuration auto-mount
echo "192.168.1.100:/opt/nomedia-data /mnt/nomedia nfs defaults 0 0" >> /etc/fstab
```

---

## 🔧 **SOLUTION 3: RÉPLICATION DE BASE**

### **Script de Synchronisation**
```bash
#!/bin/bash
# sync-database.sh

MASTER_DB="192.168.1.100:/opt/nomedia/nomedia.db"
LOCAL_DB="./nomedia.db"
BACKUP_DB="./nomedia.backup.db"

# Backup avant sync
cp "$LOCAL_DB" "$BACKUP_DB"

# Synchronisation
rsync -av "$MASTER_DB" "$LOCAL_DB"

if [ $? -eq 0 ]; then
    echo "✅ Synchronisation réussie"
else
    echo "❌ Erreur de synchronisation - restauration backup"
    cp "$BACKUP_DB" "$LOCAL_DB"
fi
```

### **Planification (Crontab)**
```bash
# Sync toutes les 5 minutes
*/5 * * * * /opt/nomedia/sync-database.sh

# Sync après modification
inotifywait -m /opt/nomedia/nomedia.db -e modify --format '%w%f' | while read file; do
    /opt/nomedia/sync-database.sh
done
```

---

## 🌐 **CONFIGURATION RÉSEAU DÉTAILLÉE**

### **Plan d'Adressage IP**
```
Réseau: 192.168.1.0/24

SERVEUR:
┌─────────────────────────────────┐
│ Poste 3 (Serveur Principal)    │
│ IP: 192.168.1.100              │
│ Services: API + Database        │
��� Ports: 8000 (API), 8080 (Web)  │
└─────────────────────────────────┘

CLIENTS:
┌─────────────────────────────────┐
│ Poste 1 - Manager               │
│ IP: 192.168.1.101              │
│ User: zineb@nomedia.ma          │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ Poste 2 - Utilisateur          │
│ IP: 192.168.1.102              │
│ User: karim@nomedia.ma          │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ Poste 4 - Admin Mobile         │
│ IP: 192.168.1.104              │
│ User: mohammed@nomedia.ma       │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ Poste 5 - Manager              │
│ IP: 192.168.1.105              │
│ User: david.chen@nomedia.ma     │
└─────────────────────────────────┘
```

### **Configuration Firewall**

#### **Windows (Serveur)**
```cmd
# Ouvrir les ports
netsh advfirewall firewall add rule name="Nomedia API" dir=in action=allow protocol=TCP localport=8000
netsh advfirewall firewall add rule name="Nomedia Web" dir=in action=allow protocol=TCP localport=8080
netsh advfirewall firewall add rule name="NFS" dir=in action=allow protocol=TCP localport=2049

# Autoriser le réseau local
netsh advfirewall firewall add rule name="Local Network" dir=in action=allow remoteip=192.168.1.0/24
```

#### **Linux (iptables)**
```bash
# Autoriser les connexions API
iptables -A INPUT -p tcp --dport 8000 -s 192.168.1.0/24 -j ACCEPT
iptables -A INPUT -p tcp --dport 8080 -s 192.168.1.0/24 -j ACCEPT

# NFS si utilisé
iptables -A INPUT -p tcp --dport 2049 -s 192.168.1.0/24 -j ACCEPT
iptables -A INPUT -p udp --dport 2049 -s 192.168.1.0/24 -j ACCEPT
```

---

## 🔒 **SÉCURITÉ RÉSEAU**

### **HTTPS avec Certificat Auto-Signé**
```bash
# Générer certificat SSL
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes

# Configuration Express
const https = require('https');
const fs = require('fs');

const options = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
};

https.createServer(options, app).listen(8443);
```

### **Authentification JWT Renforcée**
```javascript
// Configuration JWT sécurisée
const JWT_CONFIG = {
  secret: process.env.JWT_SECRET || 'changez-moi-en-production',
  expiresIn: '8h',
  issuer: 'nomedia-production',
  audience: 'nomedia-users'
};
```

---

## 📊 **MONITORING RÉSEAU**

### **Script de Surveillance**
```bash
#!/bin/bash
# network-monitor.sh

HOSTS=("192.168.1.101" "192.168.1.102" "192.168.1.104" "192.168.1.105")
LOG_FILE="/var/log/nomedia-network.log"

for host in "${HOSTS[@]}"; do
    if ping -c 1 "$host" &> /dev/null; then
        echo "$(date): ✅ $host - OK" >> "$LOG_FILE"
    else
        echo "$(date): ❌ $host - UNREACHABLE" >> "$LOG_FILE"
        # Envoyer alerte email si nécessaire
    fi
done

# Vérifier les services
if curl -f "http://192.168.1.100:8000/api/health" &> /dev/null; then
    echo "$(date): ✅ API Service - OK" >> "$LOG_FILE"
else
    echo "$(date): ❌ API Service - DOWN" >> "$LOG_FILE"
fi
```

---

## 🛠️ **OUTILS DE DIAGNOSTIC**

### **Test de Connectivité**
```bash
#!/bin/bash
# test-network.sh

echo "🔍 Test de connectivité Nomedia"
echo "================================"

# Test ping
echo "📡 Test ping serveur..."
ping -c 3 192.168.1.100

# Test port API
echo "🔌 Test port API (8000)..."
nc -zv 192.168.1.100 8000

# Test service web
echo "🌐 Test service web..."
curl -I http://192.168.1.100:8080

# Test base de données (si accessible)
echo "💾 Test accès base..."
if [ -f "/mnt/nomedia/nomedia.db" ]; then
    sqlite3 /mnt/nomedia/nomedia.db "SELECT COUNT(*) FROM users;"
fi
```

### **Performance Réseau**
```bash
# Test débit réseau
iperf3 -s # Sur le serveur
iperf3 -c 192.168.1.100 # Sur les clients

# Test latence continue
ping -i 1 192.168.1.100 | while read pong; do
    echo "$(date): $pong"
done
```

---

## 🔄 **PROCÉDURES DE RÉCUPÉRATION**

### **En Cas de Panne Serveur**
```bash
#!/bin/bash
# failover.sh

# 1. Identifier un client comme serveur temporaire
NEW_SERVER="192.168.1.104"

# 2. Copier la dernière sauvegarde
scp backup/nomedia_latest.db "$NEW_SERVER:/opt/nomedia/"

# 3. Rediriger les clients
for client in "192.168.1.101" "192.168.1.102" "192.168.1.105"; do
    ssh "$client" "sed -i 's/192.168.1.100/$NEW_SERVER/g' /opt/nomedia/.env"
    ssh "$client" "systemctl restart nomedia"
done
```

### **Synchronisation après Panne**
```bash
#!/bin/bash
# resync-after-failure.sh

# Après remise en service du serveur principal
MAIN_SERVER="192.168.1.100"
TEMP_SERVER="192.168.1.104"

# Récupérer les dernières données
scp "$TEMP_SERVER:/opt/nomedia/nomedia.db" "$MAIN_SERVER:/opt/nomedia/"

# Restaurer la configuration normale
for client in "192.168.1.101" "192.168.1.102" "192.168.1.105"; do
    ssh "$client" "sed -i 's/$TEMP_SERVER/$MAIN_SERVER/g' /opt/nomedia/.env"
    ssh "$client" "systemctl restart nomedia"
done
```

---

*Configuration Réseau - Version 1.0*  
*Support technique: mohammed@nomedia.ma*
