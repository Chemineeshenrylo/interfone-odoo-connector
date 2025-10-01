# Guide de Mise à Jour - Interfone Odoo Connector

## 🔄 Système de Mise à Jour Automatique

L'application intègre un système de mise à jour automatique basé sur GitHub Releases qui gère automatiquement les différences entre Mac et Windows.

## 📋 Comment Utiliser les Mises à Jour

### Pour les Utilisateurs

1. **Vérification automatique** : L'application vérifie automatiquement les mises à jour au démarrage
2. **Vérification manuelle** : Utilisez le bouton "🔍 Vérifier les mises à jour" dans les paramètres
3. **Installation** : Cliquez sur "📥 Installer la mise à jour" quand une nouvelle version est disponible
4. **Redémarrage automatique** : L'application redémarre automatiquement après installation

### États des Mises à Jour

- ✅ **À jour** : Vous avez la dernière version
- 📥 **Disponible** : Une nouvelle version est prête à télécharger
- 📥 **Téléchargement** : Mise à jour en cours de téléchargement (avec barre de progression)
- ✅ **Prête** : Mise à jour téléchargée, prête à installer

## 🚀 Comment Publier une Nouvelle Version (Développeurs)

### 1. Préparer la Release

```bash
# 1. Mettre à jour la version dans package.json
npm version patch  # ou minor/major selon le type de mise à jour

# 2. Créer le build de production
npm run build

# 3. Tester les builds
npm run dist-mac    # Pour macOS
npm run dist-win    # Pour Windows
```

### 2. Pousser sur GitHub

```bash
# 1. Commiter les changements
git add .
git commit -m "Release v1.2.0"

# 2. Créer un tag de version
git tag v1.2.0

# 3. Pousser le code et les tags
git push origin main
git push origin v1.2.0
```

### 3. Créer la Release sur GitHub

1. Aller sur : https://github.com/Chemineeshenrylo/interfone-odoo-connector/releases
2. Cliquer sur "Create a new release"
3. Sélectionner le tag créé (ex: v1.2.0)
4. Remplir le titre : "Version 1.2.0"
5. Décrire les nouveautés dans la description
6. **Uploader les fichiers** depuis le dossier `dist/` :
   - `Interfone Odoo Connector-1.2.0.dmg` (pour Mac)
   - `Interfone Odoo Connector Setup 1.2.0.exe` (pour Windows)
7. Cliquer sur "Publish release"

### 4. Vérification

- L'auto-updater détectera automatiquement la nouvelle release
- Les utilisateurs recevront la notification de mise à jour
- Le système téléchargera le bon fichier selon leur OS

## 🔧 Configuration Technique

### electron-updater

L'application utilise `electron-updater` qui :
- Vérifie automatiquement les GitHub Releases
- Télécharge le bon format selon l'OS (DMG pour Mac, NSIS pour Windows)
- Gère la signature et la sécurité
- Redémarre l'application après installation

### Configuration dans package.json

```json
{
  "build": {
    "publish": [
      {
        "provider": "github",
        "owner": "Chemineeshenrylo",
        "repo": "interfone-odoo-connector"
      }
    ]
  }
}
```

## 🛠️ Dépannage

### Problème de mise à jour
- Vérifier la connexion internet
- Vérifier que le repository GitHub est accessible
- Redémarrer l'application

### Erreur de téléchargement
- Vérifier l'espace disque disponible
- Vérifier les permissions d'écriture
- Essayer une vérification manuelle

### Mise à jour qui ne s'installe pas
- Fermer complètement l'application
- Redémarrer en tant qu'administrateur (Windows)
- Vérifier les permissions sur macOS

## 📚 Documentation Technique

- [electron-updater](https://www.electron.build/auto-update)
- [GitHub Releases API](https://docs.github.com/en/rest/releases)
- [Code Signing](https://www.electron.build/code-signing)