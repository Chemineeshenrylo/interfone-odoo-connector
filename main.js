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

// Nettoyer proprement avant de quitter (important pour Windows)
app.on('before-quit', async (event) => {
  if (!app.isQuitting) {
    event.preventDefault();
    app.isQuitting = true;

    console.log('🧹 Nettoyage avant fermeture...');

    // Détruire le Tray en premier (CRUCIAL pour Windows)
    if (tray && !tray.isDestroyed()) {
      console.log('🗑️ Destruction du Tray...');
      tray.destroy();
      tray = null;
    }

    // Déconnecter le client SIP proprement
    if (sipClient) {
      try {
        console.log('🔌 Déconnexion du client SIP...');
        await sipClient.disconnect();
      } catch (error) {
        console.error('Erreur lors de la déconnexion SIP:', error);
      }
    }

    // Fermer toutes les fenêtres
    if (popupWindow && !popupWindow.isDestroyed()) {
      popupWindow.destroy();
      popupWindow = null;
    }

    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.destroy();
      mainWindow = null;
    }

    console.log('✅ Nettoyage terminé');

    // Quitter réellement
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
  // Désactiver complètement la vérification de signature pour éviter les erreurs macOS
  process.env.ELECTRON_UPDATER_FORCE_DEV_UPDATE_CONFIG = 'true';
  process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';

  // Configuration pour ignorer les erreurs de signature
  autoUpdater.autoDownload = false;
  autoUpdater.allowDowngrade = false;

  // IMPORTANT: Désactiver complètement la vérification de signature pour macOS
  if (process.platform === 'darwin') {
    autoUpdater.forceDevUpdateConfig = true;
    process.env.ELECTRON_BUILDER_ALLOW_UNRESOLVED_DEPENDENCIES = 'true';
  }

  // Forcer l'installation sans vérification de signature
  autoUpdater.allowPrerelease = false;
  autoUpdater.fullChangelog = true;
  autoUpdater.autoInstallOnAppQuit = true;

  // Logs pour debug
  autoUpdater.logger = console;

  // Configuration de l'auto-updater
  autoUpdater.checkForUpdatesAndNotify();

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
    // Télécharger manuellement pour éviter la vérification de signature
    autoUpdater.downloadUpdate();
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
        // Forcer la fermeture et l'installation
        setImmediate(() => {
          app.isQuitting = true;
          autoUpdater.quitAndInstall(false, true);
        });
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
  console.log('🔄 Installation de la mise à jour...');

  // Détruire le Tray en premier (CRUCIAL pour Windows)
  if (tray && !tray.isDestroyed()) {
    console.log('🗑️ Destruction du Tray...');
    tray.destroy();
    tray = null;
  }

  // Nettoyer proprement avant de quitter
  if (sipClient) {
    console.log('🔌 Déconnexion du client SIP...');
    await sipClient.disconnect();
  }

  // Fermer toutes les fenêtres
  if (popupWindow && !popupWindow.isDestroyed()) {
    popupWindow.destroy();
    popupWindow = null;
  }

  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.destroy();
    mainWindow = null;
  }

  // Marquer qu'on quitte
  app.isQuitting = true;

  // Sur Windows avec oneClick, on force la fermeture immédiate
  // L'installateur NSIS se charge de tout avec taskkill
  if (process.platform === 'win32') {
    console.log('💪 Fermeture forcée pour Windows oneClick...');
    setTimeout(() => {
      app.exit(0);
    }, 500);
  } else {
    // macOS: utiliser quitAndInstall normalement
    setTimeout(() => {
      console.log('✅ Installation de la mise à jour...');
      autoUpdater.quitAndInstall(false, true);
    }, 500);
  }
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

    let currentCallNumber = null;
    let callStatusSent = false;

    sipClient.on('incoming-call', (callerNumber) => {
      console.log('📞 [MAIN] Appel entrant intercepté:', callerNumber);
      currentCallNumber = callerNumber;
      callStatusSent = false;

      // Envoyer l'appel entrant à la fenêtre principale
      if (mainWindow) {
        mainWindow.webContents.send('call-event', {
          phoneNumber: callerNumber,
          status: 'incoming'
        });
      }

      createPopupWindow(callerNumber);
    });

    sipClient.on('call-answered', () => {
      console.log('✅ [MAIN] Appel décroché - Fermeture de la popup');
      if (mainWindow && !callStatusSent) {
        console.log('✅ [MAIN] Envoi événement ANSWERED');
        mainWindow.webContents.send('call-event', {
          status: 'answered'
        });
        callStatusSent = true;
      }
      if (popupWindow) {
        popupWindow.close();
      }
      currentCallNumber = null;
    });

    sipClient.on('call-ended', () => {
      console.log('📴 [MAIN] Appel terminé - Fermeture de la popup');
      if (popupWindow) {
        popupWindow.close();
      }
      // Si aucun statut n'a été envoyé, c'est que l'appel a été raccroché normalement
      currentCallNumber = null;
      callStatusSent = false;
    });

    sipClient.on('call-cancelled', () => {
      console.log('🚫 [MAIN] Appel annulé - Fermeture de la popup');
      if (mainWindow && !callStatusSent) {
        // Sur un système d'entreprise, CANCEL = quelqu'un a décroché
        console.log('✅ [MAIN] Envoi événement ANSWERED (cancel = décroché ailleurs)');
        mainWindow.webContents.send('call-event', {
          status: 'answered'
        });
        callStatusSent = true;
      }
      if (popupWindow) {
        popupWindow.close();
      }
      currentCallNumber = null;
    });

    sipClient.on('call-timeout', () => {
      console.log('⏰ [MAIN] Timeout de sonnerie - Fermeture de la popup');
      if (mainWindow && !callStatusSent) {
        // Si timeout mais pas encore de statut, c'est vraiment manqué
        // MAIS si on est dans un système d'entreprise, timeout = quelqu'un a peut-être décroché ailleurs
        // Changeons en "answered" par défaut
        console.log('✅ [MAIN] Envoi événement ANSWERED (timeout = probablement décroché ailleurs)');
        mainWindow.webContents.send('call-event', {
          status: 'answered'
        });
        callStatusSent = true;
      }
      if (popupWindow) {
        popupWindow.close();
      }
      currentCallNumber = null;
    });

    sipClient.on('call-rejected', () => {
      console.log('🔴 [MAIN] Appel rejeté - Fermeture de la popup');
      if (mainWindow && !callStatusSent) {
        console.log('🔴 [MAIN] Envoi événement CANCELLED (rejected)');
        mainWindow.webContents.send('call-event', {
          status: 'cancelled'
        });
        callStatusSent = true;
      }
      if (popupWindow) {
        popupWindow.close();
      }
      currentCallNumber = null;
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

  // Supprimer tous les zéros en début de numéro
  // Ex: 0494202552 -> 494202552
  cleanNumber = cleanNumber.replace(/^0+/, '');

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