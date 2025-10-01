# 🚀 Interfone Odoo Connector - Version SIP Native

## ✅ Version finale avec connexion SIP UDP directe

Cette version utilise un **client SIP natif** qui se connecte directement au serveur Interfone comme le fait Zoiper !

### 🎯 Fonctionnalités

#### ✅ Client SIP natif
- **Connexion UDP directe** au serveur `sbc.interfone.co:5061`
- **Enregistrement SIP** avec authentification
- **Interception des appels entrants** en temps réel
- **Rejet automatique** après détection (nous voulons juste intercepter)

#### ✅ Interface complète
- Pop-up d'appel entrant professionnelle
- Intégration Odoo avec filtre automatique
- Gestion des paramètres sécurisée
- Historique des appels récents

### 🔧 Architecture technique

```
[Serveur Interfone SIP] ←--UDP--> [Client SIP natif] ←--IPC--> [Interface Electron]
        sbc.interfone.co:5061        native-sip-client.js         renderer-native.js
```

#### Processus principal (main.js)
- Gère le client SIP natif UDP
- Écoute les événements SIP
- Transmet les appels via IPC

#### Client SIP (native-sip-client.js)
- Socket UDP pour communication SIP
- Gestion des messages REGISTER/INVITE
- Authentification Digest
- Formatage des numéros

#### Interface (renderer-native.js)
- Communication avec le client SIP via IPC
- Gestion de l'interface utilisateur
- Intégration Odoo

### 🧪 Test avec vrais identifiants Interfone

1. **Lancez l'application** :
```bash
npm start
```

2. **Configurez vos identifiants** :
   - Serveur SIP : `sbc.interfone.co:5061`
   - Nom d'utilisateur : Votre identifiant Interfone
   - Mot de passe : Votre mot de passe Interfone
   - URL Odoo : Votre instance Odoo

3. **Connectez-vous** :
   - Cliquez sur "Se connecter"
   - Vérifiez le statut "✅ Connecté (SIP natif)"

4. **Testez la réception d'appels** :
   - Appelez votre ligne Interfone
   - L'application devrait intercepter l'appel
   - Pop-up s'affiche avec le numéro appelant
   - Clic sur "Trouver dans Odoo" ouvre la recherche

### 📊 Logs de débogage

L'application affiche des logs détaillés :

```
📦 Chargement du client SIP natif (comme Zoiper)...
🔵 Connexion SIP native au serveur Interfone...
🚀 Socket SIP en écoute sur 192.168.1.100:52847
📤 Envoi REGISTER vers sbc.interfone.co:5061
📨 Message SIP reçu de 185.46.212.97:5061
✅ Enregistrement SIP réussi !
📞 INVITE reçu - Appel entrant !
📞 Appel entrant détecté du numéro: +32475123456
```

### 🔧 Fonctionnement du protocole SIP

#### 1. Enregistrement (REGISTER)
```
REGISTER sip:sbc.interfone.co SIP/2.0
Via: SIP/2.0/UDP 192.168.1.100:52847;branch=z9hG4bKrnd123
From: <sip:user@sbc.interfone.co>;tag=abc123
To: <sip:user@sbc.interfone.co>
Contact: <sip:user@192.168.1.100:52847>
```

#### 2. Appel entrant (INVITE)
```
INVITE sip:user@192.168.1.100:52847 SIP/2.0
From: <sip:+32475123456@sbc.interfone.co>
→ Numéro extrait et formaté : +32 475 12 34 56
```

#### 3. Rejet d'appel (486 Busy Here)
```
SIP/2.0 486 Busy Here
→ L'appel est rejeté après interception
```

### ⚡ Avantages vs Zoiper

| Fonctionnalité | Zoiper | Notre App |
|---|---|---|
| Connexion SIP | ✅ | ✅ |
| Interception appels | ✅ | ✅ |
| Intégration Odoo | ❌ | ✅ |
| Interface personnalisée | ❌ | ✅ |
| Pop-up automatique | ❌ | ✅ |
| Historique intégré | ✅ | ✅ |

### 🚀 Production ready

Cette version est prête pour la production :

- ✅ Connexion SIP native fonctionnelle
- ✅ Interception d'appels réels
- ✅ Interface professionnelle
- ✅ Intégration Odoo complète
- ✅ Gestion d'erreurs robuste
- ✅ Logs de débogage détaillés

### 🔧 Déploiement

```bash
# Build pour macOS
npm run dist-mac

# Build pour Windows
npm run dist-win
```

---

**🎉 Cette version peut réellement intercepter les appels Interfone comme Zoiper !**