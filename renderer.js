// Ce fichier gère la logique côté rendu (browser)
console.log('📦 Chargement du client SIP simplifié...');

// Charger le client SIP simplifié pour la démo
class SIPClient {
  constructor() {
    this.connected = false;
    this.onIncomingCall = null;
    this.onStatusChange = null;
    this.simulationInterval = null;
    this.config = null;
  }

  async connect(config) {
    console.log('🔵 Mode démo - Simulation connexion SIP Interfone...');
    console.log('📋 Configuration:', {
      sipUsername: config.sipUsername,
      sipServer: config.sipServer,
      note: '⚠️ Mode démo - Les appels seront simulés'
    });

    try {
      this.config = config;

      // Simuler une connexion réussie après 1 seconde
      return new Promise((resolve) => {
        setTimeout(() => {
          this.connected = true;
          console.log('✅ Mode démo activé - Prêt à simuler des appels SIP');
          console.log('💡 Utilisez "Simuler un appel test" pour tester la pop-up');

          if (this.onStatusChange) {
            this.onStatusChange(true);
          }

          // Démarrer la simulation d'appels aléatoires (optionnel)
          this.startCallSimulation();
          resolve(true);
        }, 1000);
      });
    } catch (error) {
      console.error('💥 Erreur de connexion:', error);
      this.connected = false;
      if (this.onStatusChange) {
        this.onStatusChange(false);
      }
      throw error;
    }
  }

  async disconnect() {
    console.log('🔌 Déconnexion du mode démo...');
    this.connected = false;
    this.stopCallSimulation();

    if (this.onStatusChange) {
      this.onStatusChange(false);
    }
  }

  startCallSimulation() {
    // Simuler des appels entrants de temps en temps (pour démo)
    this.simulationInterval = setInterval(() => {
      if (this.connected && Math.random() > 0.85) { // 15% de chance à chaque cycle
        this.simulateIncomingCall();
      }
    }, 60000); // Toutes les 60 secondes
  }

  stopCallSimulation() {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
  }

  simulateIncomingCall() {
    const testNumbers = [
      '+32 475 12 34 56',
      '+33 1 42 34 56 78',
      '+32 2 123 45 67',
      '+33 6 78 90 12 34',
      '+32 486 78 90 12',
      '+32 9 234 56 78'
    ];

    const randomNumber = testNumbers[Math.floor(Math.random() * testNumbers.length)];
    console.log('📞 Simulation d\'appel entrant automatique:', randomNumber);

    if (this.onIncomingCall) {
      this.onIncomingCall(randomNumber);
    }
  }

  // Méthode pour tester manuellement
  testCall() {
    if (this.connected) {
      this.simulateIncomingCall();
    }
  }

  isConnected() {
    return this.connected;
  }
}

// Code spécifique à settings.html
if (window.location.pathname.includes('settings.html')) {
  console.log('🌐 Page settings.html chargée');
  console.log('📍 Chemin actuel:', window.location.pathname);

  let sipClient = new SIPClient();
  let currentSettings = {};

  console.log('🔧 SIPClient créé:', sipClient);

  sipClient.onStatusChange = (connected) => {
    updateStatus(connected);
    if (connected) {
      window.electronAPI.sendSipConnected();
    } else {
      window.electronAPI.sendSipDisconnected();
    }
  };

  sipClient.onIncomingCall = (callerNumber) => {
    window.electronAPI.sendIncomingCall(callerNumber);
  };

  async function loadSettings() {
    currentSettings = await window.electronAPI.getSettings();

    if (currentSettings.sipUsername) {
      document.getElementById('sipUsername').value = currentSettings.sipUsername;
    }
    if (currentSettings.sipPassword) {
      document.getElementById('sipPassword').value = currentSettings.sipPassword;
    }
    if (currentSettings.sipServer) {
      document.getElementById('sipServer').value = currentSettings.sipServer;
    }
    if (currentSettings.odooUrl) {
      document.getElementById('odooUrl').value = currentSettings.odooUrl;
    }
  }

  window.saveSettings = async function() {
    const settings = {
      sipUsername: document.getElementById('sipUsername').value,
      sipPassword: document.getElementById('sipPassword').value,
      sipServer: document.getElementById('sipServer').value || 'sbc.interfone.co:5061',
      odooUrl: document.getElementById('odooUrl').value
    };

    if (!settings.sipUsername || !settings.sipPassword) {
      showAlert('Veuillez remplir les identifiants SIP', 'error');
      return;
    }

    if (!settings.odooUrl) {
      showAlert('Veuillez remplir l\'URL Odoo', 'error');
      return;
    }

    currentSettings = settings;
    await window.electronAPI.saveSettings(settings);
    showAlert('Paramètres sauvegardés avec succès', 'success');
  }

  window.toggleConnection = async function() {
    console.log('🎯 toggleConnection appelée');
    const btn = document.getElementById('connectBtn');
    const loader = document.getElementById('loader');

    console.log('🔍 Statut actuel:', sipClient.isConnected());

    if (sipClient.isConnected()) {
      btn.disabled = true;
      await sipClient.disconnect();
      btn.disabled = false;
      btn.textContent = 'Se connecter';
      showAlert('Déconnecté du serveur SIP', 'success');
    } else {
      const settings = {
        sipUsername: document.getElementById('sipUsername').value,
        sipPassword: document.getElementById('sipPassword').value,
        sipServer: document.getElementById('sipServer').value || 'sbc.interfone.co:5061'
      };

      if (!settings.sipUsername || !settings.sipPassword) {
        showAlert('Veuillez remplir les identifiants SIP', 'error');
        return;
      }

      btn.disabled = true;
      loader.classList.add('show');

      console.log('🔧 Tentative de connexion avec:', settings);

      try {
        console.log('⏳ Appel de sipClient.connect...');
        await sipClient.connect(settings);
        console.log('✅ Connexion SIP réussie');
        btn.textContent = 'Se déconnecter';
        showAlert('Connecté au serveur SIP', 'success');
      } catch (error) {
        console.error('❌ Échec connexion SIP:', error);
        showAlert('Erreur de connexion: ' + error.message, 'error');
      } finally {
        btn.disabled = false;
        loader.classList.remove('show');
        console.log('🏁 Fin de toggleConnection');
      }
    }
  }

  window.testConnection = async function() {
    await saveSettings();

    if (!sipClient.isConnected()) {
      await toggleConnection();
    }

    if (sipClient.isConnected()) {
      simulateCall();
    }
  }

  window.simulateCall = function() {
    const testNumber = '+32 475 12 34 56';
    window.electronAPI.sendIncomingCall(testNumber);
    showAlert('Appel test envoyé: ' + testNumber, 'success');
  }

  function updateStatus(connected) {
    const status = document.getElementById('status');
    const connectBtn = document.getElementById('connectBtn');

    if (connected) {
      status.textContent = '✅ Connecté';
      status.className = 'status connected';
      connectBtn.textContent = 'Se déconnecter';
      enableFormFields(false);
    } else {
      status.textContent = '❌ Déconnecté';
      status.className = 'status disconnected';
      connectBtn.textContent = 'Se connecter';
      enableFormFields(true);
    }
  }

  function enableFormFields(enabled) {
    document.getElementById('sipUsername').disabled = !enabled;
    document.getElementById('sipPassword').disabled = !enabled;
    document.getElementById('sipServer').disabled = !enabled;
  }

  window.showAlert = function(message, type) {
    const alert = document.getElementById('alert');
    alert.textContent = message;
    alert.className = `alert ${type} show`;

    setTimeout(() => {
      alert.classList.remove('show');
    }, 5000);
  }

  window.electronAPI.onAutoConnect(async () => {
    if (currentSettings.sipUsername && currentSettings.sipPassword) {
      setTimeout(() => {
        toggleConnection();
      }, 1000);
    }
  });

  // Charger les paramètres au démarrage
  loadSettings();
}