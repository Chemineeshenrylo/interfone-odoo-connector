const { app, BrowserWindow, ipcMain, Tray, Menu, shell, Notification, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs');
const Store = require('electron-store').default || require('electron-store');
const NativeSIPClient = require('./native-sip-client');

const store = new Store();
let mainWindow = null;
let popupWindow = null;
let tray = null;
let sipConnected = false;
let sipClient = null;
let userStatus = 'available'; // 'available', 'busy', 'away'

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 600,
    height: 700,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: false
    },
    icon: path.join(__dirname, 'assets', 'icon.png'),
    show: false,
    skipTaskbar: true // Ne pas apparaître dans la barre des tâches
  });

  mainWindow.loadFile('settings.html');

  mainWindow.once('ready-to-show', () => {
    // Ne pas afficher automatiquement, seulement via le tray
  });

  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
}

function createPopupWindow(callerNumber) {
  // Si l'utilisateur est en mode "Occupé", ne pas afficher de popup
  if (userStatus === 'busy') {
    return;
  }

  // Si l'utilisateur est "Absent", afficher une notification discrète uniquement
  if (userStatus === 'away') {
    if (Notification.isSupported()) {
      new Notification({
        title: 'Appel manqué - Interfone',
        body: `Appel de ${callerNumber}`,
        silent: true
      }).show();
    }
    return;
  }

  // Mode "Disponible" : afficher la popup normale
  if (popupWindow) {
    popupWindow.focus();
    popupWindow.webContents.send('new-call', callerNumber);
    return;
  }

  popupWindow = new BrowserWindow({
    width: 400,
    height: 300,
    alwaysOnTop: true,
    frame: true,
    resizable: false,
    skipTaskbar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  popupWindow.loadFile('popup.html');

  popupWindow.on('closed', () => {
    popupWindow = null;
  });

  popupWindow.webContents.once('did-finish-load', () => {
    popupWindow.webContents.send('incoming-call', callerNumber);
  });
}

function createTray() {
  try {
    // Essayer d'abord avec tray.png, puis icon.png en fallback
    let iconPath = path.join(__dirname, 'assets', 'tray.png');
    if (!require('fs').existsSync(iconPath)) {
      iconPath = path.join(__dirname, 'assets', 'icon.png');
    }

    tray = new Tray(iconPath);

    // Vérifier si le tray a été créé avec succès
    if (!tray || tray.isDestroyed()) {
      console.error('Échec création du tray');
      return;
    }

    console.log('✅ Tray créé avec succès');
  } catch (error) {
    console.error('💥 Erreur création tray:', error);
    return;
  }

  updateTrayMenu();

  tray.setToolTip('Interfone Odoo Connector');

  tray.on('click', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

function updateTrayMenu() {
  if (!tray) return;

  const statusLabels = {
    'available': '🟢 Disponible',
    'busy': '🔴 Occupé',
    'away': '🟡 Absent'
  };

  const contextMenu = Menu.buildFromTemplate([
    {
      label: sipConnected ? '✅ Connecté' : '❌ Déconnecté',
      enabled: false
    },
    { type: 'separator' },
    {
      label: 'Statut',
      submenu: [
        {
          label: '🟢 Disponible',
          type: 'radio',
          checked: userStatus === 'available',
          click: () => {
            userStatus = 'available';
            updateTrayMenu();
          }
        },
        {
          label: '🔴 Occupé',
          type: 'radio',
          checked: userStatus === 'busy',
          click: () => {
            userStatus = 'busy';
            updateTrayMenu();
          }
        },
        {
          label: '🟡 Absent',
          type: 'radio',
          checked: userStatus === 'away',
          click: () => {
            userStatus = 'away';
            updateTrayMenu();
          }
        }
      ]
    },
    { type: 'separator' },
    {
      label: 'Paramètres',
      click: () => {
        mainWindow.show();
        mainWindow.focus();
      }
    },
    {
      label: 'Quitter',
      click: () => {
        app.isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);
  tray.setTitle(statusLabels[userStatus]);
}

app.whenReady().then(() => {
  createMainWindow();
  createTray();

  // Configuration auto-updater
  setupAutoUpdater();

  // Auto-connection silencieuse si les paramètres existent
  setTimeout(() => {
    const settings = store.get('settings');
    if (settings && settings.sipUsername && settings.sipPassword) {
      mainWindow.webContents.send('auto-connect');
    }
  }, 1000);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});

// ===== AUTO-UPDATER SETUP =====
function setupAutoUpdater() {
  // Désactiver la vérification de signature pour éviter les erreurs macOS
  process.env.ELECTRON_UPDATER_FORCE_DEV_UPDATE_CONFIG = 'true';

  // Configuration de l'auto-updater
  autoUpdater.checkForUpdatesAndNotify();

  // Logs pour debug
  autoUpdater.logger = console;

  // Événements auto-updater
  autoUpdater.on('checking-for-update', () => {
    console.log('🔍 Vérification des mises à jour...');
    if (mainWindow) {
      mainWindow.webContents.send('update-status', { status: 'checking' });
    }
  });

  autoUpdater.on('update-available', (info) => {
    console.log('📥 Mise à jour disponible:', info.version);
    if (mainWindow) {
      mainWindow.webContents.send('update-status', {
        status: 'available',
        version: info.version
      });
    }
  });

  autoUpdater.on('update-not-available', (info) => {
    console.log('✅ Application à jour:', info.version);
    if (mainWindow) {
      mainWindow.webContents.send('update-status', {
        status: 'not-available',
        version: info.version
      });
    }
  });

  autoUpdater.on('error', (err) => {
    console.error('❌ Erreur mise à jour:', err);
    if (mainWindow) {
      mainWindow.webContents.send('update-status', {
        status: 'error',
        error: err.message
      });
    }
  });

  autoUpdater.on('download-progress', (progressObj) => {
    let log_message = `📥 Téléchargement ${progressObj.percent.toFixed(1)}%`;
    console.log(log_message);
    if (mainWindow) {
      mainWindow.webContents.send('update-status', {
        status: 'downloading',
        progress: progressObj.percent
      });
    }
  });

  autoUpdater.on('update-downloaded', (info) => {
    console.log('✅ Mise à jour téléchargée:', info.version);
    if (mainWindow) {
      mainWindow.webContents.send('update-status', {
        status: 'downloaded',
        version: info.version
      });
    }

    // Proposer d'installer immédiatement
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Mise à jour prête',
      message: `La mise à jour vers la version ${info.version} est prête à être installée.`,
      detail: 'L\'application va redémarrer pour appliquer la mise à jour.',
      buttons: ['Installer maintenant', 'Plus tard'],
      defaultId: 0
    }).then((result) => {
      if (result.response === 0) {
        autoUpdater.quitAndInstall();
      }
    });
  });
}

// IPC Handlers pour l'auto-updater
ipcMain.handle('check-for-updates', async () => {
  try {
    return await autoUpdater.checkForUpdates();
  } catch (error) {
    console.error('Erreur lors de la vérification des mises à jour:', error);
    throw error;
  }
});

ipcMain.handle('install-update', async () => {
  autoUpdater.quitAndInstall();
});

ipcMain.handle('save-settings', async (event, settings) => {
  store.set('settings', settings);
  return true;
});

ipcMain.handle('get-settings', async () => {
  return store.get('settings') || {};
});

// Gestion de la connexion SIP native
ipcMain.handle('sip-connect', async (event, config) => {
  try {
    console.log('🔵 Demande de connexion SIP native...');

    if (sipClient) {
      await sipClient.disconnect();
    }

    sipClient = new NativeSIPClient();

    // Écouter les événements du client SIP
    sipClient.on('registered', () => {
      console.log('✅ SIP enregistré avec succès');
      sipConnected = true;
      updateTrayMenu();

      if (Notification.isSupported()) {
        new Notification({
          title: 'Interfone Connecté',
          body: 'Connexion SIP native établie avec succès'
        }).show();
      }

      // Mode test désactivé - prêt pour vrais appels

      // Notifier le renderer
      if (mainWindow) {
        mainWindow.webContents.send('sip-status-changed', true);
      }
    });

    sipClient.on('incoming-call', (callerNumber) => {
      console.log('📞 Appel entrant intercepté:', callerNumber);
      createPopupWindow(callerNumber);
    });

    sipClient.on('disconnected', () => {
      console.log('🔌 SIP déconnecté');
      sipConnected = false;
      updateTrayMenu();

      if (mainWindow) {
        mainWindow.webContents.send('sip-status-changed', false);
      }
    });

    // Tenter la connexion
    await sipClient.connect(config);
    return { success: true };

  } catch (error) {
    console.error('💥 Erreur connexion SIP native:', error);
    sipConnected = false;
    updateTrayMenu();

    if (mainWindow) {
      mainWindow.webContents.send('sip-status-changed', false);
    }

    return { success: false, error: error.message };
  }
});

ipcMain.handle('sip-disconnect', async () => {
  try {
    if (sipClient) {
      // Arrêter le mode test si activé
      if (sipClient.stopTestMode) {
        sipClient.stopTestMode();
      }
      await sipClient.disconnect();
      sipClient = null;
    }
    sipConnected = false;
    updateTrayMenu();
    return { success: true };
  } catch (error) {
    console.error('💥 Erreur déconnexion SIP:', error);
    return { success: false, error: error.message };
  }
});

// Ajouter une fonction pour tester manuellement l'interception
ipcMain.handle('sip-test-call', async () => {
  try {
    if (sipClient && sipClient.isConnected()) {
      sipClient.simulateIncomingCall();
      return { success: true };
    } else {
      return { success: false, error: 'Client SIP non connecté' };
    }
  } catch (error) {
    console.error('💥 Erreur test d\'appel:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('sip-status', () => {
  return { connected: sipConnected };
});

ipcMain.on('incoming-call', (event, callerNumber) => {
  createPopupWindow(callerNumber);
});

ipcMain.on('open-odoo', (event, phoneNumber) => {
  const settings = store.get('settings') || {};
  const odooUrl = settings.odooUrl || 'https://odoo.com';

  // Nettoyer le numéro : espaces, tirets, parenthèses
  let cleanNumber = phoneNumber.replace(/[\s\-\(\)]/g, '');

  // Supprimer le + initial
  cleanNumber = cleanNumber.replace(/^\+/, '');

  // Supprimer les indicatifs pays courants (32 = Belgique, 33 = France, etc.)
  if (cleanNumber.startsWith('32')) {
    cleanNumber = cleanNumber.substring(2);
  } else if (cleanNumber.startsWith('33')) {
    cleanNumber = cleanNumber.substring(2);
  } else if (cleanNumber.startsWith('31')) {
    cleanNumber = cleanNumber.substring(2);
  } else if (cleanNumber.startsWith('49')) {
    cleanNumber = cleanNumber.substring(2);
  } else if (cleanNumber.startsWith('44')) {
    cleanNumber = cleanNumber.substring(2);
  }

  const searchNumber = cleanNumber;
  const interfoneUrl = `${odooUrl}/web#action=424&model=res.partner&view_type=list&cids=5-2-1&menu_id=283#interfone:${searchNumber}`;

  shell.openExternal(interfoneUrl);

  if (popupWindow) {
    popupWindow.close();
  }
});

ipcMain.on('close-popup', () => {
  if (popupWindow) {
    popupWindow.close();
  }
});

ipcMain.on('show-settings', () => {
  mainWindow.show();
});