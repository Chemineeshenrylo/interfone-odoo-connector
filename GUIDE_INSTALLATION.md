# Guide d'installation et d'utilisation

## 📦 Installation rapide

```bash
# 1. Installer les dépendances
npm install

# 2. Lancer l'application
npm start
```

## 🔧 Configuration initiale

1. **Au premier lancement**, la fenêtre de configuration s'ouvre
2. Entrez vos **identifiants SIP** fournis par Interfone
3. Entrez l'**URL de votre Odoo** (ex: https://monentreprise.odoo.com)
4. Cliquez sur **Sauvegarder** puis **Se connecter**

## 🧪 Test de l'application

1. Une fois connecté (statut "✅ Connecté")
2. Cliquez sur **"Simuler un appel test"** en bas de la fenêtre
3. Une pop-up devrait apparaître avec un numéro de test
4. Cliquez sur **"Trouver dans Odoo"** pour vérifier l'intégration

## 📱 Utilisation quotidienne

- L'application tourne en arrière-plan
- À chaque appel entrant sur votre ligne Interfone :
  - Une **pop-up** apparaît avec le numéro
  - Cliquez sur **"Trouver dans Odoo"** pour rechercher le contact
  - L'historique des 5 derniers appels est visible

## 🏗️ Build pour production

### macOS
```bash
npm run dist-mac
# Le .dmg sera dans dist/
```

### Windows
```bash
npm run dist-win
# Le .exe sera dans dist/
```

## ⚙️ Paramètres par défaut

- **Serveur SIP** : `sbc.interfone.co:5061`
- **Protocole** : TLS (sécurisé)
- **Port WebSocket** : Inclus dans l'adresse

## 🐛 Dépannage

### L'application ne se connecte pas
- Vérifiez vos identifiants SIP
- Vérifiez votre connexion internet
- Assurez-vous que le port 5061 n'est pas bloqué

### La pop-up n'apparaît pas
- Vérifiez que l'application est bien connectée (✅ dans les paramètres)
- Autorisez les notifications système pour l'application

### Odoo ne s'ouvre pas
- Vérifiez l'URL Odoo dans les paramètres
- Assurez-vous d'être connecté à Odoo dans votre navigateur

## 📞 Support

Pour toute question technique sur l'intégration SIP, contactez Interfone.
Pour les problèmes liés à Odoo, consultez votre administrateur Odoo.