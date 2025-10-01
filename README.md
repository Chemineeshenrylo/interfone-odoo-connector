# Interfone Odoo Connector

Application de bureau pour l'intégration entre Interfone (SIP) et Odoo CRM.

## Fonctionnalités

- ✅ Connexion au serveur SIP Interfone (TLS)
- ✅ Détection automatique des appels entrants
- ✅ Pop-up avec affichage du numéro appelant
- ✅ Recherche rapide dans Odoo (phone/mobile)
- ✅ Historique des 5 derniers appels
- ✅ Icône système avec statut de connexion

## Installation

### Prérequis
- Node.js 18+
- npm

### Installation des dépendances
```bash
npm install
```

## Utilisation

### Mode développement
```bash
npm start
```

### Build

#### macOS
```bash
npm run dist-mac
```

#### Windows
```bash
npm run dist-win
```

Les exécutables seront générés dans le dossier `dist/`.

## Configuration

Au premier lancement :

1. **Serveur SIP** : `sbc.interfone.co:5061` (par défaut)
2. **Identifiants SIP** : Fournis par Interfone
3. **URL Odoo** : L'adresse de votre instance Odoo

## Architecture

- **Electron** : Framework desktop
- **sip.js** : Client SIP WebRTC
- **electron-store** : Stockage sécurisé des paramètres
- **electron-builder** : Packaging multi-plateforme

## Support

Pour toute question ou problème, contactez le support.