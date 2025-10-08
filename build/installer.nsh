!macro customInit
  ; Force kill any running instances before installation
  DetailPrint "Fermeture de l'application en cours..."
  nsExec::Exec 'taskkill /F /IM Interfone-Odoo-Connector.exe /T 2>nul'
  Pop $0
  Sleep 1000

  ; Try again to be sure
  nsExec::Exec 'taskkill /F /IM Interfone-Odoo-Connector.exe /T 2>nul'
  Pop $0
  Sleep 1500

  ; Clean up any orphaned tray icons
  nsExec::Exec 'taskkill /F /FI "IMAGENAME eq Interfone*" 2>nul'
  Pop $0
  Sleep 500
!macroend

!macro customInstall
  ; Additional install steps if needed
  DetailPrint "Installation de Interfone Odoo Connector..."
!macroend

!macro customUnInit
  ; Force kill before uninstall
  DetailPrint "Fermeture de l'application avant désinstallation..."
  nsExec::Exec 'taskkill /F /IM Interfone-Odoo-Connector.exe /T 2>nul'
  Pop $0
  Sleep 1500

  ; Clean system tray
  nsExec::Exec 'taskkill /F /FI "IMAGENAME eq Interfone*" 2>nul'
  Pop $0
  Sleep 500
!macroend

!macro customUnInstall
  ; Clean up any remaining files
  DetailPrint "Nettoyage des fichiers temporaires..."
  Delete "$INSTDIR\*.log"
  Delete "$INSTDIR\*.tmp"
!macroend
