# Guide Complet - Auto-Updater Electron (Windows & macOS)

Ce guide explique comment mettre en place un système d'auto-update fonctionnel pour une application Electron, en utilisant `electron-updater` et GitHub Releases.

## 📋 Table des matières

1. [Prérequis](#prérequis)
2. [Installation des dépendances](#installation-des-dépendances)
3. [Configuration package.json](#configuration-packagejson)
4. [Configuration de la signature (macOS)](#configuration-de-la-signature-macos)
5. [Code de l'auto-updater](#code-de-lauto-updater)
6. [Interface utilisateur](#interface-utilisateur)
7. [Build et publication](#build-et-publication)
8. [Dépannage](#dépannage)

---

## 🔧 Prérequis

### macOS
- **Certificat Apple obligatoire** : Apple Development ou Apple Distribution
- Compte Apple Developer (99$/an)
- macOS pour builder l'application

### Windows
- **Optionnel** : Certificat de signature de code (recommandé mais pas obligatoire)
- Windows pour builder l'application

### Général
- Node.js installé
- Compte GitHub
- Repository GitHub pour héberger les releases

---

## 📦 Installation des dépendances

```bash
npm install --save electron-updater
npm install --save-dev electron-builder
```

---

## ⚙️ Configuration package.json

### Configuration complète

```json
{
  "name": "votre-app",
  "version": "1.0.0",
  "main": "main.js",
  "scripts": {
    "start": "electron .",
    "build": "electron-builder",
    "dist-mac": "electron-builder --mac",
    "dist-win": "electron-builder --win"
  },
  "build": {
    "appId": "com.votreentreprise.votreapp",
    "productName": "Votre Application",
    "directories": {
      "output": "dist"
    },
    "publish": [
      {
        "provider": "github",
        "owner": "votre-username",
        "repo": "votre-repo"
      }
    ],
    "mac": {
      "category": "public.app-category.utilities",
      "icon": "assets/icon.icns",
      "identity": "Apple Distribution: Votre Entreprise (XXXXXXXXXX)",
      "hardenedRuntime": true,
      "gatekeeperAssess": false,
      "entitlements": "build/entitlements.mac.plist",
      "entitlementsInherit": "build/entitlements.mac.plist",
      "target": [
        {
          "target": "zip",
          "arch": ["arm64", "x64"]
        }
      ]
    },
    "win": {
      "target": "nsis",
      "icon": "assets/icon.ico"
    }
  },
  "dependencies": {
    "electron-updater": "^6.6.2"
  },
  "devDependencies": {
    "electron": "^38.2.0",
    "electron-builder": "^26.0.12"
  }
}
```

### Points importants :

- **`publish.provider`** : Utiliser "github" pour héberger sur GitHub Releases
- **`mac.target`** : Utiliser "zip" au lieu de "dmg" (évite les problèmes de signature)
- **`mac.identity`** : Votre certificat Apple (obligatoire pour macOS)

---

## 🔐 Configuration de la signature (macOS)

### 1. Trouver votre certificat

```bash
security find-identity -v -p codesigning
```

Vous verrez quelque chose comme :
```
1) 0A0697C8178D24564A143977C3C3A405699DA5AB "Apple Distribution: Votre Entreprise (K868C9MV7A)"
```

Copiez le nom complet du certificat.

### 2. Créer le fichier d'entitlements

Créez le dossier et le fichier :

```bash
mkdir -p build
```

Créez `build/entitlements.mac.plist` :

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>com.apple.security.cs.allow-jit</key>
    <true/>
    <key>com.apple.security.cs.allow-unsigned-executable-memory</key>
    <true/>
    <key>com.apple.security.cs.disable-library-validation</key>
    <true/>
    <key>com.apple.security.network.client</key>
    <true/>
    <key>com.apple.security.network.server</key>
    <true/>
  </dict>
</plist>
```

### 3. Ajouter au .gitignore (optionnel)

Si vous ne voulez pas commiter le dossier build :

```
# .gitignore
dist/
node_modules/
# build/  <- NE PAS ignorer si vous voulez commiter les entitlements
```

---

## 💻 Code de l'auto-updater

### Fichier main.js (Process principal)

```javascript
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');

let mainWindow = null;

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadFile('index.html');
}

// ===== AUTO-UPDATER SETUP =====
function setupAutoUpdater() {
  // Désactiver les warnings de sécurité
  process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';

  // Configuration
  autoUpdater.autoDownload = false; // Téléchargement manuel
  autoUpdater.allowDowngrade = false;

  // Configuration spécifique macOS
  if (process.platform === 'darwin') {
    autoUpdater.forceDevUpdateConfig = true;
  }

  // Auto-installation au quit
  autoUpdater.autoInstallOnAppQuit = true;

  // Logs
  autoUpdater.logger = console;

  // Vérification au démarrage
  autoUpdater.checkForUpdatesAndNotify();

  // ===== ÉVÉNEMENTS AUTO-UPDATER =====

  autoUpdater.on('checking-for-update', () => {
    console.log('🔍 Vérification des mises à jour...');
    if (mainWindow) {
      mainWindow.webContents.send('update-status', { status: 'checking' });
    }
  });

  autoUpdater.on('update-available', (info) => {
    console.log('📥 Mise à jour disponible:', info.version);
    if (mainWindow) {
      mainWindow.webContents.send('update-status', {
        status: 'available',
        version: info.version
      });
    }
    // Télécharger automatiquement
    autoUpdater.downloadUpdate();
  });

  autoUpdater.on('update-not-available', (info) => {
    console.log('✅ Application à jour:', info.version);
    if (mainWindow) {
      mainWindow.webContents.send('update-status', {
        status: 'not-available',
        version: info.version
      });
    }
  });

  autoUpdater.on('error', (err) => {
    console.error('❌ Erreur mise à jour:', err);
    if (mainWindow) {
      mainWindow.webContents.send('update-status', {
        status: 'error',
        error: err.message
      });
    }
  });

  autoUpdater.on('download-progress', (progressObj) => {
    console.log(`📥 Téléchargement ${progressObj.percent.toFixed(1)}%`);
    if (mainWindow) {
      mainWindow.webContents.send('update-status', {
        status: 'downloading',
        progress: progressObj.percent
      });
    }
  });

  autoUpdater.on('update-downloaded', (info) => {
    console.log('✅ Mise à jour téléchargée:', info.version);
    if (mainWindow) {
      mainWindow.webContents.send('update-status', {
        status: 'downloaded',
        version: info.version
      });
    }

    // Proposer d'installer immédiatement
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Mise à jour prête',
      message: `La mise à jour vers la version ${info.version} est prête à être installée.`,
      detail: 'L\'application va redémarrer pour appliquer la mise à jour.',
      buttons: ['Installer maintenant', 'Plus tard'],
      defaultId: 0
    }).then((result) => {
      if (result.response === 0) {
        // IMPORTANT: Forcer la fermeture complète
        setImmediate(() => {
          app.isQuitting = true;
          autoUpdater.quitAndInstall(false, true);
        });
      }
    });
  });
}

// ===== IPC HANDLERS =====

// Vérifier manuellement les mises à jour
ipcMain.handle('check-for-updates', async () => {
  try {
    return await autoUpdater.checkForUpdates();
  } catch (error) {
    console.error('Erreur lors de la vérification des mises à jour:', error);
    throw error;
  }
});

// Installer la mise à jour manuellement
ipcMain.handle('install-update', async () => {
  app.isQuitting = true;
  autoUpdater.quitAndInstall(false, true);
});

// ===== APP LIFECYCLE =====

app.whenReady().then(() => {
  createMainWindow();
  setupAutoUpdater(); // Initialiser l'auto-updater
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});
```

---

## 🎨 Interface utilisateur

### Fichier preload.js (optionnel mais recommandé)

```javascript
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  invoke: (channel, data) => ipcRenderer.invoke(channel, data),
  on: (channel, callback) => ipcRenderer.on(channel, (event, ...args) => callback(event, ...args))
});
```

### Fichier renderer.js

```javascript
// Écouter les événements de mise à jour
window.electronAPI.on('update-status', (event, data) => {
  const statusElement = document.getElementById('updateStatus');
  const updateButton = document.getElementById('checkUpdateBtn');
  const installButton = document.getElementById('installUpdateBtn');
  const progressBar = document.getElementById('updateProgressBar');

  switch (data.status) {
    case 'checking':
      statusElement.textContent = 'Vérification des mises à jour...';
      break;

    case 'available':
      statusElement.textContent = `✅ Mise à jour disponible : v${data.version}`;
      break;

    case 'not-available':
      statusElement.textContent = `✅ Vous avez la dernière version`;
      break;

    case 'downloading':
      statusElement.textContent = `📥 Téléchargement : ${data.progress.toFixed(1)}%`;
      if (progressBar) {
        progressBar.style.width = data.progress + '%';
      }
      break;

    case 'downloaded':
      statusElement.textContent = `✅ Mise à jour prête : v${data.version}`;
      if (installButton) {
        installButton.style.display = 'inline-block';
      }
      break;

    case 'error':
      statusElement.textContent = `❌ Erreur: ${data.error}`;
      break;
  }
});

// Vérifier manuellement les mises à jour
async function checkForUpdates() {
  try {
    await window.electronAPI.invoke('check-for-updates');
  } catch (error) {
    console.error('Erreur:', error);
  }
}

// Installer la mise à jour
async function installUpdate() {
  try {
    await window.electronAPI.invoke('install-update');
  } catch (error) {
    console.error('Erreur installation:', error);
  }
}
```

### Fichier HTML (exemple)

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Mon Application</title>
</head>
<body>
  <h1>Mon Application</h1>

  <div id="updateSection">
    <h2>Mises à jour</h2>
    <p id="updateStatus">Vérification...</p>

    <button id="checkUpdateBtn" onclick="checkForUpdates()">
      🔍 Vérifier les mises à jour
    </button>

    <button id="installUpdateBtn" onclick="installUpdate()" style="display: none;">
      📥 Installer la mise à jour
    </button>

    <div id="updateProgress" style="display: none;">
      <div id="updateProgressBar" style="width: 0%; height: 20px; background: blue;"></div>
    </div>
  </div>

  <script src="renderer.js"></script>
</body>
</html>
```

---

## 🚀 Build et publication

### 1. Build l'application

**macOS :**
```bash
npm run dist-mac
```

**Windows :**
```bash
npm run dist-win
```

### 2. Renommer les fichiers (IMPORTANT)

Les fichiers générés ont des espaces dans le nom. Il faut les remplacer par des tirets :

```bash
# macOS
mv "dist/Mon Application-1.0.0-arm64-mac.zip" "dist/Mon-Application-1.0.0-arm64-mac.zip"

# Windows
mv "dist/Mon Application Setup 1.0.0.exe" "dist/Mon-Application-Setup-1.0.0.exe"
```

### 3. Créer un commit et un tag

```bash
git add .
git commit -m "Version 1.0.0"
git tag v1.0.0
git push
git push --tags
```

### 4. Créer une release GitHub

**Avec GitHub CLI (recommandé) :**

```bash
# macOS
gh release create v1.0.0 \
  --title "Version 1.0.0" \
  --notes "Description des changements" \
  "dist/Mon-Application-1.0.0-arm64-mac.zip" \
  "dist/latest-mac.yml"

# Windows
gh release create v1.0.0 \
  --title "Version 1.0.0" \
  --notes "Description des changements" \
  "dist/Mon-Application-Setup-1.0.0.exe" \
  "dist/latest.yml"

# IMPORTANT: Pour les gros fichiers (>50MB), utilisez un timeout de 10 minutes
# Ajoutez `timeout 600` avant la commande (macOS/Linux) :
timeout 600 gh release create v1.0.0 ...
```

**Manuellement via GitHub :**
1. Aller sur `https://github.com/votre-username/votre-repo/releases`
2. Cliquer sur "Create a new release"
3. Tag version : `v1.0.0` (doit correspondre à la version dans package.json)
4. Titre : "Version 1.0.0"
5. Description : Les changements de cette version
6. Uploader les fichiers :
   - Le fichier ZIP (macOS) ou EXE (Windows)
   - Le fichier `latest-mac.yml` (macOS) ou `latest.yml` (Windows)
7. Publier

---

## 🐛 Dépannage

### Erreur : "Code signature did not pass validation" (macOS)

**Cause :** Application non signée ou mal signée.

**Solution :**
1. Vérifier que vous avez un certificat Apple valide
2. Vérifier la configuration dans `package.json` :
   ```json
   "mac": {
     "identity": "Apple Distribution: Votre Entreprise (XXXXXXXXXX)",
     "hardenedRuntime": true,
     "entitlements": "build/entitlements.mac.plist"
   }
   ```
3. Vérifier que le fichier `build/entitlements.mac.plist` existe

### Erreur 404 lors du téléchargement

**Cause :** Le nom du fichier ne correspond pas entre `latest-mac.yml` et GitHub.

**Solution :**
1. Les noms de fichiers doivent utiliser des tirets, pas des espaces
2. Renommer les fichiers avant de les uploader
3. Le fichier `latest-mac.yml` doit pointer vers le bon nom

### L'application ne redémarre pas après l'update

**Cause :** `quitAndInstall()` mal configuré.

**Solution :**
```javascript
// Forcer la fermeture complète
setImmediate(() => {
  app.isQuitting = true;
  autoUpdater.quitAndInstall(false, true);
});
```

### L'auto-updater ne fonctionne pas en développement

**Cause :** Normal, l'auto-updater ne fonctionne que sur une application packagée.

**Solution :**
- Utiliser `npm run dist-mac` ou `npm run dist-win` pour tester
- Installer l'application buildée pour tester l'auto-update

### Erreur de certificat Windows

**Cause :** Windows SmartScreen bloque l'application non signée.

**Solution :**
- Option 1 : Acheter un certificat de signature de code Windows (~300€/an)
- Option 2 : Informer les utilisateurs qu'ils doivent cliquer sur "Plus d'infos" puis "Exécuter quand même"

---

## 📝 Checklist de déploiement

Avant chaque release :

- [ ] Incrémenter la version dans `package.json`
- [ ] Mettre à jour le numéro de version dans l'interface utilisateur
- [ ] Builder l'application (`npm run dist-mac` ou `npm run dist-win`)
- [ ] Renommer les fichiers (remplacer espaces par tirets)
- [ ] Créer un commit et un tag git
- [ ] Pusher le commit et le tag sur GitHub
- [ ] Créer une release GitHub avec les fichiers
- [ ] Vérifier que le fichier `latest-mac.yml` ou `latest.yml` est présent dans la release
- [ ] Tester l'auto-update depuis la version précédente

---

## 🎯 Workflow complet (exemple v1.0.0 → v1.0.1)

### 1. Développement
```bash
# Faire vos modifications
# Tester en local avec: npm start
```

### 2. Préparer la release
```bash
# Modifier package.json: "version": "1.0.1"
# Modifier l'UI pour afficher "v1.0.1"
```

### 3. Build
```bash
npm run dist-mac
# ou
npm run dist-win
```

### 4. Renommer
```bash
cd dist
mv "Mon Application-1.0.1-arm64-mac.zip" "Mon-Application-1.0.1-arm64-mac.zip"
mv "Mon Application-1.0.1-arm64-mac.zip.blockmap" "Mon-Application-1.0.1-arm64-mac.zip.blockmap"
cd ..
```

### 5. Commit et push
```bash
git add .
git commit -m "Version 1.0.1 - Description des changements"
git tag v1.0.1
git push
git push --tags
```

### 6. Créer la release
```bash
# Pour les gros fichiers, utilisez timeout 600 (10 minutes)
timeout 600 gh release create v1.0.1 \
  --title "Version 1.0.1" \
  --notes "- Fix bug X
- Amélioration Y
- Nouvelle fonctionnalité Z" \
  "dist/Mon-Application-1.0.1-arm64-mac.zip" \
  "dist/latest-mac.yml"
```

### 7. Test
- Lancer la version 1.0.0
- L'auto-updater devrait détecter la 1.0.1
- Installer et vérifier que ça fonctionne

---

## 📚 Ressources

- [Documentation electron-updater](https://www.electron.build/auto-update)
- [Documentation electron-builder](https://www.electron.build/)
- [Code Signing (macOS)](https://www.electron.build/code-signing)
- [GitHub Releases](https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases)

---

## ✅ Points clés à retenir

1. **macOS nécessite obligatoirement un certificat Apple** (99$/an)
2. **Utiliser le format ZIP pour macOS** (pas DMG) pour éviter les problèmes
3. **Renommer les fichiers** pour remplacer les espaces par des tirets
4. **Toujours uploader `latest-mac.yml` ou `latest.yml`** sur GitHub Release
5. **Le tag git doit correspondre** à la version dans package.json (ex: v1.0.0)
6. **La première installation** doit toujours être manuelle
7. **Utiliser `quitAndInstall(false, true)`** pour forcer l'installation

---

**Créé le 2 octobre 2025**
**Testé et validé sur Electron 38.2.0, electron-updater 6.6.2, electron-builder 26.0.12**
