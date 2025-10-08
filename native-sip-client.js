// Client SIP natif pour se connecter directement au serveur Interfone SIP
const dgram = require('dgram');
const { EventEmitter } = require('events');
const os = require('os');
const crypto = require('crypto');

class NativeSIPClient extends EventEmitter {
  constructor() {
    super();
    this.socket = null;
    this.registered = false;
    this.config = null;
    this.callId = 1;
    this.branch = 'z9hG4bK' + Math.random().toString(36).substr(2, 10);
    this.tag = Math.random().toString(36).substr(2, 10);
    this.cseq = 1;
    this.registerTimer = null;
    this.keepAliveTimer = null;
    this.processedCallIds = new Set(); // Pour éviter les doublons d'appels
  }

  async connect(config) {

    this.config = config;

    return new Promise((resolve, reject) => {
      try {
        // Créer un socket UDP pour SIP
        this.socket = dgram.createSocket('udp4');

        this.socket.on('listening', () => {
          const address = this.socket.address();

          // Envoyer REGISTER pour s'authentifier
          this.sendRegister()
            .then(() => {
              resolve(true);
            })
            .catch(reject);
        });

        this.socket.on('message', (msg, rinfo) => {
          this.handleSIPMessage(msg.toString(), rinfo);
        });

        this.socket.on('error', (err) => {
          this.emit('error', err);
          reject(err);
        });

        // Écouter les événements pour résoudre la promesse
        this.once('registered', () => {
        });

        this.once('error', (err) => {
          reject(err);
        });

        // Timeout pour l'enregistrement
        const registrationTimeout = setTimeout(() => {
          if (!this.registered) {
            const error = new Error('Aucune réponse du serveur SIP. Vérifiez vos identifiants Interfone.');
            this.emit('error', error);
            reject(error);
          }
        }, 10000);

        // Annuler le timeout si on reçoit une réponse
        this.once('registered', () => {
          clearTimeout(registrationTimeout);
        });

        this.once('error', () => {
          clearTimeout(registrationTimeout);
        });

        // Bind sur un port local aléatoire
        this.socket.bind();

      } catch (error) {
        reject(error);
      }
    });
  }

  async sendRegister() {
    const [serverHost, serverPort] = this.config.sipServer.split(':');
    const port = serverPort || '5060';

    // Obtenir l'adresse IP locale réelle
    const localAddress = this.socket.address();
    const realLocalIP = this.getLocalIP();


    const contact = `<sip:${this.config.sipUsername}@${realLocalIP}:${localAddress.port}>`;

    // Utiliser le realm Interfone spécifique
    const realm = '3298632.interfone';

    const registerMessage = [
      `REGISTER sip:${realm} SIP/2.0`,
      `Via: SIP/2.0/UDP ${realLocalIP}:${localAddress.port};branch=${this.branch}`,
      `From: <sip:${this.config.sipUsername}@${realm}>;tag=${this.tag}`,
      `To: <sip:${this.config.sipUsername}@${realm}>`,
      `Call-ID: ${this.callId}@${realLocalIP}`,
      `CSeq: ${this.cseq} REGISTER`,
      `Contact: ${contact}`,
      `Max-Forwards: 70`,
      `User-Agent: Interfone-Odoo-Connector/1.0`,
      `Expires: 3600`,
      `Content-Length: 0`,
      '',
      ''
    ].join('\r\n');


    return new Promise((resolve, reject) => {
      this.socket.send(registerMessage, parseInt(port), serverHost, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  handleSIPMessage(message, rinfo) {
    const lines = message.split('\r\n');
    const firstLine = lines[0];

    // Logger tous les messages pour debugging
    console.log('🔍 Message SIP reçu:', firstLine);

    if (firstLine.includes('SIP/2.0 200 OK')) {
      if (message.includes('REGISTER')) {
        this.registered = true;

        // Démarrer les mécanismes de keep-alive après une registration réussie
        this.scheduleReRegister();
        this.startKeepAlive();

        this.emit('registered');
      } else {
        // 200 OK pour autre chose que REGISTER = potentiellement un appel décroché
        console.log('📞 200 OK reçu (possiblement appel décroché)');

        // Vérifier si c'est lié à notre appel en cours
        if (this.currentCall) {
          const callIdMatch = message.match(/Call-ID: (.+)/);
          const callId = callIdMatch ? callIdMatch[1].trim() : null;

          if (callId === this.currentCall.callId) {
            console.log('✅ 200 OK correspond à notre appel - Appel décroché');
            if (this.callTimeout) {
              clearTimeout(this.callTimeout);
              this.callTimeout = null;
            }
            this.emit('call-answered');
          }
        }
      }
    } else if (firstLine.includes('ACK sip:')) {
      // ACK reçu = quelqu'un a décroché l'appel
      console.log('📞 ACK reçu - L\'appel a été décroché');
      // Annuler le timeout
      if (this.callTimeout) {
        clearTimeout(this.callTimeout);
        this.callTimeout = null;
      }
      // Ne pas émettre call-answered ici car déjà fait avec 200 OK
      // Seulement s'il n'y a pas de currentCall (cas rare)
      if (!this.currentCall || !this.currentCall.answered) {
        this.emit('call-answered');
        if (this.currentCall) {
          this.currentCall.answered = true;
        }
      }
    } else if (firstLine.includes('SIP/2.0 401 Unauthorized') || firstLine.includes('SIP/2.0 407 Proxy Authentication Required')) {
      this.handleAuthentication(message, rinfo);
    } else if (firstLine.includes('INVITE sip:')) {
      this.handleIncomingCall(message, rinfo);
    } else if (firstLine.includes('BYE sip:')) {
      // L'appelant a raccroché
      console.log('📴 BYE reçu - L\'appelant a raccroché');
      // Annuler le timeout
      if (this.callTimeout) {
        clearTimeout(this.callTimeout);
        this.callTimeout = null;
      }
      this.emit('call-ended');
      this.sendOKResponse(message, rinfo);
    } else if (firstLine.includes('CANCEL sip:')) {
      // L'appel a été annulé
      console.log('🚫 CANCEL reçu - L\'appel a été annulé');
      // Annuler le timeout
      if (this.callTimeout) {
        clearTimeout(this.callTimeout);
        this.callTimeout = null;
      }
      this.emit('call-cancelled');
      this.sendOKResponse(message, rinfo);
    } else if (firstLine.includes('SIP/2.0 486') || firstLine.includes('SIP/2.0 603')) {
      // Busy ou Decline = quelqu'un a rejeté l'appel
      console.log('🔴 Appel rejeté/occupé');
      if (this.callTimeout) {
        clearTimeout(this.callTimeout);
        this.callTimeout = null;
      }
      this.emit('call-rejected');
    } else if (firstLine.includes('SIP/2.0 403 Forbidden')) {
      this.emit('error', new Error('Identifiants SIP incorrects'));
    } else if (firstLine.includes('SIP/2.0 404 Not Found')) {
      this.emit('error', new Error('Utilisateur SIP introuvable'));
    }
  }

  handleAuthentication(message, rinfo) {

    // Extraire le challenge WWW-Authenticate
    const authMatch = message.match(/WWW-Authenticate: Digest (.+)/);
    if (authMatch) {
      const authParams = this.parseAuthHeader(authMatch[1]);

      // Incrémenter CSeq pour la nouvelle tentative
      this.cseq++;

      // Envoyer un nouveau REGISTER avec authentification
      this.sendAuthenticatedRegister(authParams, rinfo)
        .then(() => {
        })
        .catch(err => {
          this.emit('error', err);
        });
    }
  }

  parseAuthHeader(authHeader) {
    const params = {};
    const regex = /(\w+)=("[^"]*"|[^,]*)/g;
    let match;

    while ((match = regex.exec(authHeader)) !== null) {
      const key = match[1];
      let value = match[2];
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      params[key] = value;
    }

    return params;
  }

  calculateDigestResponse(authParams, method = 'REGISTER') {
    const username = this.config.sipUsername;
    const password = this.config.sipPassword;
    const realm = authParams.realm;
    const nonce = authParams.nonce;
    const uri = `sip:3298632.interfone`; // Utiliser le realm Interfone

    // HA1 = MD5(username:realm:password)
    const ha1 = crypto.createHash('md5')
      .update(`${username}:${realm}:${password}`)
      .digest('hex');

    // HA2 = MD5(method:uri)
    const ha2 = crypto.createHash('md5')
      .update(`${method}:${uri}`)
      .digest('hex');

    // Response = MD5(HA1:nonce:HA2)
    const response = crypto.createHash('md5')
      .update(`${ha1}:${nonce}:${ha2}`)
      .digest('hex');


    return response;
  }

  async sendAuthenticatedRegister(authParams, rinfo) {
    const [serverHost, serverPort] = this.config.sipServer.split(':');
    const port = serverPort || '5060';

    const localAddress = this.socket.address();
    const realLocalIP = this.getLocalIP();

    const response = this.calculateDigestResponse(authParams);
    const realm = '3298632.interfone';
    const uri = `sip:${realm}`;

    // Créer l'en-tête Authorization
    const authHeader = [
      `Digest username="${this.config.sipUsername}"`,
      `realm="${authParams.realm}"`,
      `nonce="${authParams.nonce}"`,
      `uri="${uri}"`,
      `response="${response}"`,
      `algorithm=MD5`
    ].join(', ');

    const contact = `<sip:${this.config.sipUsername}@${realLocalIP}:${localAddress.port}>`;

    const registerMessage = [
      `REGISTER sip:${realm} SIP/2.0`,
      `Via: SIP/2.0/UDP ${realLocalIP}:${localAddress.port};branch=${this.branch}_auth`,
      `From: <sip:${this.config.sipUsername}@${realm}>;tag=${this.tag}`,
      `To: <sip:${this.config.sipUsername}@${realm}>`,
      `Call-ID: ${this.callId}@${realLocalIP}`,
      `CSeq: ${this.cseq} REGISTER`,
      `Contact: ${contact}`,
      `Authorization: ${authHeader}`,
      `Max-Forwards: 70`,
      `User-Agent: Interfone-Odoo-Connector/1.0`,
      `Expires: 3600`,
      `Content-Length: 0`,
      '',
      ''
    ].join('\r\n');


    return new Promise((resolve, reject) => {
      this.socket.send(registerMessage, parseInt(port), serverHost, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  handleIncomingCall(message, rinfo) {
    // Extraire le numéro appelant
    const fromMatch = message.match(/From: .*<sip:([^@]+)@/);
    const callerNumber = fromMatch ? fromMatch[1] : 'Numéro inconnu';

    // Extraire le Call-ID pour suivre cet appel
    const callIdMatch = message.match(/Call-ID: (.+)/);
    const callId = callIdMatch ? callIdMatch[1].trim() : null;

    // Vérifier si on a déjà traité cet appel (déduplication)
    if (callId && this.processedCallIds.has(callId)) {
      console.log('🔄 INVITE en double ignoré (Call-ID déjà traité)');
      // Envoyer quand même le "180 Ringing" pour maintenir la session
      this.sendRingingResponse(message, rinfo);
      return;
    }

    // Marquer cet appel comme traité
    if (callId) {
      this.processedCallIds.add(callId);

      // Nettoyer les vieux Call-IDs après 2 minutes pour éviter la saturation mémoire
      setTimeout(() => {
        this.processedCallIds.delete(callId);
      }, 120000);
    }

    // Annuler le timeout précédent s'il existe
    if (this.callTimeout) {
      clearTimeout(this.callTimeout);
    }

    // Stocker les infos de l'appel en cours
    this.currentCall = {
      callId: callId,
      callerNumber: callerNumber,
      message: message,
      rinfo: rinfo
    };

    // Formater le numéro comme Zoiper
    const formattedNumber = this.formatPhoneNumber(callerNumber);

    // Envoyer l'événement d'appel entrant (UNE SEULE FOIS)
    this.emit('incoming-call', formattedNumber);

    // Envoyer "180 Ringing" pour garder la session ouverte et observer l'appel
    this.sendRingingResponse(message, rinfo);

    // Timeout de 30 secondes : si rien ne se passe, rejeter l'appel
    this.callTimeout = setTimeout(() => {
      console.log('⏰ Timeout de sonnerie - Rejet de l\'appel');
      this.sendBusyHere(message, rinfo);
      this.emit('call-timeout');
      this.currentCall = null;
    }, 30000);
  }

  sendBusyHere(originalMessage, rinfo) {
    // Extraire les headers nécessaires pour la réponse
    const lines = originalMessage.split('\r\n');
    let via = '';
    let from = '';
    let to = '';
    let callId = '';
    let cseq = '';

    lines.forEach(line => {
      if (line.startsWith('Via:')) via = line;
      if (line.startsWith('From:')) from = line;
      if (line.startsWith('To:')) to = line;
      if (line.startsWith('Call-ID:')) callId = line;
      if (line.startsWith('CSeq:')) cseq = line;
    });

    // Ajouter un tag au To header s'il n'en a pas
    if (to && !to.includes('tag=')) {
      to += `;tag=${Math.random().toString(36).substr(2, 10)}`;
    }

    const busyResponse = [
      'SIP/2.0 486 Busy Here',
      via,
      from,
      to,
      callId,
      cseq,
      'User-Agent: Interfone-Odoo-Connector/1.0',
      'Content-Length: 0',
      '',
      ''
    ].join('\r\n');

    this.socket.send(busyResponse, rinfo.port, rinfo.address);
  }

  sendRingingResponse(originalMessage, rinfo) {
    // Extraire les headers nécessaires pour la réponse
    const lines = originalMessage.split('\r\n');
    let via = '';
    let from = '';
    let to = '';
    let callId = '';
    let cseq = '';

    lines.forEach(line => {
      if (line.startsWith('Via:')) via = line;
      if (line.startsWith('From:')) from = line;
      if (line.startsWith('To:')) to = line;
      if (line.startsWith('Call-ID:')) callId = line;
      if (line.startsWith('CSeq:')) cseq = line;
    });

    // Ajouter un tag au To header s'il n'en a pas
    if (to && !to.includes('tag=')) {
      to += `;tag=${Math.random().toString(36).substr(2, 10)}`;
    }

    const ringingResponse = [
      'SIP/2.0 180 Ringing',
      via,
      from,
      to,
      callId,
      cseq,
      'User-Agent: Interfone-Odoo-Connector/1.0',
      'Content-Length: 0',
      '',
      ''
    ].join('\r\n');

    this.socket.send(ringingResponse, rinfo.port, rinfo.address);
  }

  sendOKResponse(originalMessage, rinfo) {
    // Extraire les headers nécessaires pour la réponse
    const lines = originalMessage.split('\r\n');
    let via = '';
    let from = '';
    let to = '';
    let callId = '';
    let cseq = '';

    lines.forEach(line => {
      if (line.startsWith('Via:')) via = line;
      if (line.startsWith('From:')) from = line;
      if (line.startsWith('To:')) to = line;
      if (line.startsWith('Call-ID:')) callId = line;
      if (line.startsWith('CSeq:')) cseq = line;
    });

    // Ajouter un tag au To header s'il n'en a pas
    if (to && !to.includes('tag=')) {
      to += `;tag=${Math.random().toString(36).substr(2, 10)}`;
    }

    const okResponse = [
      'SIP/2.0 200 OK',
      via,
      from,
      to,
      callId,
      cseq,
      'User-Agent: Interfone-Odoo-Connector/1.0',
      'Content-Length: 0',
      '',
      ''
    ].join('\r\n');

    this.socket.send(okResponse, rinfo.port, rinfo.address);
  }

  formatPhoneNumber(number) {
    // Nettoyer le numéro
    let cleanNumber = number.replace(/[^\d\+]/g, '');

    // Gérer les préfixes internationaux
    if (cleanNumber.startsWith('00')) {
      cleanNumber = '+' + cleanNumber.substring(2);
    }

    // Formater selon le pays
    if (cleanNumber.startsWith('+32')) {
      const localNumber = cleanNumber.substring(3);
      if (localNumber.length === 9) {
        return `+32 ${localNumber.substring(0, 3)} ${localNumber.substring(3, 5)} ${localNumber.substring(5, 7)} ${localNumber.substring(7)}`;
      }
    }

    if (cleanNumber.startsWith('+33')) {
      const localNumber = cleanNumber.substring(3);
      if (localNumber.length === 9) {
        return `+33 ${localNumber.substring(0, 1)} ${localNumber.substring(1, 3)} ${localNumber.substring(3, 5)} ${localNumber.substring(5, 7)} ${localNumber.substring(7)}`;
      }
    }

    return cleanNumber;
  }

  async disconnect() {

    // Nettoyer les timers de keep-alive
    if (this.registerTimer) {
      clearInterval(this.registerTimer);
      this.registerTimer = null;
      console.log('⏰ Timer de re-REGISTER arrêté');
    }

    if (this.keepAliveTimer) {
      clearInterval(this.keepAliveTimer);
      this.keepAliveTimer = null;
      console.log('💓 Timer de keep-alive arrêté');
    }

    // Nettoyer le timeout d'appel s'il existe
    if (this.callTimeout) {
      clearTimeout(this.callTimeout);
      this.callTimeout = null;
      console.log('⏰ Timeout d\'appel arrêté');
    }

    // Fermer proprement le socket UDP
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.close();
      this.socket = null;
      console.log('🔌 Socket UDP fermé');
    }

    // Nettoyer les données
    this.registered = false;
    this.currentCall = null;
    this.processedCallIds.clear();

    this.emit('disconnected');
  }

  // Méthode pour simuler un appel entrant (pour tests)
  simulateIncomingCall() {
    const testNumber = '0494202552';

    const formattedNumber = this.formatPhoneNumber(testNumber);
    this.emit('incoming-call', formattedNumber);
  }

  // Méthode pour démarrer un mode de test qui simule des appels périodiques
  startTestMode() {

    this.testInterval = setInterval(() => {
      if (this.registered) {
        this.simulateIncomingCall();
      }
    }, 30000);

    // Premier appel de test dans 5 secondes
    setTimeout(() => {
      if (this.registered) {
        this.simulateIncomingCall();
      }
    }, 5000);
  }

  stopTestMode() {
    if (this.testInterval) {
      clearInterval(this.testInterval);
      this.testInterval = null;
    }
  }

  isConnected() {
    return this.registered;
  }

  // Obtenir l'adresse IP locale réelle (pas 0.0.0.0)
  getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        // Ignorer les adresses de loopback et IPv6
        if (iface.family === 'IPv4' && !iface.internal) {
          return iface.address;
        }
      }
    }
    return '127.0.0.1'; // Fallback
  }

  // Planifier un re-REGISTER périodique pour maintenir l'enregistrement
  scheduleReRegister() {
    // Nettoyer le timer précédent s'il existe
    if (this.registerTimer) {
      clearInterval(this.registerTimer);
    }

    // Re-REGISTER toutes les 30 minutes (avant expiration de 1h)
    this.registerTimer = setInterval(async () => {
      if (this.registered && this.config) {
        console.log('🔄 Re-REGISTER automatique pour maintenir la connexion...');

        try {
          // Incrémenter le CSeq pour le nouveau REGISTER
          this.cseq++;

          // Si on a déjà les paramètres d'auth (probable après la première connexion)
          // On pourrait les stocker, mais pour simplifier, on refait un REGISTER simple
          // Le serveur renverra un 401 et on s'authentifiera
          await this.sendRegister();
        } catch (error) {
          console.error('❌ Erreur lors du re-REGISTER:', error);
          // En cas d'erreur, émettre un événement de déconnexion
          this.registered = false;
          this.emit('disconnected');
        }
      }
    }, 30 * 60 * 1000); // 30 minutes

    console.log('⏰ Re-REGISTER planifié toutes les 30 minutes');
  }

  // Démarrer le keep-alive pour maintenir le mapping NAT ouvert
  startKeepAlive() {
    // Nettoyer le timer précédent s'il existe
    if (this.keepAliveTimer) {
      clearInterval(this.keepAliveTimer);
    }

    // Envoyer un OPTIONS toutes les 30 secondes
    this.keepAliveTimer = setInterval(() => {
      if (this.registered && this.socket) {
        this.sendKeepAlive();
      }
    }, 30 * 1000); // 30 secondes

    console.log('💓 Keep-alive démarré (OPTIONS toutes les 30s)');
  }

  // Envoyer un message OPTIONS pour garder le NAT ouvert
  sendKeepAlive() {
    const [serverHost, serverPort] = this.config.sipServer.split(':');
    const port = serverPort || '5060';
    const localAddress = this.socket.address();
    const realLocalIP = this.getLocalIP();
    const realm = '3298632.interfone';

    // Générer un nouveau branch pour ce message
    const keepAliveBranch = 'z9hG4bK' + Math.random().toString(36).substr(2, 10);

    const optionsMessage = [
      `OPTIONS sip:${realm} SIP/2.0`,
      `Via: SIP/2.0/UDP ${realLocalIP}:${localAddress.port};branch=${keepAliveBranch}`,
      `From: <sip:${this.config.sipUsername}@${realm}>;tag=${this.tag}`,
      `To: <sip:${realm}>`,
      `Call-ID: ${this.callId}@${realLocalIP}`,
      `CSeq: ${this.cseq} OPTIONS`,
      `Max-Forwards: 70`,
      `User-Agent: Interfone-Odoo-Connector/1.0`,
      `Content-Length: 0`,
      '',
      ''
    ].join('\r\n');

    this.socket.send(optionsMessage, parseInt(port), serverHost, (err) => {
      if (err) {
        console.error('❌ Erreur envoi keep-alive:', err);
      } else {
        console.log('💓 Keep-alive envoyé (OPTIONS)');
      }
    });

    // Incrémenter CSeq pour le prochain message
    this.cseq++;
  }
}

module.exports = NativeSIPClient;