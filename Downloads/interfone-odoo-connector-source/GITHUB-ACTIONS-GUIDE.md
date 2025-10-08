# Guide GitHub Actions - Build et Release Automatiques

Ce guide explique comment configurer GitHub Actions pour builder et publier automatiquement vos releases.

## 📋 Vue d'ensemble

Deux workflows ont été configurés :

1. **`release.yml`** - Build automatique quand vous créez un tag
2. **`manual-release.yml`** - Build manuel depuis l'interface GitHub

## 🚀 Méthode 1 : Release automatique avec tag (Recommandée)

### Utilisation

1. **Mettre à jour la version localement**
   ```bash
   # Éditer package.json et settings.html
   # Mettre la version à 1.5.7 par exemple
   ```

2. **Commit les changements**
   ```bash
   git add package.json settings.html
   git commit -m "Version 1.5.7 - Description des changements"
   ```

3. **Créer et pusher le tag**
   ```bash
   git tag v1.5.7
   git push origin master
   git push origin v1.5.7
   ```

4. **GitHub Actions s'active automatiquement !**
   - Build Windows sur une machine Windows
   - Build macOS sur une machine macOS
   - Crée automatiquement la release avec tous les fichiers
   - Publie `latest.yml` et `latest-mac.yml` pour l'auto-updater

### Avantages

✅ Pas besoin d'avoir Windows ET macOS
✅ Build reproductible et automatique
✅ Publié directement sur GitHub Releases
✅ Auto-updater fonctionne immédiatement

## 🎯 Méthode 2 : Release manuelle depuis GitHub

### Utilisation

1. **Aller sur GitHub**
   - Allez sur votre repo : `https://github.com/Chemineeshenrylo/interfone-odoo-connector`
   - Cliquez sur "Actions"

2. **Lancer le workflow manuel**
   - Sélectionnez "Manual Release"
   - Cliquez sur "Run workflow"
   - Entrez le numéro de version (ex: `1.5.7`)
   - Entrez les notes de release (optionnel)
   - Cliquez sur "Run workflow"

3. **Attendez la fin du build**
   - Le workflow prend ~10-15 minutes
   - Vous verrez la progression dans "Actions"

4. **Release créée automatiquement**
   - Aller dans "Releases"
   - La nouvelle version est publiée avec tous les fichiers

### Avantages

✅ Aucune commande locale nécessaire
✅ Peut être fait depuis n'importe quel ordinateur
✅ Interface graphique simple

## 📦 Ce qui est buildé automatiquement

### Windows
- `Interfone-Odoo-Connector-Setup-X.X.X.exe` - Installateur NSIS
- `latest.yml` - Métadonnées pour l'auto-updater

### macOS
- `Interfone-Odoo-Connector-X.X.X-arm64-mac.zip` - Application signée
- `latest-mac.yml` - Métadonnées pour l'auto-updater

## 🔧 Configuration initiale (une seule fois)

### 1. Activer GitHub Actions

GitHub Actions est activé par défaut. Vérifiez simplement que :
- Le repo est public (ou vous avez GitHub Pro pour les repos privés)
- Les workflows sont dans `.github/workflows/`

### 2. Permissions GitHub Actions

1. Allez dans **Settings** → **Actions** → **General**
2. Dans "Workflow permissions", sélectionnez :
   - ✅ **Read and write permissions**
   - ✅ **Allow GitHub Actions to create and approve pull requests**
3. Cliquez sur "Save"

### 3. (Optionnel) Signature macOS

Pour signer l'application macOS (fortement recommandé) :

1. **Obtenir un certificat Apple Developer**
   - Compte Apple Developer requis (99$/an)
   - Créer un certificat "Developer ID Application"

2. **Exporter le certificat en base64**
   ```bash
   # Sur macOS
   security find-identity -v -p codesigning
   security export -t identities -f p12 -o certificate.p12
   base64 -i certificate.p12 -o certificate.base64.txt
   ```

3. **Ajouter les secrets GitHub**
   - Allez dans **Settings** → **Secrets and variables** → **Actions**
   - Cliquez sur "New repository secret"
   - Ajoutez :
     - `MAC_CERT_BASE64` : Le contenu de certificate.base64.txt
     - `MAC_CERT_PASSWORD` : Le mot de passe du certificat

4. **Décommenter dans release.yml**
   ```yaml
   env:
     CSC_LINK: ${{ secrets.MAC_CERT_BASE64 }}
     CSC_KEY_PASSWORD: ${{ secrets.MAC_CERT_PASSWORD }}
     # CSC_IDENTITY_AUTO_DISCOVERY: false  # Commenter cette ligne
   ```

## 📊 Workflow en détail

### release.yml (Automatique sur tag)

```yaml
on:
  push:
    tags:
      - 'v*'  # Se déclenche sur v1.5.7, v2.0.0, etc.
```

**Étapes :**
1. Checkout du code
2. Installation de Node.js 18
3. `npm install` pour les dépendances
4. Build Windows/macOS en parallèle
5. Upload des artifacts
6. Création de la release GitHub

**Durée totale** : ~10-15 minutes

### manual-release.yml (Manuel)

**Étapes supplémentaires :**
1. Met à jour `package.json` avec la version
2. Crée le tag automatiquement
3. Build et publie comme release.yml

## 🐛 Résolution de problèmes

### ❌ "Workflow file is invalid"

**Cause** : Erreur de syntaxe YAML

**Solution** :
1. Vérifiez l'indentation (2 espaces)
2. Utilisez un validateur YAML en ligne
3. Vérifiez que tous les secrets existent

### ❌ "Permission denied"

**Cause** : GitHub Actions n'a pas les permissions

**Solution** :
1. Allez dans Settings → Actions → General
2. Activez "Read and write permissions"
3. Sauvegardez et relancez le workflow

### ❌ "Build failed on macOS"

**Cause** : Problème de signature de code

**Solution** :
1. Si vous n'avez pas de certificat, laissez `CSC_IDENTITY_AUTO_DISCOVERY: false`
2. L'app sera non signée (fonctionne mais SmartScreen peut alerter)

### ❌ "Node modules not found"

**Cause** : `npm install` a échoué

**Solution** :
1. Vérifiez que `package.json` et `package-lock.json` sont dans le repo
2. Relancez le workflow

## 📝 Exemple de workflow complet

### Scénario : Publier la version 1.5.7

**Option A - Automatique (Recommandée)**

```bash
# 1. Mettre à jour les fichiers
# Éditer package.json : "version": "1.5.7"
# Éditer settings.html : Version: 1.5.7

# 2. Commit et tag
git add package.json settings.html
git commit -m "Version 1.5.7 - Nouvelles fonctionnalités"
git tag v1.5.7
git push origin master
git push origin v1.5.7

# 3. Attendre ~10 minutes
# 4. Vérifier la release sur GitHub
```

**Option B - Manuel**

```
1. Aller sur GitHub → Actions
2. Cliquer "Manual Release"
3. Version: 1.5.7
4. Notes: "Nouvelles fonctionnalités..."
5. Run workflow
6. Attendre ~10 minutes
7. Vérifier la release
```

## ✅ Checklist

Avant de pusher un tag :

- [ ] Version mise à jour dans `package.json`
- [ ] Version mise à jour dans `settings.html`
- [ ] Fichiers `.github/workflows/` présents dans le repo
- [ ] Permissions GitHub Actions activées
- [ ] Tag créé avec `git tag vX.X.X`
- [ ] Tag pushé avec `git push origin vX.X.X`

## 🔗 Ressources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [electron-builder CI Configuration](https://www.electron.build/configuration/publish#github-repository)
- [Code Signing for macOS](https://www.electron.build/code-signing)

## 💡 Avantages de GitHub Actions

1. **Multi-plateforme** : Build Windows + macOS sans avoir les deux OS
2. **Automatique** : Un simple `git push --tags` suffit
3. **Gratuit** : GitHub Actions est gratuit pour les repos publics
4. **Reproductible** : Même environnement à chaque build
5. **Pas de setup local** : Pas besoin d'installer electron-builder localement

---

**Note** : Une fois configuré, vous n'avez plus besoin de lancer `npm run dist-win` ou `npm run dist-mac` localement. GitHub Actions s'en charge !
