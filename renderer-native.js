// Ce fichier gère la logique côté rendu avec le client SIP natif

// Client SIP natif intégré
class NativeSIPClient {
  constructor() {
    this.connected = false;
    this.onIncomingCall = null;
    this.onStatusChange = null;
  }

  async connect(config) {

    try {
      // Appeler le client SIP natif dans le processus principal
      const result = await window.electronAPI.sipConnect(config);

      if (result.success) {
        this.connected = true;
        if (this.onStatusChange) {
          this.onStatusChange(true);
        }
        return true;
      } else {
        throw new Error(result.error || 'Connexion échouée');
      }
    } catch (error) {
      this.connected = false;
      if (this.onStatusChange) {
        this.onStatusChange(false);
      }
      throw error;
    }
  }

  async disconnect() {

    try {
      const result = await window.electronAPI.sipDisconnect();
      this.connected = false;

      if (this.onStatusChange) {
        this.onStatusChange(false);
      }
    } catch (error) {
    }
  }

  async checkStatus() {
    try {
      const status = await window.electronAPI.sipStatus();
      this.connected = status.connected;
      return status.connected;
    } catch (error) {
      return false;
    }
  }

  isConnected() {
    return this.connected;
  }
}

// Code spécifique à settings.html
if (window.location.pathname.includes('settings.html')) {

  let sipClient = new NativeSIPClient();
  let currentSettings = {};


  // Écouter les changements de statut SIP depuis le processus principal
  window.electronAPI.onSipStatusChanged((connected) => {
    sipClient.connected = connected;
    updateStatus(connected);
  });

  sipClient.onStatusChange = (connected) => {
    updateStatus(connected);
  };

  sipClient.onIncomingCall = (callerNumber) => {
    // Les appels entrants sont gérés directement par le processus principal
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

    // Vérifier le statut au chargement
    await sipClient.checkStatus();
    updateStatus(sipClient.isConnected());
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
    const btn = document.getElementById('connectBtn');
    const loader = document.getElementById('loader');

    if (!btn) {
      return;
    }


    if (sipClient.isConnected()) {
      btn.disabled = true;

      try {
        await sipClient.disconnect();
        btn.textContent = 'Se connecter';
        showAlert('Déconnecté du serveur SIP', 'success');
      } catch (error) {
        showAlert('Erreur de déconnexion: ' + error.message, 'error');
      } finally {
        btn.disabled = false;
      }
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
      if (loader) {
        loader.classList.add('show');
      }


      try {
        await sipClient.connect(settings);
        btn.textContent = 'Se déconnecter';
        showAlert('Connecté au serveur SIP Interfone (UDP natif)', 'success');
      } catch (error) {
        showAlert('Erreur de connexion: ' + error.message, 'error');
      } finally {
        btn.disabled = false;
        if (loader) {
          loader.classList.remove('show');
        }
      }
    }
  }

  // Fonction de test d'appel
  window.testCall = async function() {

    if (!sipClient.isConnected()) {
      showAlert('Veuillez d\'abord vous connecter au serveur SIP', 'error');
      return;
    }

    try {
      const result = await window.electronAPI.sipTestCall();
      if (result.success) {
        showAlert('Appel de test simulé avec le numéro 0494202552', 'success');
      } else {
        showAlert('Erreur lors du test: ' + result.error, 'error');
      }
    } catch (error) {
      showAlert('Erreur lors du test d\'appel', 'error');
    }
  }

  function updateStatus(connected) {
    const status = document.getElementById('status');
    const connectBtn = document.getElementById('connectBtn');

    if (connected) {
      status.textContent = '✅ Connecté (SIP natif)';
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