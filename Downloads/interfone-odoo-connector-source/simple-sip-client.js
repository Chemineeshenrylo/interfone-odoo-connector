// Client SIP simplifié pour intercepter les appels Interfone
// Version démo qui simule la réception d'appels

class SimpleSIPClient {
  constructor() {
    this.connected = false;
    this.onIncomingCall = null;
    this.onStatusChange = null;
    this.simulationInterval = null;
    this.config = null;
  }

  async connect(config) {
    console.log('🔵 Simulation de connexion SIP Interfone...');
    console.log('📋 Configuration:', {
      sipUsername: config.sipUsername,
      sipServer: config.sipServer,
      note: 'Mode démo - simulation des appels'
    });

    try {
      this.config = config;

      // Simuler une connexion réussie après 2 secondes
      setTimeout(() => {
        this.connected = true;
        console.log('✅ Mode démo activé - Simulation d\'appels SIP');

        if (this.onStatusChange) {
          this.onStatusChange(true);
        }

        // Démarrer la simulation d'appels aléatoires (toutes les 30-60 secondes en démo)
        this.startCallSimulation();
      }, 2000);

      return true;
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
    console.log('🔌 Déconnexion SIP...');
    this.connected = false;
    this.stopCallSimulation();

    if (this.onStatusChange) {
      this.onStatusChange(false);
    }
  }

  startCallSimulation() {
    // Simuler des appels entrants de temps en temps (pour démo)
    this.simulationInterval = setInterval(() => {
      if (this.connected && Math.random() > 0.7) { // 30% de chance à chaque cycle
        this.simulateIncomingCall();
      }
    }, 45000); // Toutes les 45 secondes
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
      '+32 486 78 90 12'
    ];

    const randomNumber = testNumbers[Math.floor(Math.random() * testNumbers.length)];
    console.log('📞 Simulation d\'appel entrant:', randomNumber);

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

// Fonction pour créer une vraie connexion SIP (pour plus tard)
function createRealSIPConnection(config) {
  console.log('🚧 Connexion SIP réelle non implémentée dans cette version démo');
  console.log('📝 Pour une connexion réelle, il faudrait :');
  console.log('   - Un client SIP natif (pjsip, linphone, etc.)');
  console.log('   - Ou un bridge SIP vers WebSocket côté serveur');
  console.log('   - Ou utiliser un service tiers comme Twilio');

  // Pour l'instant, retourner le client simulé
  return new SimpleSIPClient();
}

// Export pour utilisation
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SimpleSIPClient, createRealSIPConnection };
} else {
  window.SimpleSIPClient = SimpleSIPClient;
  window.createRealSIPConnection = createRealSIPConnection;
}