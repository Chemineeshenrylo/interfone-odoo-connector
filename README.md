# Interfone Odoo Connector

Application de bureau pour l'intégration entre Interfone (SIP) et Odoo CRM.

## Fonctionnalités

- ✅ Connexion SIP native UDP au serveur Interfone
- ✅ Détection automatique des appels entrants en temps réel
- ✅ Pop-up avec affichage du numéro appelant
- ✅ Recherche rapide dans Odoo (phone/mobile)
- ✅ Icône système avec statut de connexion
- ✅ Gestion du statut utilisateur (Disponible/Occupé/Absent)
- ✅ Mise à jour automatique via GitHub Releases
- ✅ Support multi-plateforme (macOS/Windows)

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

## Mise à Jour

L'application intègre un système de mise à jour automatique :

- ✅ Vérification automatique au démarrage
- ✅ Notification des nouvelles versions disponibles
- ✅ Téléchargement et installation en un clic
- ✅ Support des versions Mac et Windows

Pour plus de détails, voir [UPDATE_GUIDE.md](UPDATE_GUIDE.md).

## Architecture

- **Electron** : Framework desktop
- **Native SIP Client** : Client SIP UDP natif pour intercepter les vrais appels
- **electron-store** : Stockage sécurisé des paramètres
- **electron-builder** : Packaging multi-plateforme
- **electron-updater** : Système de mise à jour automatique

## Différences avec WebRTC

Cette application utilise un client SIP natif UDP au lieu de WebRTC, permettant :
- Interception des vrais appels Interfone (pas de simulation)
- Utilisation des mêmes identifiants que Zoiper
- Connexion directe au serveur SIP sans passerelle

## Support

Pour toute question ou problème, contactez le support technique.