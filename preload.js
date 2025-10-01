const { ipcRenderer } = require('electron');

// Exposer directement dans window car contextIsolation = false
window.electronAPI = {
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  getSettings: () => ipcRenderer.invoke('get-settings'),

  // Nouvelle API SIP native
  sipConnect: (config) => ipcRenderer.invoke('sip-connect', config),
  sipDisconnect: () => ipcRenderer.invoke('sip-disconnect'),
  sipStatus: () => ipcRenderer.invoke('sip-status'),
  sipTestCall: () => ipcRenderer.invoke('sip-test-call'),

  // Ancienne API pour compatibilité
  sendSipConnected: () => ipcRenderer.send('sip-connected'),
  sendSipDisconnected: () => ipcRenderer.send('sip-disconnected'),
  sendIncomingCall: (callerNumber) => ipcRenderer.send('incoming-call', callerNumber),

  openOdoo: (phoneNumber) => ipcRenderer.send('open-odoo', phoneNumber),
  closePopup: () => ipcRenderer.send('close-popup'),
  showSettings: () => ipcRenderer.send('show-settings'),

  onAutoConnect: (callback) => {
    ipcRenderer.on('auto-connect', callback);
  },

  onIncomingCall: (callback) => {
    ipcRenderer.on('incoming-call', (event, callerNumber) => {
      callback(callerNumber);
    });
  },

  onNewCall: (callback) => {
    ipcRenderer.on('new-call', (event, callerNumber) => {
      callback(callerNumber);
    });
  },

  onSipStatusChanged: (callback) => {
    ipcRenderer.on('sip-status-changed', (event, connected) => {
      callback(connected);
    });
  }
};