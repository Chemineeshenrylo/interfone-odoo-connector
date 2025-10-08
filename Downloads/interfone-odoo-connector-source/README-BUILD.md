# Interfone Odoo Connector - Guide de Build

Ce dossier contient tous les fichiers source nécessaires pour builder l'application sur un autre ordinateur.

## 📋 Contenu du dossier

### Fichiers essentiels
- `package.json` - Configuration du projet et dépendances
- `package-lock.json` - Versions exactes des dépendances
- `.gitignore` - Fichiers à ignorer par Git

### Fichiers source principaux
- `main.js` - Processus principal Electron (auto-updater, tray, etc.)
- `preload.js` - Bridge entre le processus principal et le renderer
- `settings.html` - Interface de configuration
- `popup.html` - Fenêtre popup pour les appels entrants
- `renderer-native.js` - Script renderer pour settings.html
- `native-sip-client.js` - Client SIP natif

### Dossiers
- `build/` - Scripts NSIS et entitlements macOS
  - `installer.nsh` - Script d'installation Windows
  - `entitlements.mac.plist` - Permissions macOS
- `assets/` - Images et icônes
  - `icon.png` - Icône de l'application
  - `tray.png` - Icône du system tray

## 🚀 Installation sur un nouvel ordinateur

### 1. Prérequis

**Windows :**
- Node.js 18+ : https://nodejs.org/
- Git (optionnel) : https://git-scm.com/

**macOS :**
- Node.js 18+ : https://nodejs.org/
- Xcode Command Line Tools : `xcode-select --install`
- Certificat Apple Developer (pour signer l'app)

### 2. Installation des dépendances

```bash
# Aller dans le dossier
cd interfone-odoo-connector-source

# Installer toutes les dépendances
npm install
```

Cette commande va télécharger et installer :
- `electron` - Framework pour créer l'application desktop
- `electron-builder` - Outil pour packager l'application
- `electron-updater` - Système de mise à jour automatique
- `drachtio-srf` - Client SIP
- `electron-store` - Stockage des paramètres
- `electron-log` - Système de logs

### 3. Tester l'application en développement

```bash
npm start
```

L'application devrait se lancer avec les icônes dans le system tray.

### 4. Builder l'application

**Pour Windows :**
```bash
npm run dist-win
```

Le fichier sera créé dans `dist/Interfone-Odoo-Connector-Setup-X.X.X.exe`

**Pour macOS :**
```bash
npm run dist-mac
```

Le fichier sera créé dans `dist/Interfone-Odoo-Connector-X.X.X-arm64-mac.zip`

## 📦 Publier une nouvelle version

### 1. Mettre à jour le numéro de version

Éditer `package.json` :
```json
{
  "version": "1.5.7"
}
```

Éditer `settings.html` (ligne ~651) :
```html
<p>Version: 1.5.7</p>
```

### 2. Builder l'application

```bash
# Windows
npm run dist-win

# macOS
npm run dist-mac
```

### 3. Créer un commit et un tag Git

```bash
git add package.json settings.html
git commit -m "Version 1.5.7 - Description des changements"
git tag v1.5.7
git push origin master
git push origin v1.5.7
```

### 4. Créer une release GitHub

**Avec GitHub CLI (recommandé) :**

```bash
# Installer GitHub CLI si nécessaire
winget install --id GitHub.cli

# S'authentifier
gh auth login

# Créer la release (Windows)
gh release create v1.5.7 \
  --title "Version 1.5.7" \
  --notes "Description des changements

- Amélioration 1
- Amélioration 2
- Correction 3" \
  "dist\Interfone-Odoo-Connector-Setup-1.5.7.exe" \
  "dist\latest.yml"

# Créer la release (macOS)
gh release create v1.5.7 \
  --title "Version 1.5.7" \
  --notes "Description des changements" \
  "dist/Interfone-Odoo-Connector-1.5.7-arm64-mac.zip" \
  "dist/latest-mac.yml"
```

**Manuellement via GitHub :**
1. Aller sur https://github.com/Chemineeshenrylo/interfone-odoo-connector/releases
2. Cliquer "Create a new release"
3. Tag : `v1.5.7`
4. Title : `Version 1.5.7`
5. Description : Liste des changements
6. Uploader les fichiers :
   - **Windows** : `Interfone-Odoo-Connector-Setup-1.5.7.exe` + `latest.yml`
   - **macOS** : `Interfone-Odoo-Connector-1.5.7-arm64-mac.zip` + `latest-mac.yml`
7. Publier

### 5. Test de l'auto-updater

Une fois la release publiée :
1. Installer la version précédente (ex: 1.5.6)
2. Lancer l'application
3. Aller dans "À propos" → "Vérifier les mises à jour"
4. L'application devrait détecter la 1.5.7 et proposer la mise à jour

## ⚙️ Configuration importante

### Auto-updater (package.json)

```json
"publish": [
  {
    "provider": "github",
    "owner": "Chemineeshenrylo",
    "repo": "interfone-odoo-connector"
  }
]
```

Cette configuration indique à `electron-updater` où chercher les mises à jour.

### Signature de code

**macOS (obligatoire) :**
- Certificat Apple requis
- Configuré dans `package.json` : `mac.identity`
- Fichier d'entitlements : `build/entitlements.mac.plist`

**Windows (optionnel mais recommandé) :**
- Non signé actuellement (`signAndEditExecutable: false`)
- Pour signer : obtenir un certificat de signature de code (~300€/an)

## 🐛 Résolution de problèmes

### "electron not found"
```bash
npm install
```

### "Cannot find module"
Supprimer `node_modules` et réinstaller :
```bash
rm -rf node_modules
npm install
```

### Build échoue sur Windows
Vérifier que vous avez les outils de build :
```bash
npm install --global windows-build-tools
```

### Build échoue sur macOS
Installer Xcode Command Line Tools :
```bash
xcode-select --install
```

## 📁 Structure complète du projet

```
interfone-odoo-connector-source/
├── assets/                     # Images et icônes
│   ├── icon.png               # Icône principale
│   └── tray.png               # Icône system tray
├── build/                      # Scripts de build
│   ├── installer.nsh          # Script NSIS Windows
│   └── entitlements.mac.plist # Permissions macOS
├── main.js                     # Process principal
├── preload.js                  # Bridge IPC
├── settings.html               # Interface principale
├── popup.html                  # Popup d'appel
├── renderer-native.js          # Script renderer
├── native-sip-client.js        # Client SIP
├── package.json                # Configuration npm
├── package-lock.json           # Versions des dépendances
└── .gitignore                  # Fichiers ignorés
```

## 🔗 Liens utiles

- Documentation Electron : https://www.electronjs.org/docs
- Documentation electron-builder : https://www.electron.build/
- Documentation electron-updater : https://www.electron.build/auto-update
- Repository GitHub : https://github.com/Chemineeshenrylo/interfone-odoo-connector

## ✅ Checklist avant le transfert

- [x] Tous les fichiers source (.js, .html)
- [x] Fichiers de configuration (package.json, .gitignore)
- [x] Dossier build/ avec scripts NSIS et entitlements
- [x] Dossier assets/ avec les icônes
- [x] Ce README avec toutes les instructions

## 📝 Notes importantes

1. **Ne PAS copier** :
   - `node_modules/` - Sera recréé avec `npm install`
   - `dist/` - Sera recréé lors du build
   - `.git/` - Optionnel, peut être recloné depuis GitHub

2. **Version actuelle** : 1.5.6

3. **Auto-updater** : Configuré pour GitHub Releases sur le repo `Chemineeshenrylo/interfone-odoo-connector`

4. **Support** : Windows (x64) et macOS (arm64)

---

**Dernière mise à jour** : 8 octobre 2025
**Version de Node.js recommandée** : 18.x ou supérieur
**Version d'Electron** : 38.2.0
