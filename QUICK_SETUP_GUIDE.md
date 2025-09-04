# ⚡ GUIDE RAPIDE - 5 ORDINATEURS
## Installation en 15 Minutes

---

## 🎯 **OBJECTIF**
Installer Nomedia Production sur 5 ordinateurs avec une base de données partagée.

---

## 📋 **CE DONT VOUS AVEZ BESOIN**

### **Matériel**
- ✅ 5 ordinateurs connectés au même réseau
- ✅ Connexion Internet (pour l'installation)
- ✅ Droits administrateur sur tous les ordinateurs

### **Fichiers à Télécharger**
- ✅ Code source: https://github.com/STALPHA2708/Nomedia
- ✅ Base de données actuelle: `nomedia.db`
- ✅ Scripts d'installation (créés)

---

## 🚀 **INSTALLATION RAPIDE**

### **ÉTAPE 1: Choisir le Serveur (1 ordinateur)**

**Ordinateur le plus puissant = Serveur**
- RAM: 8GB+
- Sera l'ordinateur 3 (IP: 192.168.1.100)

### **ÉTAPE 2: Installation Serveur (5 minutes)**

#### **Linux/Mac:**
```bash
# Télécharger et exécuter le script
wget https://raw.githubusercontent.com/STALPHA2708/Nomedia/main/install-server.sh
chmod +x install-server.sh
sudo ./install-server.sh
```

#### **Windows:**
```bash
# Installer Node.js depuis nodejs.org
# Puis exécuter:
git clone https://github.com/STALPHA2708/Nomedia.git
cd Nomedia
npm install
npm run build
npm start
```

### **ÉTAPE 3: Configuration IP (2 minutes)**

#### **Configurer IP Statique sur le Serveur:**
- **IP:** 192.168.1.100
- **Masque:** 255.255.255.0
- **Passerelle:** 192.168.1.1

### **ÉTAPE 4: Test Serveur (1 minute)**
```bash
# Vérifier que ça marche
curl http://192.168.1.100:8000/api/health
```

### **ÉTAPE 5: Clients (2 minutes chacun)**

**Option Simple:** Les 4 autres ordinateurs accèdent directement à:
```
http://192.168.1.100:8000
```

**Créer un raccourci sur le bureau avec cette URL**

---

## 🔐 **COMPTES PAR ORDINATEUR**

```
Ordinateur 1: zineb@nomedia.ma / zineb123 (Manager)
Ordinateur 2: karim@nomedia.ma / karim123 (User)
Ordinateur 3: mohammed@nomedia.ma / mohammed123 (Admin + Serveur)
Ordinateur 4: alice.martin@nomedia.ma / user123 (User)
Ordinateur 5: david.chen@nomedia.ma / manager123 (Manager)
```

---

## ✅ **VÉRIFICATION FINALE**

### **Test depuis chaque ordinateur:**
1. Ouvrir navigateur
2. Aller sur: `http://192.168.1.100:8000`
3. Se connecter avec son compte
4. Créer un projet test
5. Vérifier que les autres voient le projet

---

## 🆘 **PROBLÈMES COURANTS**

### **"Site inaccessible"**
```bash
# Sur le serveur, vérifier:
pm2 status
pm2 logs

# Ouvrir le pare-feu:
sudo ufw allow 8000
```

### **"Connexion refusée"**
- Vérifier l'IP du serveur
- Ping le serveur depuis un client
- Redémarrer le service

### **"Base de données vide"**
- Copier votre `nomedia.db` existant
- Placer dans le dossier du serveur
- Redémarrer l'application

---

## 📞 **AIDE RAPIDE**

### **Commandes Serveur Utiles:**
```bash
pm2 status          # Voir l'état
pm2 restart all     # Redémarrer
pm2 logs            # Voir les logs
pm2 stop all        # Arrêter
```

### **URLs Importantes:**
- **Application:** http://192.168.1.100:8000
- **API Health:** http://192.168.1.100:8000/api/health
- **Admin Interface:** http://192.168.1.100:8000/admin

---

## 🎉 **RÉSULTAT FINAL**

Après cette installation:
- ✅ **5 ordinateurs** utilisent la même application
- ✅ **1 base de données** partagée
- ✅ **Temps réel** - tout le monde voit les mêmes données
- ✅ **Accès local** - fonctionne sans Internet

**Temps total d'installation: 15 minutes maximum!**

---

*Guide Rapide - Version 1.0*  
*Support: mohammed@nomedia.ma*
