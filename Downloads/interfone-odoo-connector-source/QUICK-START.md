# 🚀 Quick Start - Interfone Odoo Connector

Guide rapide pour démarrer avec le projet.

## 📦 Deux façons de publier une release

### ⭐ Méthode 1 : GitHub Actions (RECOMMANDÉE)

**Avantages :**
- ✅ Build automatique Windows + macOS
- ✅ Pas besoin d'avoir les deux OS
- ✅ Publié directement sur GitHub
- ✅ Gratuit et rapide (~10 min)

**Procédure :**

```bash
# 1. Mettre à jour la version
# Éditer package.json et settings.html

# 2. Commit et tag
git add package.json settings.html
git commit -m "Version 1.5.7 - Description"
git tag v1.5.7
git push origin master
git push origin v1.5.7

# 3. C'est tout ! GitHub Actions fait le reste
```

📖 Voir **GITHUB-ACTIONS-GUIDE.md** pour les détails

---

### 🖥️ Méthode 2 : Build Local

**Quand l'utiliser :**
- Pour tester avant de publier
- Si GitHub Actions ne fonctionne pas

**Procédure :**

```bash
# 1. Installer les dépendances
npm install

# 2. Builder
npm run dist-win    # Windows
npm run dist-mac    # macOS

# 3. Publier manuellement sur GitHub
gh release create v1.5.7 \
  --title "Version 1.5.7" \
  --notes "Description" \
  "dist/Interfone-Odoo-Connector-Setup-1.5.7.exe" \
  "dist/latest.yml"
```

📖 Voir **README-BUILD.md** pour les détails

---

## 📁 Fichiers importants

### Pour GitHub Actions
- `.github/workflows/release.yml` - Build automatique sur tag
- `.github/workflows/manual-release.yml` - Build manuel depuis GitHub

### Pour le build local
- `package.json` - Configuration et version
- `main.js` - Code principal
- `settings.html` - Interface utilisateur
- `build/` - Scripts de build Windows/macOS
- `assets/` - Icônes

### Documentation
- `README-BUILD.md` - Guide complet de build
- `GITHUB-ACTIONS-GUIDE.md` - Guide GitHub Actions
- `AUTOUPDATER_GUIDE.md` - Guide auto-updater

---

## ⚡ Commandes essentielles

```bash
# Installer les dépendances
npm install

# Lancer en développement
npm start

# Builder Windows
npm run dist-win

# Builder macOS
npm run dist-mac

# Créer un tag et pusher
git tag v1.5.7
git push origin v1.5.7
```

---

## 🎯 Workflow recommandé

1. **Développer et tester** → `npm start`
2. **Mettre à jour la version** → Éditer package.json et settings.html
3. **Commit** → `git commit -m "Version 1.5.7"`
4. **Tag** → `git tag v1.5.7`
5. **Push** → `git push origin master && git push origin v1.5.7`
6. **Attendre** → GitHub Actions build et publie (10 min)
7. **Tester** → Installer et tester l'auto-updater

---

## 📚 Besoin d'aide ?

- **Build local** → README-BUILD.md
- **GitHub Actions** → GITHUB-ACTIONS-GUIDE.md
- **Auto-updater** → AUTOUPDATER_GUIDE.md
- **Mise à jour** → UPDATE_GUIDE.md

---

**Version actuelle** : 1.5.7
**Dernière mise à jour** : 8 octobre 2025
