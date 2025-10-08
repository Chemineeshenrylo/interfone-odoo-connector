class SIPClient {
  constructor() {
    this.userAgent = null;
    this.registerer = null;
    this.connected = false;
    this.onIncomingCall = null;
    this.onStatusChange = null;
  }

  async connect(config) {
    try {
      // Vérifier que SIP est chargé
      if (!window.SIP) {
        throw new Error('SIP.js n\'est pas chargé. Veuillez réessayer.');
      }

      const { UserAgent, Registerer } = window.SIP;

      const sipUri = `sip:${config.sipUsername}@${config.sipServer.split(':')[0]}`;
      const wsUri = `wss://${config.sipServer}/ws`;

      const userAgentOptions = {
        uri: sipUri,
        transportOptions: {
          server: wsUri,
          connectionTimeout: 30,
          traceSip: true,
          wsServers: [wsUri]
        },
        authorizationUsername: config.sipUsername,
        authorizationPassword: config.sipPassword,
        displayName: config.sipUsername,
        register: true,
        registerOptions: {
          expires: 3600
        },
        sessionDescriptionHandlerFactoryOptions: {
          constraints: {
            audio: true,
            video: false
          }
        },
        logLevel: 'debug'
      };

      this.userAgent = new UserAgent(userAgentOptions);

      this.registerer = new Registerer(this.userAgent);

      this.userAgent.delegate = {
        onInvite: (invitation) => {
          const remoteUri = invitation.remoteIdentity.uri.toString();
          const callerNumber = this.extractPhoneNumber(remoteUri);

          console.log('Appel entrant de:', callerNumber);

          if (this.onIncomingCall) {
            this.onIncomingCall(callerNumber);
          }

          invitation.reject();
        }
      };

      this.registerer.stateChange.on((state) => {
        console.log('État SIP:', state);

        switch (state) {
          case 'Registered':
            this.connected = true;
            if (this.onStatusChange) {
              this.onStatusChange(true);
            }
            break;
          case 'Unregistered':
          case 'Terminated':
            this.connected = false;
            if (this.onStatusChange) {
              this.onStatusChange(false);
            }
            break;
        }
      });

      await this.userAgent.start();

      await this.registerer.register();

      return true;
    } catch (error) {
      console.error('Erreur connexion SIP:', error);
      this.connected = false;
      if (this.onStatusChange) {
        this.onStatusChange(false);
      }
      throw error;
    }
  }

  async disconnect() {
    try {
      if (this.registerer) {
        await this.registerer.unregister();
      }
      if (this.userAgent) {
        await this.userAgent.stop();
      }
      this.connected = false;
      if (this.onStatusChange) {
        this.onStatusChange(false);
      }
    } catch (error) {
      console.error('Erreur déconnexion SIP:', error);
    }
  }

  extractPhoneNumber(sipUri) {
    const match = sipUri.match(/sip:([^@]+)@/);
    if (match && match[1]) {
      let number = match[1];

      if (number.startsWith('00')) {
        number = '+' + number.substring(2);
      }

      if (number.match(/^\d{9,}$/) && !number.startsWith('+')) {
        if (number.startsWith('0')) {
          number = '+32' + number.substring(1);
        } else {
          number = '+' + number;
        }
      }

      return this.formatPhoneNumber(number);
    }
    return 'Numéro inconnu';
  }

  formatPhoneNumber(number) {
    if (number.startsWith('+32')) {
      const localNumber = number.substring(3);
      if (localNumber.length === 9) {
        return `+32 ${localNumber.substring(0, 3)} ${localNumber.substring(3, 5)} ${localNumber.substring(5, 7)} ${localNumber.substring(7)}`;
      }
    }

    if (number.startsWith('+33')) {
      const localNumber = number.substring(3);
      if (localNumber.length === 9) {
        return `+33 ${localNumber.substring(0, 1)} ${localNumber.substring(1, 3)} ${localNumber.substring(3, 5)} ${localNumber.substring(5, 7)} ${localNumber.substring(7)}`;
      }
    }

    return number;
  }

  isConnected() {
    return this.connected;
  }
}