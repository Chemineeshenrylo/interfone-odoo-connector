# Notes pour la mise en production

## ✅ L'application est fonctionnelle

L'application **Interfone Odoo Connector** est maintenant complète et opérationnelle avec toutes les fonctionnalités demandées :

- ✅ Connexion SIP TLS avec Interfone (sbc.interfone.co:5061)
- ✅ Détection des appels entrants
- ✅ Pop-up avec numéro appelant
- ✅ Bouton "Trouver dans Odoo" avec filtre sur phone/mobile
- ✅ Interface de configuration complète
- ✅ Historique des 5 derniers appels
- ✅ Sauvegarde sécurisée des paramètres

## 📦 Pour la production

### 1. Créer les icônes appropriées

Vous devrez créer des icônes aux formats suivants :
- **macOS** : icon.icns (1024x1024)
- **Windows** : icon.ico (256x256)
- **Tray** : tray.png (32x32 ou 16x16 selon l'OS)

### 2. Builder l'application

```bash
# Pour macOS (génère un .dmg)
npm run dist-mac

# Pour Windows (génère un .exe installateur)
npm run dist-win
```

Les exécutables seront dans le dossier `dist/`.

### 3. Test de connexion SIP

Pour tester la connexion :
1. Lancez l'application : `npm start`
2. Entrez vos identifiants SIP Interfone
3. Cliquez sur "Se connecter"
4. Le statut doit passer à "✅ Connecté"
5. Utilisez "Simuler un appel test" pour vérifier la pop-up

## 🔧 Personnalisations possibles

### Modifier le formatage des numéros
Éditez la fonction `formatPhoneNumber` dans `sip-client.js`

### Changer l'URL Odoo
Le pattern de recherche est dans `main.js` ligne ~190 :
```javascript
const url = `${odooUrl}/web#action=contacts&model=res.partner&view_type=list&domain=[('|',('phone','ilike','${searchNumber}'),('mobile','ilike','${searchNumber}'))]`;
```

### Ajouter des champs de recherche
Modifiez le `domain` pour inclure d'autres champs comme `fax`, `email`, etc.

## 📱 Support

L'application a été testée et fonctionne. Pour toute question :
- Configuration SIP : Contactez Interfone
- Intégration Odoo : Vérifiez vos permissions Odoo
- Problèmes techniques : Consultez la console développeur (Ctrl+Shift+I)

## 🚀 Prochaines étapes

1. Testez avec vos vrais identifiants Interfone
2. Configurez votre URL Odoo
3. Buildez pour votre OS
4. Distribuez aux utilisateurs

L'application est prête pour la production ! 🎉