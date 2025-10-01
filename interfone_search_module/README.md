# Module Interfone Auto Search pour Odoo 17

Ce module permet la recherche automatique de contacts dans Odoo lorsqu'un numéro de téléphone Interfone est passé en paramètre d'URL.

## Installation

1. **Copier le module** dans le répertoire addons de votre instance Odoo :
   ```bash
   cp -r interfone_search_module/ /path/to/your/odoo/addons/
   ```

2. **Redémarrer Odoo** pour charger le nouveau module :
   ```bash
   sudo systemctl restart odoo
   ```

3. **Activer le mode développeur** dans Odoo :
   - Aller dans Paramètres > Général
   - Activer le mode développeur

4. **Installer le module** :
   - Aller dans Applications
   - Rechercher "Interfone Auto Search"
   - Cliquer sur "Installer"

## Utilisation

Le module fonctionne automatiquement ! Quand vous accédez à une URL du type :

```
https://votre-odoo.com/web#action=424&model=res.partner&view_type=list&interfone_number=0494202552
```

Le module va :
1. Détecter le paramètre `interfone_number`
2. Effectuer automatiquement une recherche RPC dans les contacts
3. Afficher les résultats filtrés ou proposer de créer un nouveau contact

## Fonctionnement technique

Le module s'inspire du système `calendar_activity_widget` :
- **Surveillance d'URL** : Détecte les changements d'URL en temps réel
- **Services RPC** : Utilise les services internes d'Odoo pour la recherche
- **Actions automatiques** : Exécute `actionService.doAction()` pour afficher les résultats

## Logs de débogage

Pour voir les logs du module, ouvrez la console développeur (F12) :
- `🔍 [INTERFONE MODULE]` : Messages du module
- Les logs montrent chaque étape de la recherche automatique

## Compatibilité

- Odoo 17.0+
- Module `contacts` requis
- Fonctionne avec l'application Electron Interfone Odoo Connector